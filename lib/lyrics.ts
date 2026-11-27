/**
 * Lyrics loading.
 *  - Demo tracks: original lyrics from lib/mock-lyrics.ts.
 *  - Spotify tracks: the Spotify Web API has no lyrics endpoint, so synced (LRC) lyrics are looked up
 *    at runtime from LRCLIB (https://lrclib.net), a free community database with CORS enabled.
 *    No lyrics are bundled with this app. Check LRCLIB's terms and the rights position of the
 *    lyrics you display before shipping this publicly.
 */
import type { Track } from "./models";
import { demoLyricLines } from "./mock-lyrics";

export interface LyricLine {
  /** Start time in ms, or -1 for unsynced lyrics. */
  timeMs: number;
  /** Empty string = instrumental gap. */
  text: string;
}

export interface Lyrics {
  trackUri: string;
  lines: LyricLine[];
  synced: boolean;
  source: "demo" | "lrclib";
}

/** Parses `[mm:ss.xx] text` lines (multiple timestamps per line allowed). */
export function parseLrc(lrc: string): LyricLine[] {
  const out: LyricLine[] = [];
  const stamp = /\[(\d{1,3}):(\d{2}(?:[.:]\d{1,3})?)\]/g;
  for (const raw of lrc.split(/\r?\n/)) {
    const times: number[] = [];
    let last = 0;
    for (const m of raw.matchAll(stamp)) {
      times.push(Math.round((Number(m[1]) * 60 + Number(m[2].replace(":", "."))) * 1000));
      last = (m.index ?? 0) + m[0].length;
    }
    if (!times.length) continue; // metadata tags like [ar:Artist]
    const text = raw.slice(last).trim();
    for (const timeMs of times) out.push({ timeMs, text });
  }
  return out.sort((a, b) => a.timeMs - b.timeMs);
}

interface LrclibResult {
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
  instrumental?: boolean;
}

const LRCLIB = "https://lrclib.net/api";

/** "Song - Remastered 2011" / "Song (feat. X)" -> "Song" improves match rates. */
const cleanTitle = (t: string) => t.replace(/\s+-\s+.*$/, "").replace(/\s*[([].*?[)\]]\s*/g, " ").trim() || t;

async function lrclibFetch(path: string, params: Record<string, string>): Promise<LrclibResult | LrclibResult[] | null> {
  const res = await fetch(`${LRCLIB}${path}?${new URLSearchParams(params)}`, { signal: AbortSignal.timeout(8000) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`LRCLIB ${res.status}`);
  return res.json();
}

async function fromLrclib(track: Track): Promise<Lyrics | null> {
  const artist = track.artist.split(",")[0].trim();
  const title = cleanTitle(track.title);

  let hit = (await lrclibFetch("/get", {
    track_name: title,
    artist_name: artist,
    album_name: track.album,
    duration: String(Math.round(track.durationMs / 1000)),
  }).catch(() => null)) as LrclibResult | null;

  if (!hit || (!hit.syncedLyrics && !hit.plainLyrics)) {
    const list = (await lrclibFetch("/search", { track_name: title, artist_name: artist })) as LrclibResult[] | null;
    hit = list?.find((r) => r.syncedLyrics) ?? list?.find((r) => r.plainLyrics) ?? null;
  }
  if (!hit || hit.instrumental) return null;

  if (hit.syncedLyrics) {
    const lines = parseLrc(hit.syncedLyrics);
    if (lines.length) return { trackUri: track.uri, lines, synced: true, source: "lrclib" };
  }
  if (hit.plainLyrics) {
    const lines = hit.plainLyrics.split(/\r?\n/).map((text) => ({ timeMs: -1, text: text.trim() }));
    return { trackUri: track.uri, lines, synced: false, source: "lrclib" };
  }
  return null;
}

const cache = new Map<string, Promise<Lyrics | null>>();

export function loadLyrics(track: Track): Promise<Lyrics | null> {
  const hit = cache.get(track.uri);
  if (hit) return hit;

  const job: Promise<Lyrics | null> = track.uri.startsWith("demo:")
    ? Promise.resolve(
        (() => {
          const lines = demoLyricLines(track.id);
          return lines ? { trackUri: track.uri, lines, synced: true, source: "demo" as const } : null;
        })(),
      )
    : fromLrclib(track);

  cache.set(track.uri, job);
  // Don't cache network failures - allow a retry next time the track is opened.
  job.catch(() => cache.delete(track.uri));
  return job;
}
