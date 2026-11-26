"use client";
import { Play } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePlayer } from "@/context/PlayerContext";
import { loadPlaylistTracks } from "@/lib/data";
import { useAsync } from "@/lib/hooks";
import type { Playlist } from "@/lib/models";
import Cover from "../Cover";
import { TrackRow } from "../TrackCard";
import { EmptyState, ErrorState } from "./states";

export default function PlaylistView({ id, playlist }: { id: string; playlist?: Playlist }) {
  const { mode } = useAuth();
  const { playTrack } = usePlayer();
  // GET /v1/playlists/{id}/items - track objects are read from `.item`.
  const { data, error, loading, reload } = useAsync(() => loadPlaylistTracks(mode!, id), [mode, id]);

  return (
    <>
      <header className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end">
        <Cover src={playlist?.image ?? null} className="h-44 w-44 rounded-3xl shadow-2xl shadow-fuchsia-900/40 md:h-56 md:w-56" />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-200/80">Playlist</p>
          <h1 className="mt-2 text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">{playlist?.name ?? "Playlist"}</h1>
          {playlist?.description && <p className="mt-2 text-sm text-white/55">{playlist.description}</p>}
          <p className="mt-2 text-sm text-white/50">
            {playlist?.owner}
            {data ? ` · ${data.length} songs` : ""}
          </p>
        </div>
      </header>

      {data && data.length > 0 && (
        <button className="btn-primary mb-6" onClick={() => playTrack(data[0].uri, data)}>
          <Play className="h-4 w-4" fill="currentColor" /> Play
        </button>
      )}

      {loading && <div className="h-64 animate-pulse rounded-2xl bg-white/5" aria-busy />}
      {error && (
        <ErrorState
          message={
            error.includes("403") || /forbidden/i.test(error)
              ? "Spotify only returns items for playlists you own or collaborate on. (" + error + ")"
              : error
          }
          onRetry={reload}
        />
      )}
      {data && data.length === 0 && <EmptyState title="This playlist is empty" body="Add some songs in Spotify and they'll show up here." />}
      {data && data.length > 0 && (
        <ul className="glass rounded-2xl p-2">
          {data.map((t, i) => (
            <TrackRow key={`${t.uri}-${i}`} track={t} queue={data} index={i} />
          ))}
        </ul>
      )}
    </>
  );
}
