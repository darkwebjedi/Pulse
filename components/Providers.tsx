"use client";
import { ReactNode } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { DemoPlayerProvider } from "@/context/DemoPlayerContext";
import { SpotifyPlayerProvider } from "@/context/SpotifyPlayerContext";

/** Picks the playback engine that matches the current mode. */
function PlayerSwitch({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  if (status === "spotify") return <SpotifyPlayerProvider>{children}</SpotifyPlayerProvider>;
  if (status === "demo") return <DemoPlayerProvider>{children}</DemoPlayerProvider>;
  return <>{children}</>;
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <PlayerSwitch>{children}</PlayerSwitch>
    </AuthProvider>
  );
}
