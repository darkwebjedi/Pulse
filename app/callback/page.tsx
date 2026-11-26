"use client";
import { useEffect, useState } from "react";
import { ensureRedirectOrigin, handleRedirectCallback } from "@/lib/spotify";

/** OAuth redirect target: exchanges ?code= for tokens, then does a full reload into the app. */
export default function CallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ensureRedirectOrigin()) return;
    console.info("[pulse] OAuth callback:", window.location.search ? "code received" : "no query string");
    handleRedirectCallback(window.location.search)
      .then(() => window.location.replace("/"))
      .catch((e: unknown) => {
        console.error("[pulse] OAuth callback failed:", e);
        setError(e instanceof Error ? e.message : "Login failed");
      });
  }, []);

  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      {error ? (
        <div className="glass max-w-sm rounded-3xl p-8">
          <h1 className="mb-2 text-lg font-semibold">Login failed</h1>
          <p className="mb-6 text-sm text-white/60">{error}</p>
          <a href="/" className="btn-primary">
            Back to start
          </a>
        </div>
      ) : (
        <p className="animate-pulse text-white/60">Connecting to Spotify…</p>
      )}
    </main>
  );
}
