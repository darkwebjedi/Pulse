"use client";
import { Compass, Home, Library, ListMusic, LogOut, Search, Waves } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { Playlist, View } from "@/lib/models";
import Cover from "./Cover";

interface NavProps {
  view: View;
  onNavigate: (v: View) => void;
}

const NAV = [
  { name: "home", label: "Home", icon: Home },
  { name: "explore", label: "Explore", icon: Compass },
  { name: "library", label: "Your Library", icon: Library },
  { name: "search", label: "Search", icon: Search },
] as const;

export function Sidebar({ view, onNavigate, playlists, loading }: NavProps & { playlists: Playlist[]; loading: boolean }) {
  const { user, mode, logout } = useAuth();

  return (
    <aside className="glass hidden min-h-0 flex-col gap-4 rounded-3xl p-3 md:flex">
      <div className="flex items-center gap-2.5 px-3 pb-1 pt-2">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-600 shadow-[0_6px_20px_-6px_rgba(217,70,239,0.9)]">
          <Waves className="h-4 w-4" />
        </span>
        <span className="text-lg font-bold tracking-tight">Pulse</span>
        {mode === "demo" && (
          <span className="ml-auto rounded-full bg-fuchsia-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-fuchsia-200">
            Demo
          </span>
        )}
      </div>

      <nav aria-label="Main" className="flex flex-col gap-0.5">
        {NAV.map(({ name, label, icon: Icon }) => (
          <button
            key={name}
            className="nav-item"
            aria-current={view.name === name ? "page" : undefined}
            onClick={() => onNavigate(name === "search" ? { name: "search" } : { name })}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </nav>

      <div className="flex min-h-0 flex-1 flex-col">
        <h2 className="mb-1 flex items-center gap-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
          <ListMusic className="h-3.5 w-3.5" /> Playlists
        </h2>
        <ul className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
          {loading &&
            Array.from({ length: 5 }, (_, i) => (
              <li key={i} className="m-1 h-10 animate-pulse rounded-xl bg-white/5" />
            ))}
          {!loading && playlists.length === 0 && <li className="px-3 py-2 text-xs text-white/40">No playlists yet.</li>}
          {playlists.map((p) => (
            <li key={p.id}>
              <button
                className="nav-item w-full !py-2"
                aria-current={view.name === "playlist" && view.id === p.id ? "page" : undefined}
                onClick={() => onNavigate({ name: "playlist", id: p.id })}
              >
                <Cover src={p.image} className="h-8 w-8 rounded-lg" />
                <span className="truncate">{p.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-2.5">
        <Cover src={user?.image ?? null} className="h-9 w-9 rounded-full" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user?.name}</p>
          <p className="text-[11px] text-white/40">{mode === "demo" ? "Sample catalogue" : "Spotify"}</p>
        </div>
        <button aria-label="Log out" onClick={logout} className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}

/** Bottom tab bar shown below the md breakpoint, where the sidebar is hidden. */
export function MobileNav({ view, onNavigate }: NavProps) {
  return (
    <nav aria-label="Main" className="glass mx-2 mb-2 flex justify-around rounded-2xl py-1 md:hidden">
      {NAV.map(({ name, label, icon: Icon }) => {
        const active = view.name === name || (name === "library" && view.name === "playlist");
        return (
          <button
            key={name}
            aria-current={active ? "page" : undefined}
            onClick={() => onNavigate(name === "search" ? { name: "search" } : { name })}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium ${active ? "text-fuchsia-300" : "text-white/50"}`}
          >
            <Icon className="h-5 w-5" />
            {label.replace("Your ", "")}
          </button>
        );
      })}
    </nav>
  );
}

export default Sidebar;
