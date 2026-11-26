"use client";
import { Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { usePlayer } from "@/context/PlayerContext";
import type { Track } from "@/lib/models";

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? "Still up" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

/**
 * Dynamic hero: auto-rotates through featured tracks (pauses on hover/focus),
 * with a blurred-artwork backdrop that cross-fades to match the current slide.
 */
export default function Hero({ tracks, name }: { tracks: Track[]; name: string }) {
  const { track: current, paused, playTrack, togglePlay } = usePlayer();
  const [index, setIndex] = useState(0);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (hover || tracks.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % tracks.length), 7000);
    return () => clearInterval(id);
  }, [hover, tracks.length]);

  const slide = tracks[index];
  if (!slide) return null;

  const isCurrent = current?.uri === slide.uri;
  const isPlaying = isCurrent && !paused;
  const firstName = name.split(" ")[0];

  return (
    <section
      className="glass relative mb-10 overflow-hidden rounded-[2rem]"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      aria-roledescription="carousel"
      aria-label="Featured"
    >
      {/* Backdrop */}
      {tracks.map((t, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={t.uri}
          src={t.image ?? ""}
          alt=""
          aria-hidden
          className={`absolute inset-0 h-full w-full scale-125 object-cover opacity-0 blur-3xl transition-opacity duration-1000 ${
            i === index ? "!opacity-45" : ""
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-ink-950/80 via-ink-950/30 to-transparent" />

      <div className="relative grid items-center gap-6 p-6 md:grid-cols-[minmax(0,1fr)_auto] md:p-10">
        <div key={slide.uri} className="animate-rise">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-200/80">
            {greeting()}, {firstName}
          </p>
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
            <span className="accent-text">{slide.title}</span>
          </h1>
          <p className="mt-3 text-base text-white/70 md:text-lg">
            {slide.artist}
            {slide.album && <span className="text-white/40"> · {slide.album}</span>}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              className="btn-primary"
              onClick={() => (isCurrent ? togglePlay() : playTrack(slide.uri, tracks))}
            >
              {isPlaying ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="h-4 w-4" fill="currentColor" />}
              {isPlaying ? "Pause" : "Play now"}
            </button>
            <div className="flex gap-1.5" role="tablist" aria-label="Choose featured track">
              {tracks.map((t, i) => (
                <button
                  key={t.uri}
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Show ${t.title}`}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${i === index ? "w-8 bg-fuchsia-400" : "w-3 bg-white/25 hover:bg-white/40"}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div key={`art-${slide.uri}`} className="animate-rise hidden md:block">
          {slide.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={slide.image}
              alt={`${slide.title} cover art`}
              className="h-52 w-52 rounded-3xl object-cover shadow-2xl shadow-fuchsia-900/50 ring-1 ring-white/20 lg:h-60 lg:w-60"
            />
          )}
        </div>
      </div>
    </section>
  );
}
