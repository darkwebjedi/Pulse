/** One data-access surface for both modes, so views never care where data comes from. */
import { MOCK_ARTISTS, MOCK_PLAYLISTS, MOCK_TRACKS } from "./mock-data";
import type { AppMode, Artist, Playlist, Track } from "./models";
import * as spotify from "./spotify";

export interface HomeData {
  /** Hero carousel. */
  featured: Track[];
  /** "Recently played" grid. */
  recent: Track[];
  recentTitle: string;
  /** "Top charts" list. */
  charts: Track[];
  chartsTitle: string;
}

export async function loadHome(mode: AppMode): Promise<HomeData> {
  if (mode === "demo") {
    return {
      featured: MOCK_TRACKS.slice(0, 4),
      recent: [...MOCK_TRACKS].reverse().slice(0, 6),
      recentTitle: "Recently Played",
      charts: [...MOCK_TRACKS].sort((a, b) => Number(a.id) * 7 % 11 - Number(b.id) * 7 % 11),
      chartsTitle: "Top Charts",
    };
  }
  // The scope list has no `user-read-recently-played`, so Spotify mode uses top-items instead.
  const [featured, recent, charts] = await Promise.all([
    spotify.getTopTracks("medium_term", 4),
    spotify.getTopTracks("short_term", 6),
    spotify.getTopTracks("long_term", 10),
  ]);
  return {
    featured,
    recent,
    recentTitle: "Heavy Rotation · last 4 weeks",
    charts,
    chartsTitle: "Your Top Charts · all time",
  };
}

export async function loadTopArtists(mode: AppMode): Promise<Artist[]> {
  return mode === "demo" ? MOCK_ARTISTS : spotify.getTopArtists("medium_term", 20);
}

export async function loadPlaylists(mode: AppMode | null): Promise<Playlist[]> {
  if (mode === "demo") return MOCK_PLAYLISTS;
  if (mode === "spotify") return spotify.getUserPlaylists(50);
  return [];
}

export async function loadPlaylistTracks(mode: AppMode, id: string): Promise<Track[]> {
  if (mode === "demo") return MOCK_PLAYLISTS.find((p) => p.id === id)?.tracks ?? [];
  return spotify.getPlaylistItems(id, 50);
}

export async function searchCatalog(mode: AppMode, q: string): Promise<{ tracks: Track[]; artists: Artist[] }> {
  if (mode === "spotify") return spotify.search(q);
  const needle = q.toLowerCase();
  return {
    tracks: MOCK_TRACKS.filter((t) => [t.title, t.artist, t.album].some((s) => s.toLowerCase().includes(needle))),
    artists: MOCK_ARTISTS.filter((a) => a.name.toLowerCase().includes(needle)),
  };
}
