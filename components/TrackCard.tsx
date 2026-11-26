"use client";
import { Pause, Play } from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";
import { formatTime } from "@/lib/hooks";
import type { Artist, Playlist, Track } from "@/lib/models";
import Cover from "./Cover";

/** Shared "is this the current track, and is it audible?" logic. */
function useTrackState(track: Track, queue: Track[]) {
  const { track: current, paused, playTrack, togglePlay } = usePlayer();
  const isCurrent = current?.uri === track.uri;
  const isPlaying = isCurrent && !paused;
  const activate = () => (isCurrent ? togglePlay() : playTrack(track.uri, queue));
  return { isCurrent, isPlaying, activate };
}

export function Equalizer({ paused }: { paused: boolean }) {
  return (
    <span className="eq" data-paused={paused} aria-hidden>
      <i />
      <i />
      <i />
    </span>
  );
}

/** Square album-art card (grid). Clicking loads + plays the track in the bottom bar. */
export function TrackCard({ track, queue }: { track: Track; queue: Track[] }) {
  const { isCurrent, isPlaying, activate } = useTrackState(track, queue);
  return (
    <button
      onClick={activate}
      aria-label={`${isPlaying ? "Pause" : "Play"} ${track.title} by ${track.artist}`}
      className={`group glass animate-rise rounded-2xl p-3 text-left transition hover:-translate-y-0.5 hover:bg-white/10 ${
        isCurrent ? "!border-fuchsia-400/50 bg-fuchsia-500/10" : ""
      }`}
    >
      <div className="relative aspect-square overflow-hidden rounded-xl shadow-lg shadow-black/40">
        <Cover src={track.image} className="h-full w-full" />
        <span
          className={`absolute bottom-2 right-2 grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 shadow-lg transition duration-200 ${
            isCurrent ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
          }`}
        >
          {isPlaying ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="ml-0.5 h-4 w-4" fill="currentColor" />}
        </span>
      </div>
      <p className={`mt-3 truncate text-sm font-semibold ${isCurrent ? "text-fuchsia-300" : ""}`}>{track.title}</p>
      <p className="truncate text-xs text-white/55">{track.artist}</p>
    </button>
  );
}

/** Numbered list row (Top Charts, search results, playlists). */
export function TrackRow({ track, queue, index }: { track: Track; queue: Track[]; index: number }) {
  const { isCurrent, isPlaying, activate } = useTrackState(track, queue);
  return (
    <li>
      <button
        onClick={activate}
        aria-label={`${isPlaying ? "Pause" : "Play"} ${track.title} by ${track.artist}`}
        className={`group grid w-full grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-white/10 md:grid-cols-[2rem_minmax(0,2fr)_minmax(0,1fr)_3rem] ${
          isCurrent ? "bg-white/[0.07]" : ""
        }`}
      >
        <span className="grid place-items-center text-sm tabular-nums text-white/40">
          {isCurrent ? (
            <Equalizer paused={!isPlaying} />
          ) : (
            <>
              <span className="group-hover:hidden">{index + 1}</span>
              <Play className="hidden h-4 w-4 text-white group-hover:block" fill="currentColor" />
            </>
          )}
        </span>
        <span className="flex min-w-0 items-center gap-3">
          <Cover src={track.image} className="h-10 w-10 rounded-lg" />
          <span className="min-w-0">
            <span className={`block truncate text-sm font-medium ${isCurrent ? "text-fuchsia-300" : ""}`}>{track.title}</span>
            <span className="block truncate text-xs text-white/55">{track.artist}</span>
          </span>
        </span>
        <span className="hidden truncate text-xs text-white/45 md:block">{track.album}</span>
        <span className="text-right text-xs tabular-nums text-white/45">{formatTime(track.durationMs)}</span>
      </button>
    </li>
  );
}

export function ArtistCard({ artist, onSelect }: { artist: Artist; onSelect: (a: Artist) => void }) {
  return (
    <button
      onClick={() => onSelect(artist)}
      className="group glass animate-rise rounded-2xl p-3 text-center transition hover:-translate-y-0.5 hover:bg-white/10"
    >
      <Cover src={artist.image} className="mx-auto aspect-square w-full rounded-full shadow-lg shadow-black/40" />
      <p className="mt-3 truncate text-sm font-semibold">{artist.name}</p>
      <p className="text-xs text-white/50">Artist</p>
    </button>
  );
}

export function PlaylistCard({ playlist, onSelect }: { playlist: Playlist; onSelect: (p: Playlist) => void }) {
  return (
    <button
      onClick={() => onSelect(playlist)}
      className="group glass animate-rise rounded-2xl p-3 text-left transition hover:-translate-y-0.5 hover:bg-white/10"
    >
      <Cover src={playlist.image} className="aspect-square w-full rounded-xl shadow-lg shadow-black/40" />
      <p className="mt-3 truncate text-sm font-semibold">{playlist.name}</p>
      <p className="truncate text-xs text-white/55">
        {playlist.total != null ? `${playlist.total} tracks · ` : ""}
        {playlist.owner}
      </p>
    </button>
  );
}

export function Section({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="text-xl font-bold tracking-tight md:text-2xl">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export const gridClass = "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6";
