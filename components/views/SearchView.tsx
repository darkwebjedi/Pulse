"use client";
import { Search as SearchIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { searchCatalog } from "@/lib/data";
import { useAsync } from "@/lib/hooks";
import { ArtistCard, gridClass, Section, TrackRow } from "../TrackCard";
import { EmptyState, ErrorState } from "./states";

export default function SearchView({ initialQuery = "" }: { initialQuery?: string }) {
  const { mode } = useAuth();
  const [input, setInput] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery.trim());

  // Navigating here from an artist card pre-fills the box.
  useEffect(() => {
    setInput(initialQuery);
    setQuery(initialQuery.trim());
  }, [initialQuery]);

  // Debounce keystrokes so we don't hammer the API (and its rate limit).
  useEffect(() => {
    const id = setTimeout(() => setQuery(input.trim()), 350);
    return () => clearTimeout(id);
  }, [input]);

  const { data, error, loading, reload } = useAsync(
    () => (query ? searchCatalog(mode!, query) : Promise.resolve(null)),
    [mode, query],
  );

  return (
    <>
      <div className="glass-strong sticky top-0 z-10 -mx-1 mb-8 flex items-center gap-3 rounded-full px-5 py-3">
        <SearchIcon className="h-5 w-5 text-white/50" />
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What do you want to listen to?"
          aria-label="Search songs and artists"
          className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-white/35"
        />
        {input && (
          <button aria-label="Clear search" onClick={() => setInput("")} className="text-white/50 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {!query && (
        <EmptyState
          title="Search for something"
          body={mode === "demo" ? "Try “aurora”, “neon” or “violet”." : "Find songs and artists. Results are capped at 10 per type."}
        />
      )}
      {query && error && <ErrorState message={error} onRetry={reload} />}
      {query && !error && !loading && data && data.tracks.length === 0 && data.artists.length === 0 && (
        <EmptyState title={`No results for “${query}”`} body="Check the spelling or try a different search." />
      )}

      {data && data.tracks.length > 0 && (
        <Section title="Songs">
          <ul className="glass rounded-2xl p-2">
            {data.tracks.map((t, i) => (
              <TrackRow key={t.uri} track={t} queue={data.tracks} index={i} />
            ))}
          </ul>
        </Section>
      )}
      {data && data.artists.length > 0 && (
        <Section title="Artists">
          <div className={gridClass}>
            {data.artists.map((a) => (
              <ArtistCard key={a.id} artist={a} onSelect={(x) => setInput(x.name)} />
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
