"use client";
/**
 * The contract every playback engine implements. UI components only ever call `usePlayer()`,
 * so they work identically with the Spotify Web Playback SDK and the HTML5 demo engine.
 */
import { createContext, useContext } from "react";
import type { Track } from "@/lib/models";

export interface PlayerContextValue {
  engine: "spotify" | "demo";
  /** Engine is ready to accept commands (SDK connected / <audio> mounted). */
  ready: boolean;
  track: Track | null;
  paused: boolean;
  positionMs: number;
  durationMs: number;
  /** 0-100 */
  volume: number;
  error: string | null;

  /** Play `uri`. Pass the surrounding list as `queue` so next/previous work. */
  playTrack: (uri: string, queue?: Track[]) => Promise<void>;
  togglePlay: () => Promise<void>;
  seek: (positionMs: number) => Promise<void>;
  setVolume: (percent: number) => Promise<void>;
  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
}

export const PlayerContext = createContext<PlayerContextValue | null>(null);

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside a player provider");
  return ctx;
}

const VOLUME_KEY = "pulse:volume";

export function readStoredVolume(fallback = 70): number {
  try {
    const v = Number(localStorage.getItem(VOLUME_KEY));
    return Number.isFinite(v) && localStorage.getItem(VOLUME_KEY) !== null ? Math.min(100, Math.max(0, v)) : fallback;
  } catch {
    return fallback;
  }
}

export function storeVolume(v: number) {
  try {
    localStorage.setItem(VOLUME_KEY, String(v));
  } catch {
    /* ignore */
  }
}
