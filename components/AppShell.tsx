"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { loadPlaylists } from "@/lib/data";
import { useAsync } from "@/lib/hooks";
import type { View } from "@/lib/models";
import MainView from "./MainView";
import PlayerBar from "./PlayerBar";
import { MobileNav, Sidebar } from "./Sidebar";

/**
 * Main layout container:
 *
 *   ┌───────────┬──────────────────────┐
 *   │  Sidebar  │      MainView        │   (md+; below md the sidebar becomes a tab bar)
 *   ├───────────┴──────────────────────┤
 *   │            PlayerBar             │
 *   └──────────────────────────────────┘
 */
export default function AppShell() {
  const { status, mode } = useAuth();
  const [view, setView] = useState<View>({ name: "home" });

  // Playlists are fetched once here and shared by the Sidebar and the Library view.
  const playlists = useAsync(() => loadPlaylists(mode), [mode]);
  const list = playlists.data ?? [];

  if (status === "loading") {
    return <div className="grid h-dvh place-items-center text-sm text-white/40">Loading…</div>;
  }
  if (status === "signed-out") {
    return <MainView view={view} onNavigate={setView} playlists={[]} playlistsLoading={false} />;
  }

  return (
    <div className="grid h-dvh grid-rows-[minmax(0,1fr)_auto_auto]">
      <div className="grid min-h-0 gap-2 p-2 md:grid-cols-[17rem_minmax(0,1fr)]">
        <Sidebar view={view} onNavigate={setView} playlists={list} loading={playlists.loading} />
        <MainView view={view} onNavigate={setView} playlists={list} playlistsLoading={playlists.loading} />
      </div>
      <PlayerBar />
      <MobileNav view={view} onNavigate={setView} />
    </div>
  );
}
