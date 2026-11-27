# Pulse — a Spotify web client

Next.js 15 (App Router) · TypeScript · Tailwind CSS · Spotify Web API · Spotify Web Playback SDK.
Built by me during my second year of BSc.

Two modes, one UI:

| Mode | Data | Audio engine |
|------|------|--------------|
| **Login with Spotify** | Web API (`/me/top/*`, `/me/playlists`, `/playlists/{id}/items`, `/search?limit=10`) | Web Playback SDK (`Spotify.Player`, no `<audio>` tag) |
| **Try the demo** | `lib/mock-data.ts` | HTML5 `<audio>` (SoundHelix sample MP3s) |

Both engines implement the same `usePlayer()` contract (`context/PlayerContext.tsx`), so every card, row and the bottom bar work identically in either mode.

## 1. Setup

```bash
npm install
cp .env.local.example .env.local
```

1. Go to <https://developer.spotify.com/dashboard> → **Create app**.
2. Tick **Web API** and **Web Playback SDK**.
3. Add this **Redirect URI** (exact match, and use the loopback IP — Spotify rejects `localhost`):
   `http://127.0.0.1:3000/callback`
4. Copy the **Client ID** into `.env.local`:

```env
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_client_id_here
NEXT_PUBLIC_REDIRECT_URI=http://127.0.0.1:3000/callback
```

5. While the app is in **Development Mode**, add your Spotify account under *User Management* (max 25 users).
6. `npm run dev`, then open **http://127.0.0.1:3000** (not `localhost` — the PKCE verifier lives in
   `localStorage`, which is per-origin, so you must start and finish login on the same host).

> Playback through the Web Playback SDK requires **Spotify Premium**. Free accounts can browse but get an
> "account_error" (shown in the player bar). Demo mode needs no account.

## 2. Structure

```
app/
  page.tsx                 Providers + AppShell
  callback/page.tsx        OAuth redirect: ?code= -> tokens -> reload
lib/
  spotify.ts               PKCE login, token refresh, spotifyFetch, typed wrappers, playback calls
  spotify-types.ts         Raw API types      models.ts   App models (Track, Artist, Playlist)
  data.ts                  Mode-aware loaders  mock-data.ts Demo catalogue (MP3 + cover URLs)
context/
  AuthContext.tsx          signed-out | spotify | demo
  PlayerContext.tsx        Shared player contract + usePlayer()
  SpotifyPlayerContext.tsx Web Playback SDK engine (device_id, player_state_changed, controls)
  DemoPlayerContext.tsx    HTML5 <audio> engine
components/
  AppShell.tsx             Layout: Sidebar + MainView + PlayerBar (+ mobile tab bar)
  Sidebar.tsx  MainView.tsx  PlayerBar.tsx  Hero.tsx  TrackCard.tsx  Slider.tsx  LoginScreen.tsx
  views/                   Home, Explore, Search, Library, Playlist
scripts/generate-covers.mjs  Regenerates the demo cover art (SVG)
```

## 3. Notes on the 2026 API constraints

* **Scopes**: `streaming user-read-email user-read-private user-read-playback-state user-modify-playback-state user-library-read playlist-read-private user-top-read`.
* **Not used** (deprecated): `/browse/new-releases`, `/browse/categories`, `/artists/{id}/top-tracks`, `/playlists/{id}/tracks`.
  *Explore* is built from `/me/top/artists` instead.
* **Playlist items** are read from `entry.item` (falling back to `entry.track`); episodes and nulls are skipped.
  In Development Mode Spotify only returns items for playlists you own or collaborate on — other playlists show a friendly error.
* **Search** always sends `limit=10`.
* **Recently Played**: that endpoint needs the `user-read-recently-played` scope, which isn't in the requested list, so in Spotify mode the
  grid is "Heavy Rotation" (top tracks, last 4 weeks). To get true history, add the scope to `SCOPES` in `lib/spotify.ts` and call `GET /v1/me/player/recently-played`.
* **Tokens** are stored in `localStorage` and refreshed automatically 60 s before expiry (single in-flight refresh, one retry on 401, `Retry-After` honoured on 429).
* **Autoplay policy**: `player.activateElement()` is called inside the click handler before starting playback (required by Safari/iOS).

## 4. Scripts

`npm run dev` · `npm run build` · `npm run start` · `npm run typecheck`

