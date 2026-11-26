"use client";
/**
 * Spotify Web Playback SDK engine.
 *  - injects https://sdk.scdn.co/spotify-player.js and creates a Spotify.Player
 *  - captures `device_id` on "ready"
 *  - mirrors `player_state_changed` into React state (with a local clock for the progress bar)
 *  - starts playback with PUT /v1/me/player/play?device_id=...
 * Requires a Spotify Premium account (a Spotify restriction, not ours).
 */
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Track } from "@/lib/models";
import { getAccessToken, pickImage, SpotifyApiError, startPlayback, transferPlayback } from "@/lib/spotify";
import { PlayerContext, PlayerContextValue, readStoredVolume, storeVolume, usePlayer } from "./PlayerContext";

const SDK_SRC = "https://sdk.scdn.co/spotify-player.js";

function loadSdk(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (window.Spotify) return Promise.resolve();
  return new Promise((resolve) => {
    window.onSpotifyWebPlaybackSDKReady = () => resolve();
    if (!document.querySelector(`script[src="${SDK_SRC}"]`)) {
      const script = document.createElement("script");
      script.src = SDK_SRC;
      script.async = true;
      document.body.appendChild(script);
    }
  });
}

function fromSdkTrack(t: Spotify.Track, durationMs: number): Track {
  return {
    id: t.id ?? t.uri,
    uri: t.uri,
    title: t.name,
    artist: t.artists.map((a) => a.name).join(", "),
    album: t.album.name,
    image: pickImage(t.album.images.map((i) => ({ url: i.url, width: i.width ?? null, height: i.height ?? null })), 300),
    durationMs,
  };
}

export function SpotifyPlayerProvider({ children }: { children: ReactNode }) {
  const playerRef = useRef<Spotify.Player | null>(null);
  const deviceIdRef = useRef<string | null>(null);
  const transferredRef = useRef(false);
  /** Anchor for interpolating position between SDK events. */
  const clock = useRef({ position: 0, at: 0 });

  const [ready, setReady] = useState(false);
  const [track, setTrack] = useState<Track | null>(null);
  const [paused, setPaused] = useState(true);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [volume, setVolumeState] = useState(() => readStoredVolume());
  const [error, setError] = useState<string | null>(null);

  /* ---- create + connect the player ---------------------------------- */
  useEffect(() => {
    let cancelled = false;
    let player: Spotify.Player | undefined;

    loadSdk().then(() => {
      if (cancelled) return;
      player = new window.Spotify.Player({
        name: "Pulse Web Player",
        getOAuthToken: (cb) => {
          getAccessToken().then((t) => t && cb(t));
        },
        volume: readStoredVolume() / 100,
      });

      player.addListener("ready", ({ device_id }) => {
        deviceIdRef.current = device_id;
        setReady(true);
      });
      player.addListener("not_ready", () => {
        deviceIdRef.current = null;
        setReady(false);
      });
      player.addListener("player_state_changed", (state) => {
        if (!state) {
          setPaused(true);
          return;
        }
        const current = state.track_window.current_track;
        setTrack(fromSdkTrack(current, state.duration));
        setPaused(state.paused);
        setDurationMs(state.duration);
        setPositionMs(state.position);
        clock.current = { position: state.position, at: Date.now() };
      });

      player.addListener("initialization_error", ({ message }) => setError(`Player init failed: ${message}`));
      player.addListener("authentication_error", ({ message }) => setError(`Auth error: ${message}`));
      player.addListener("account_error", () => setError("Spotify Premium is required for in-browser playback."));
      player.addListener("playback_error", ({ message }) => setError(`Playback error: ${message}`));

      player.connect();
      playerRef.current = player;
    });

    return () => {
      cancelled = true;
      player?.disconnect();
      playerRef.current = null;
      deviceIdRef.current = null;
    };
  }, []);

  /* ---- local progress clock ---------------------------------------- */
  useEffect(() => {
    if (paused || !track) return;
    const id = setInterval(() => {
      const elapsed = Date.now() - clock.current.at;
      setPositionMs(Math.min(clock.current.position + elapsed, durationMs || Infinity));
    }, 250);
    return () => clearInterval(id);
  }, [paused, track, durationMs]);

  /* ---- controls ---------------------------------------------------- */
  const playTrack = useCallback(async (uri: string, queue?: Track[]) => {
    const deviceId = deviceIdRef.current;
    if (!deviceId) {
      setError("Player is still connecting - try again in a moment.");
      return;
    }
    setError(null);

    // Browsers block audio until a user gesture "activates" the element (iOS/Safari especially).
    await playerRef.current?.activateElement();

    const list = queue?.length ? queue : [];
    let index = Math.max(0, list.findIndex((t) => t.uri === uri));
    let uris = list.length ? list.map((t) => t.uri) : [uri];
    // The play endpoint accepts at most 100 URIs - window the queue around the clicked track.
    if (uris.length > 100) {
      uris = uris.slice(index, index + 100);
      index = 0;
    }

    const run = () => startPlayback(deviceId, { uris, offsetPosition: index });
    try {
      await run();
    } catch (e) {
      // 404 "Device not found" can happen right after connecting: transfer once, then retry.
      if (e instanceof SpotifyApiError && e.status === 404 && !transferredRef.current) {
        transferredRef.current = true;
        try {
          await transferPlayback(deviceId, false);
          await run();
          return;
        } catch (e2) {
          e = e2;
        }
      }
      setError(
        e instanceof SpotifyApiError && e.status === 403
          ? "Playback was refused (403). Spotify Premium is required."
          : e instanceof Error
            ? e.message
            : "Could not start playback",
      );
    }
  }, []);

  const togglePlay = useCallback(async () => {
    await playerRef.current?.activateElement();
    await playerRef.current?.togglePlay();
  }, []);

  const seek = useCallback(async (ms: number) => {
    setPositionMs(ms);
    clock.current = { position: ms, at: Date.now() };
    await playerRef.current?.seek(ms);
  }, []);

  const setVolume = useCallback(async (percent: number) => {
    const v = Math.min(100, Math.max(0, percent));
    setVolumeState(v);
    storeVolume(v);
    await playerRef.current?.setVolume(v / 100);
  }, []);

  const nextTrack = useCallback(async () => {
    await playerRef.current?.nextTrack();
  }, []);

  const previousTrack = useCallback(async () => {
    await playerRef.current?.previousTrack();
  }, []);

  const value = useMemo<PlayerContextValue>(
    () => ({
      engine: "spotify",
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

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

/** Alias kept for naming symmetry with the provider. */
export const useSpotifyPlayer = usePlayer;
