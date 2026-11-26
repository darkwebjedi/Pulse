"use client";
import { AlertTriangle, Play, Waves } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginScreen() {
  const { login, enterDemo, configured, error } = useAuth();

  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <div className="glass-strong animate-rise w-full max-w-md rounded-[2rem] p-8 text-center md:p-10">
        <span className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-600 shadow-[0_14px_40px_-10px_rgba(217,70,239,0.9)]">
          <Waves className="h-8 w-8" />
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Your music, <span className="accent-text">your pulse</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/60">
          Log in with Spotify to play your top tracks and playlists right in the browser. Playback needs a Spotify Premium account.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <button className="btn-primary w-full !py-3.5 text-base" onClick={login} disabled={!configured}>
            Login with Spotify
          </button>
          <button className="btn-ghost w-full" onClick={enterDemo}>
            <Play className="h-4 w-4" fill="currentColor" /> Try the demo (no account)
          </button>
        </div>

        {!configured && (
          <p className="mt-5 flex items-start gap-2 rounded-xl bg-amber-400/10 p-3 text-left text-xs text-amber-100/90">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Spotify login is disabled: set <code className="font-mono">NEXT_PUBLIC_SPOTIFY_CLIENT_ID</code> and{" "}
              <code className="font-mono">NEXT_PUBLIC_REDIRECT_URI</code> in <code className="font-mono">.env.local</code>, then restart the dev
              server.
            </span>
          </p>
        )}
        {error && <p className="mt-4 text-xs text-rose-300">{error}</p>}
      </div>
    </main>
  );
}
