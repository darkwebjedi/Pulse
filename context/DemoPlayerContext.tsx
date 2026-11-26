"use client";
/**
 * Demo engine: plays the mock catalogue through a plain HTML5 <audio> element.
 * Used when you click "Try the demo" (no Spotify account needed). Spotify mode never uses <audio>.
 */
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MOCK_TRACKS } from "@/lib/mock-data";
import type { Track } from "@/lib/models";
import { PlayerContext, PlayerContextValue, readStoredVolume, storeVolume } from "./PlayerContext";

export function DemoPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const queueRef = useRef<Track[]>(MOCK_TRACKS);
  const trackRef = useRef<Track | null>(null);

  const [ready, setReady] = useState(false);
  const [track, setTrack] = useState<Track | null>(null);
  const [paused, setPaused] = useState(true);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [volume, setVolumeState] = useState(() => readStoredVolume());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setReady(true), []);
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  const load = useCallback((t: Track) => {
    const audio = audioRef.current;
    if (!audio || !t.audioUrl) return;
    trackRef.current = t;
    setTrack(t);
    setPositionMs(0);
    setDurationMs(t.durationMs);
    setError(null);
    audio.src = t.audioUrl;
    audio.play().catch((e: DOMException) => {
      if (e.name !== "AbortError") setError("Couldn't play this track - check your connection or click play again.");
    });
  }, []);

  const step = useCallback(
    (delta: number) => {
      const q = queueRef.current;
      const i = q.findIndex((t) => t.uri === trackRef.current?.uri);
      load(q[(i + delta + q.length) % q.length]);
    },
    [load],
  );

  const playTrack = useCallback(
    async (uri: string, queue?: Track[]) => {
      const q = queue?.length ? queue : MOCK_TRACKS;
      queueRef.current = q;
      const t = q.find((x) => x.uri === uri) ?? MOCK_TRACKS.find((x) => x.uri === uri);
      if (t) load(t);
    },
    [load],
  );

  const togglePlay = useCallback(async () => {
    const a = audioRef.current;
    if (!a || !trackRef.current) return;
    if (a.paused) await a.play().catch(() => setError("Couldn't resume playback."));
    else a.pause();
  }, []);

  const seek = useCallback(async (ms: number) => {
    if (audioRef.current) audioRef.current.currentTime = ms / 1000;
    setPositionMs(ms);
  }, []);

  const setVolume = useCallback(async (percent: number) => {
    const v = Math.min(100, Math.max(0, percent));
    setVolumeState(v);
    storeVolume(v);
  }, []);

  const nextTrack = useCallback(async () => step(1), [step]);
  const previousTrack = useCallback(async () => {
    // Like most players: restart the track if we're past 3 s, otherwise go back.
    if ((audioRef.current?.currentTime ?? 0) > 3) await seek(0);
    else step(-1);
  }, [seek, step]);

  const value = useMemo<PlayerContextValue>(
    () => ({
      engine: "demo",
      ready,
      track,
      paused,
      positionMs,
      durationMs,
      volume,
      error,
      playTrack,
      togglePlay,
      seek,
      setVolume,
      nextTrack,
      previousTrack,
    }),
    [ready, track, paused, positionMs, durationMs, volume, error, playTrack, togglePlay, seek, setVolume, nextTrack, previousTrack],
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="metadata"
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
        onTimeUpdate={(e) => setPositionMs(e.currentTarget.currentTime * 1000)}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d)) setDurationMs(d * 1000);
        }}
        onEnded={() => step(1)}
        onError={() => track && setError("This audio stream failed to load.")}
      />
    </PlayerContext.Provider>
  );
}
