"use client";
import type { Playlist, View } from "@/lib/models";
import { gridClass, PlaylistCard, Section } from "../TrackCard";
import { EmptyState, GridSkeleton } from "./states";

export default function LibraryView({
  playlists,
  loading,
  onNavigate,
}: {
  playlists: Playlist[];
  loading: boolean;
  onNavigate: (v: View) => void;
}) {
  return (
    <>
      <h1 className="mb-8 text-3xl font-extrabold tracking-tight md:text-4xl">
        Your <span className="accent-text">Library</span>
      </h1>
      <Section title="Playlists">
        {loading && <GridSkeleton />}
        {!loading && playlists.length === 0 && <EmptyState title="No playlists" body="Playlists you create or follow will appear here." />}
        <div className={gridClass}>
          {playlists.map((p) => (
            <PlaylistCard key={p.id} playlist={p} onSelect={(x) => onNavigate({ name: "playlist", id: x.id })} />
          ))}
        </div>
      </Section>
    </>
  );
}
