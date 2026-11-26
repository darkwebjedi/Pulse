"use client";
import { useAuth } from "@/context/AuthContext";
import { loadTopArtists } from "@/lib/data";
import { useAsync } from "@/lib/hooks";
import type { View } from "@/lib/models";
import { ArtistCard, gridClass, Section } from "../TrackCard";
import { EmptyState, ErrorState, GridSkeleton } from "./states";

/**
 * Explore. Spotify's /browse/* endpoints are deprecated, so discovery here is built from
 * the listener's own top artists (GET /v1/me/top/artists). Selecting one searches for them.
 */
export default function ExploreView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const { mode } = useAuth();
  const { data, error, loading, reload } = useAsync(() => loadTopArtists(mode!), [mode]);

  return (
    <>
      <h1 className="mb-8 text-3xl font-extrabold tracking-tight md:text-4xl">
        <span className="accent-text">Explore</span>
      </h1>
      <Section title="Your top artists">
        {loading && <GridSkeleton />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {data && data.length === 0 && <EmptyState title="No top artists yet" body="Listen a little more and check back." />}
        {data && data.length > 0 && (
          <div className={gridClass}>
            {data.map((a) => (
              <ArtistCard key={a.id} artist={a} onSelect={(x) => onNavigate({ name: "search", query: x.name })} />
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
