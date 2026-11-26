"use client";
import { useAuth } from "@/context/AuthContext";
import { loadHome } from "@/lib/data";
import { useAsync } from "@/lib/hooks";
import Hero from "../Hero";
import { gridClass, Section, TrackCard, TrackRow } from "../TrackCard";
import { EmptyState, ErrorState, HomeSkeleton } from "./states";

export default function HomeView() {
  const { mode, user } = useAuth();
  const { data, error, loading, reload } = useAsync(() => loadHome(mode!), [mode]);

  if (loading) return <HomeSkeleton />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data || data.charts.length === 0)
    return <EmptyState title="Nothing here yet" body="Listen to a few songs on Spotify and your top tracks will show up here." />;

  return (
    <>
      <Hero tracks={data.featured} name={user?.name ?? "there"} />

      <Section title={data.recentTitle}>
        <div className={gridClass}>
          {data.recent.map((t) => (
            <TrackCard key={t.uri} track={t} queue={data.recent} />
          ))}
        </div>
      </Section>

      <Section title={data.chartsTitle}>
        <ul className="glass rounded-2xl p-2">
          {data.charts.map((t, i) => (
            <TrackRow key={t.uri} track={t} queue={data.charts} index={i} />
          ))}
        </ul>
      </Section>
    </>
  );
}
