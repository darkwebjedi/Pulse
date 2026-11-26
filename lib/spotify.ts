/**
 * Spotify helpers: PKCE OAuth, token refresh and typed Web API wrappers.
 * Browser-only (uses window, localStorage and Web Crypto).
 */
import type { Artist, Playlist, Track } from "./models";
import type {
  PlaylistItemEntry,
  SearchResponse,
  SpotifyArtist,
  SpotifyImage,
  SpotifyPage,
  SpotifyPlaylist,
  SpotifyTrack,
  SpotifyUser,
  TimeRange,
} from "./spotify-types";

// NEXT_PUBLIC_* must be referenced literally so Next can inline them at build time.
const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ?? "";
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI ?? "";

const AUTH_URL = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API_URL = "https://api.spotify.com/v1";

export const SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-library-read",
  "playlist-read-private",
  "user-top-read",
];

/** Spotify's maximum `limit` for /search in Development Mode. */
export const SEARCH_LIMIT = 10;

const KEYS = {
  tokens: "pulse:spotify:tokens",
  verifier: "pulse:spotify:verifier",
  state: "pulse:spotify:state",
};

/* ------------------------------------------------------------------ */
/* Storage                                                             */
/* ------------------------------------------------------------------ */

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  /** epoch ms */
  expiresAt: number;
}

function store(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode etc.) */
  }
}

function load(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function readTokens(): StoredTokens | null {
  const raw = load(KEYS.tokens);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredTokens;
  } catch {
    return null;
  }
}

/**
 * Login data (PKCE verifier, tokens) is stored per-origin, so the app must run on the same origin
 * as the registered redirect URI. If it doesn't (e.g. opened via localhost, redirect is 127.0.0.1),
 * hop to the right one. Returns true when a redirect was started.
 */
export function ensureRedirectOrigin(): boolean {
  if (!REDIRECT_URI) return false;
  try {
    const target = new URL(REDIRECT_URI);
    if (target.origin !== window.location.origin) {
      window.location.replace(`${target.origin}${window.location.pathname}${window.location.search}`);
      return true;
    }
  } catch {
    /* malformed redirect URI - ignore */
  }
  return false;
}

export const isConfigured = () => Boolean(CLIENT_ID && REDIRECT_URI);
export const hasStoredSession = () => readTokens() !== null;

export function logout() {
  store(KEYS.tokens, null);
  store(KEYS.verifier, null);
  store(KEYS.state, null);
}

/* ------------------------------------------------------------------ */
/* PKCE login                                                          */
/* ------------------------------------------------------------------ */

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function randomString(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => CHARSET[b % CHARSET.length]).join("");
}

async function codeChallengeFor(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Step 1 - send the browser to Spotify's consent screen. */
export async function loginWithSpotify(): Promise<void> {
  if (!isConfigured()) {
    throw new Error("Set NEXT_PUBLIC_SPOTIFY_CLIENT_ID and NEXT_PUBLIC_REDIRECT_URI in .env.local");
  }
  const verifier = randomString(64);
  const state = randomString(16);
  store(KEYS.verifier, verifier);
  store(KEYS.state, state);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    scope: SCOPES.join(" "),
    redirect_uri: REDIRECT_URI,
    code_challenge_method: "S256",
    code_challenge: await codeChallengeFor(verifier),
    state,
  });
  window.location.assign(`${AUTH_URL}?${params.toString()}`);
}

let callbackInFlight: Promise<void> | null = null;

/**
 * Step 2 - on the redirect page, swap `?code=` for tokens.
 * Memoised so React Strict Mode's double effect can't burn the one-time code twice.
 */
export function handleRedirectCallback(search: string): Promise<void> {
  if (callbackInFlight) return callbackInFlight;
  callbackInFlight = (async () => {
    const params = new URLSearchParams(search);
    const error = params.get("error");
    if (error) throw new Error(`Spotify denied access: ${error}`);

    const code = params.get("code");
    const returnedState = params.get("state");
    const verifier = load(KEYS.verifier);
    if (!code || !verifier) throw new Error("Missing authorization code - please try logging in again.");
    if (returnedState !== load(KEYS.state)) throw new Error("State mismatch - please try logging in again.");

    await requestTokens({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    });
    store(KEYS.verifier, null);
    store(KEYS.state, null);
  })();
  return callbackInFlight;
}

