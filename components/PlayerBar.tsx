"use client";
import { Mic2, Pause, Play, SkipBack, SkipForward, Volume1, Volume2, VolumeX } from "lucide-react";
import { useRef, useState } from "react";
import { usePlayer } from "@/context/PlayerContext";
import { formatTime } from "@/lib/hooks";
import Slider from "./Slider";

interface PlayerBarProps {
  lyricsOpen?: boolean;
  onToggleLyrics?: () => void;
}

export default function PlayerBar({ lyricsOpen = false, onToggleLyrics }: PlayerBarProps) {
  const { track, paused, positionMs, durationMs, volume, error, engine, ready, togglePlay, seek, setVolume, nextTrack, previousTrack } =
    usePlayer();

  // While scrubbing we show the dragged value and only seek on release.
  const [scrub, setScrub] = useState<number | null>(null);
  const lastVolume = useRef(70);

  const shownPosition = scrub ?? positionMs;
  const disabled = !track;
  const VolumeIcon = volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;

  const toggleMute = () => {
    if (volume > 0) {
      lastVolume.current = volume;
      setVolume(0);
    } else {
      setVolume(lastVolume.current || 70);
    }
  };

  return (
    <footer className="relative px-2 pb-2">
      {error && (
        <div
          role="alert"
          className="absolute -top-11 left-1/2 z-20 w-[calc(100%-1rem)] max-w-xl -translate-x-1/2 rounded-xl border border-rose-400/30 bg-rose-950/80 px-4 py-2 text-center text-xs text-rose-100 backdrop-blur-xl"
        >
          {error}
        </div>
      )}

      <div className="glass-strong grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 rounded-3xl px-4 py-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)] md:gap-6">
        {/* Track info */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onToggleLyrics}
            aria-label={lyricsOpen ? "Close lyrics" : "Open lyrics"}
            className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/10 shadow-lg shadow-fuchsia-900/30 transition hover:scale-105"
          >
            {track?.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={track.image} alt="" className="h-full w-full object-cover" />
            )}
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold" data-testid="now-title">
              {track?.title ?? "Nothing playing"}
            </p>
            <p className="truncate text-xs text-white/55">
              {track?.artist ?? (ready ? "Pick a song to start" : "Connecting player…")}
            </p>
          </div>
        </div>

        {/* Transport + progress */}
        <div className="flex flex-col items-center gap-1 md:order-none">
          <div className="flex items-center gap-3 md:gap-5">
            <button
              aria-label="Previous track"
              disabled={disabled}
              onClick={previousTrack}
              className="rounded-full p-2 text-white/70 transition hover:text-white active:scale-90 disabled:opacity-30"
            >
              <SkipBack className="h-5 w-5" fill="currentColor" />
            </button>
            <button
              aria-label={paused ? "Play" : "Pause"}
              disabled={disabled}
              onClick={togglePlay}
              className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white shadow-[0_6px_24px_-6px_rgba(217,70,239,0.9)] transition hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
            >
              {paused ? <Play className="ml-0.5 h-5 w-5" fill="currentColor" /> : <Pause className="h-5 w-5" fill="currentColor" />}
            </button>
            <button
              aria-label="Next track"
              disabled={disabled}
              onClick={nextTrack}
              className="rounded-full p-2 text-white/70 transition hover:text-white active:scale-90 disabled:opacity-30"
            >
              <SkipForward className="h-5 w-5" fill="currentColor" />
            </button>
          </div>

          <div className="col-span-2 hidden w-full items-center gap-2 text-[11px] tabular-nums text-white/50 md:flex">
            <span className="w-9 text-right" data-testid="time-elapsed">{formatTime(shownPosition)}</span>
            <Slider
              label="Seek"
              value={shownPosition}
              max={durationMs}
              disabled={disabled}
              onChange={setScrub}
              onCommit={(v) => {
                seek(v);
                setScrub(null);
              }}
            />
            <span className="w-9">{formatTime(durationMs)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="hidden items-center justify-end gap-2 md:flex">
          <span className="mr-2 hidden rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/40 lg:inline">
            {engine === "spotify" ? "Web Playback SDK" : "Demo · HTML5 audio"}
          </span>
          <button
            aria-label={lyricsOpen ? "Close lyrics" : "Show lyrics"}
            aria-pressed={lyricsOpen}
            onClick={onToggleLyrics}
            className={`mr-1 rounded-full p-2 transition ${lyricsOpen ? "bg-fuchsia-500/25 text-fuchsia-200" : "text-white/70 hover:text-white"}`}
          >
            <Mic2 className="h-5 w-5" />
          </button>
          <button aria-label={volume === 0 ? "Unmute" : "Mute"} onClick={toggleMute} className="text-white/70 hover:text-white">
            <VolumeIcon className="h-5 w-5" />
          </button>
          <div className="w-28">
            <Slider label="Volume" value={volume} max={100} onChange={setVolume} />
          </div>
        </div>

        {/* Mobile progress (thin, full width) */}
        <div className="col-span-2 flex items-center gap-2 text-[11px] tabular-nums text-white/50 md:hidden">
          <span className="w-9 text-right">{formatTime(shownPosition)}</span>
          <Slider
            label="Seek"
            value={shownPosition}
            max={durationMs}
            disabled={disabled}
            onChange={setScrub}
            onCommit={(v) => {
              seek(v);
              setScrub(null);
            }}
          />
          <span className="w-9">{formatTime(durationMs)}</span>
        </div>
      </div>
    </footer>
  );
}
