/** Raw Spotify Web API response shapes (only the fields this app reads). */

export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

export interface SpotifyArtistRef {
  id: string;
  name: string;
  uri: string;
}

export interface SpotifyAlbumRef {
  id: string;
  name: string;
  uri: string;
  images: SpotifyImage[];
}

export interface SpotifyTrack {
  id: string;
  uri: string;
  name: string;
  type?: string;
  duration_ms: number;
  artists: SpotifyArtistRef[];
  album: SpotifyAlbumRef;
  is_playable?: boolean;
}

export interface SpotifyArtist {
  id: string;
  uri: string;
  name: string;
  images: SpotifyImage[];
  genres?: string[];
}

export interface SpotifyPlaylist {
  id: string;
  uri: string;
  name: string;
  description?: string | null;
  images: SpotifyImage[] | null;
  owner: { id: string; display_name?: string | null };
  /** Newer API shape. */
  items?: { total: number };
  /** Legacy shape - still tolerated. */
  tracks?: { total: number };
}

export interface SpotifyPage<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  next: string | null;
}

export interface SpotifyUser {
  id: string;
  display_name: string | null;
  email?: string;
  images?: SpotifyImage[];
  product?: string;
}

export interface SearchResponse {
  tracks?: SpotifyPage<SpotifyTrack | null>;
  artists?: SpotifyPage<SpotifyArtist | null>;
}

/**
 * Entry of GET /v1/playlists/{id}/items.
 * The track object lives under `.item` (it used to be `.track`).
 */
export interface PlaylistItemEntry {
  added_at?: string;
  item?: SpotifyTrack | null;
  /** Legacy field, read only as a fallback. */
  track?: SpotifyTrack | null;
}

export type TimeRange = "short_term" | "medium_term" | "long_term";