/* ------------------------------------------------------------------ */
/* Tokens                                                              */
/* ------------------------------------------------------------------ */

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

async function requestTokens(body: Record<string, string>): Promise<StoredTokens> {
  // Time out instead of hanging forever (blocked network, extension, VPN...).
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: CLIENT_ID, ...body }),
    signal: AbortSignal.timeout(15_000),
  }).catch((e: unknown) => {
    throw new Error(
      e instanceof DOMException && e.name === "TimeoutError"
        ? "Spotify's token endpoint didn't respond (15 s). Check your connection/ad-blocker and try again."
        : "Could not reach accounts.spotify.com. Check your connection/ad-blocker and try again.",
    );
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new SpotifyApiError(res.status, detail.error_description ?? detail.error ?? "Token request failed");
  }
  const json = (await res.json()) as TokenResponse;
  const previous = readTokens();
  const tokens: StoredTokens = {
    accessToken: json.access_token,
    // Refresh responses may omit a new refresh token - keep the old one.
    refreshToken: json.refresh_token ?? previous?.refreshToken ?? "",
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  store(KEYS.tokens, JSON.stringify(tokens));
  return tokens;
}

let refreshInFlight: Promise<string | null> | null = null;

/** Exchanges the refresh token for a new access token (concurrent calls share one request). */
export function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const current = readTokens();
    if (!current?.refreshToken) return null;
    try {
      const next = await requestTokens({ grant_type: "refresh_token", refresh_token: current.refreshToken });
      return next.accessToken;
    } catch (err) {
      // 400 invalid_grant => the refresh token was revoked/expired: force re-login.
      if (err instanceof SpotifyApiError && err.status >= 400 && err.status < 500) logout();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

/** Returns a valid access token, refreshing it first if it expires within 60 s. */
export async function getAccessToken(): Promise<string | null> {
  const tokens = readTokens();
  if (!tokens) return null;
  if (Date.now() < tokens.expiresAt - 60_000) return tokens.accessToken;
  return refreshAccessToken();
}

/* ------------------------------------------------------------------ */
/* Fetch wrapper                                                       */
/* ------------------------------------------------------------------ */

export class SpotifyApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "SpotifyApiError";
  }
}

type Query = Record<string, string | number | undefined>;

interface FetchOptions extends Omit<RequestInit, "body"> {
  query?: Query;
  json?: unknown;
}

export async function spotifyFetch<T>(path: string, options: FetchOptions = {}, attempt = 0): Promise<T> {
  const token = await getAccessToken();
  if (!token) throw new SpotifyApiError(401, "Not authenticated");

  const url = new URL(path.startsWith("http") ? path : `${API_URL}${path}`);
  for (const [k, v] of Object.entries(options.query ?? {})) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }

  const { query: _q, json, headers, ...init } = options;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : undefined,
  });

  // Token rejected: refresh once and retry.
  if (res.status === 401 && attempt === 0) {
    if (await refreshAccessToken()) return spotifyFetch<T>(path, options, attempt + 1);
  }
  // Rate limited: honour Retry-After once (capped at 5 s).
  if (res.status === 429 && attempt < 2) {
    const wait = Math.min(Number(res.headers.get("Retry-After") ?? 1), 5);
    await new Promise((r) => setTimeout(r, wait * 1000));
    return spotifyFetch<T>(path, options, attempt + 1);
  }
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new SpotifyApiError(res.status, body?.error?.message ?? res.statusText);
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/* ------------------------------------------------------------------ */
/* Mappers                                                             */
/* ------------------------------------------------------------------ */

/** Smallest image at least `min` px wide, else the largest available. */
export function pickImage(images: SpotifyImage[] | null | undefined, min = 300): string | null {
  if (!images?.length) return null;
  const sorted = [...images].sort((a, b) => (a.width ?? 0) - (b.width ?? 0));
  return (sorted.find((i) => (i.width ?? 0) >= min) ?? sorted[sorted.length - 1]).url;
}

