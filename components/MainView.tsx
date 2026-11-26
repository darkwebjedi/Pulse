"use client";
import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import type { Playlist, View } from "@/lib/models";
import LoginScreen from "./LoginScreen";
import ExploreView from "./views/ExploreView";
import HomeView from "./views/HomeView";
import LibraryView from "./views/LibraryView";
import PlaylistView from "./views/PlaylistView";
import SearchView from "./views/SearchView";

interface MainViewProps {
  view: View;
  onNavigate: (v: View) => void;
  playlists: Playlist[];
  playlistsLoading: boolean;
}

/** Login screen when signed out; otherwise the active view in a scrollable glass panel. */
export default function MainView({ view, onNavigate, playlists, playlistsLoading }: MainViewProps) {
  const { status } = useAuth();
  const scroller = useRef<HTMLElement>(null);

  // Start every page at the top when navigating.
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [view]);

  if (status !== "spotify" && status !== "demo") return <LoginScreen />;

  return (
    <main ref={scroller} className="glass min-h-0 overflow-y-auto rounded-3xl p-4 md:p-8">
      {view.name === "home" && <HomeView />}
      {view.name === "explore" && <ExploreView onNavigate={onNavigate} />}
      {view.name === "library" && <LibraryView playlists={playlists} loading={playlistsLoading} onNavigate={onNavigate} />}
      {view.name === "search" && <SearchView initialQuery={view.query} />}
      {view.name === "playlist" && <PlaylistView id={view.id} playlist={playlists.find((p) => p.id === view.id)} />}
    </main>
  );
}
