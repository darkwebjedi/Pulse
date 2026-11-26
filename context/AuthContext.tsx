"use client";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { MOCK_USER } from "@/lib/mock-data";
import type { AppMode } from "@/lib/models";
import * as spotify from "@/lib/spotify";
import type { SpotifyUser } from "@/lib/spotify-types";

type Status = "loading" | "signed-out" | AppMode;

interface AuthValue {
  status: Status;
  mode: AppMode | null;
  /** Display name + avatar for the sidebar. */
  user: { name: string; image: string | null } | null;
  configured: boolean;
  login: () => Promise<void>;
  enterDemo: () => void;
  logout: () => void;
  error: string | null;
}

const DEMO_KEY = "pulse:demo";
const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [profile, setProfile] = useState<SpotifyUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (spotify.ensureRedirectOrigin()) return;
    if (localStorage.getItem(DEMO_KEY) === "1") {
      setStatus("demo");
      return;
    }
    if (!spotify.hasStoredSession()) {
      setStatus("signed-out");
      return;
    }
    spotify
      .getMe()
      .then((me) => {
        if (cancelled) return;
        setProfile(me);
        setStatus("spotify");
      })
      .catch(() => {
        if (cancelled) return;
        spotify.logout();
        setStatus("signed-out");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async () => {
    setError(null);
    try {
      await spotify.loginWithSpotify();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start login");
    }
  }, []);

  const enterDemo = useCallback(() => {
    localStorage.setItem(DEMO_KEY, "1");
    setStatus("demo");
  }, []);

  const logout = useCallback(() => {
    spotify.logout();
    localStorage.removeItem(DEMO_KEY);
    setProfile(null);
    setStatus("signed-out");
  }, []);

  const value = useMemo<AuthValue>(() => {
    const mode = status === "spotify" || status === "demo" ? status : null;
    const user =
      status === "demo"
        ? MOCK_USER
        : profile
          ? { name: profile.display_name ?? profile.id, image: spotify.pickImage(profile.images, 64) }
          : null;
    return { status, mode, user, configured: spotify.isConfigured(), login, enterDemo, logout, error };
  }, [status, profile, login, enterDemo, logout, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