export function toTrack(t: SpotifyTrack): Track {
  return {
    id: t.id,
    uri: t.uri,
    title: t.name,
    artist: t.artists.map((a) => a.name).join(", "),
    album: t.album?.name ?? "",
    image: pickImage(t.album?.images),
    durationMs: t.duration_ms,
  };
}

export function toArtist(a: SpotifyArtist): Artist {
  return { id: a.id, uri: a.uri, name: a.name, image: pickImage(a.images), genres: a.genres };
}

export function toPlaylist(p: SpotifyPlaylist): Playlist {
  return {
    id: p.id,
    uri: p.uri,
    name: p.name,
    image: pickImage(p.images),
    owner: p.owner?.display_name ?? p.owner?.id ?? "",
    total: p.items?.total ?? p.tracks?.total,
    description: p.description,
  };
}

const notNull = <T>(x: T | null | undefined): x is T => x != null;

/* ------------------------------------------------------------------ */
/* Typed endpoint wrappers                                             */
/* ------------------------------------------------------------------ */

export const getMe = () => spotifyFetch<SpotifyUser>("/me");

/** GET /v1/me/top/tracks */
export async function getTopTracks(timeRange: TimeRange = "medium_term", limit = 20): Promise<Track[]> {
  const page = await spotifyFetch<SpotifyPage<SpotifyTrack>>("/me/top/tracks", {
    query: { time_range: timeRange, limit },
  });
  return page.items.filter(notNull).map(toTrack);
}

/** GET /v1/me/top/artists */
export async function getTopArtists(timeRange: TimeRange = "medium_term", limit = 20): Promise<Artist[]> {
  const page = await spotifyFetch<SpotifyPage<SpotifyArtist>>("/me/top/artists", {
    query: { time_range: timeRange, limit },
  });
  return page.items.filter(notNull).map(toArtist);
}

/** GET /v1/me/playlists */
export async function getUserPlaylists(limit = 50): Promise<Playlist[]> {
  const page = await spotifyFetch<SpotifyPage<SpotifyPlaylist | null>>("/me/playlists", { query: { limit } });
  return page.items.filter(notNull).map(toPlaylist);
}

/**
 * GET /v1/playlists/{id}/items  (replaces the deprecated /tracks endpoint).
 * Track objects are nested under `.item`; episodes and null entries are skipped.
 */
export async function getPlaylistItems(id: string, limit = 50): Promise<Track[]> {
  const page = await spotifyFetch<SpotifyPage<PlaylistItemEntry>>(`/playlists/${id}/items`, {
    query: { limit },
  });
  return page.items
    .map((entry) => entry.item ?? entry.track)
    .filter(notNull)
    .filter((t) => !t.type || t.type === "track")
    .map(toTrack);
}

/** GET /v1/search - capped at 10 results per type in Development Mode. */
export async function search(q: string): Promise<{ tracks: Track[]; artists: Artist[] }> {
  const res = await spotifyFetch<SearchResponse>("/search", {
    query: { q, type: "track,artist", limit: SEARCH_LIMIT },
  });
  return {
    tracks: (res.tracks?.items ?? []).filter(notNull).map(toTrack),
    artists: (res.artists?.items ?? []).filter(notNull).map(toArtist),
  };
}

/* ------------------------------------------------------------------ */
/* Playback (Web API side - the audio itself comes from the Web SDK)   */
/* ------------------------------------------------------------------ */

/** PUT /v1/me/player/play?device_id={device_id} */
export function startPlayback(
  deviceId: string,
  opts: { uris: string[]; offsetPosition?: number; positionMs?: number },
) {
  return spotifyFetch<void>("/me/player/play", {
    method: "PUT",
    query: { device_id: deviceId },
    json: {
      uris: opts.uris,
      ...(opts.offsetPosition ? { offset: { position: opts.offsetPosition } } : {}),
      ...(opts.positionMs ? { position_ms: opts.positionMs } : {}),
    },
  });
}

/** PUT /v1/me/player - make our browser the active device. */
export function transferPlayback(deviceId: string, play = false) {
  return spotifyFetch<void>("/me/player", { method: "PUT", json: { device_ids: [deviceId], play } });
}
