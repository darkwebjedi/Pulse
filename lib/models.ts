/** App-level (normalised) models shared by the Spotify and Demo data sources. */

export interface Track {
  id: string;
  /** `spotify:track:{id}` for Spotify, `demo:track:{id}` for demo data. */
  uri: string;
  title: string;
  artist: string;
  album: string;
  image: string | null;
  durationMs: number;
  /** Only set for demo tracks, which are played through an HTML5 <audio> element. */
  audioUrl?: string;
}

export interface Artist {
  id: string;
  uri: string;
  name: string;
  image: string | null;
  genres?: string[];
}

export interface Playlist {
  id: string;
  uri: string;
  name: string;
  image: string | null;
  owner: string;
  total?: number;
  description?: string | null;
}

export type AppMode = "spotify" | "demo";

export type View =
  | { name: "home" }
  | { name: "explore" }
  | { name: "library" }
  | { name: "search"; query?: string }
  | { name: "playlist"; id: string };
