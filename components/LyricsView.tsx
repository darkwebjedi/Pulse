"use client";
import { ChevronDown } from "lucide-react";
import { CSSProperties, MutableRefObject, TouchEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePlayer } from "@/context/PlayerContext";
import { useAsync } from "@/lib/hooks";
import { loadLyrics, LyricLine } from "@/lib/lyrics";
import Cover from "./Cover";

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));

/* ------------------------------------------------------------------ */
/* Smooth clock                                                        */
/* ------------------------------------------------------------------ */

interface Clock {
  pos: number;
  at: number;
  paused: boolean;
}

/**
 * The player reports its position ~4x per second, which looks choppy. This keeps a local
 * anchor and lets a requestAnimationFrame loop extrapolate between reports (60+ fps).
 * Small disagreements are ignored so the clock never visibly jitters backwards.
 */
function useSmoothClock(positionMs: number, paused: boolean): MutableRefObject<Clock> {
  const ref = useRef<Clock>({ pos: positionMs, at: performance.now(), paused });
  useEffect(() => {
    const now = performance.now();
    const c = ref.current;
    const predicted = c.paused ? c.pos : c.pos + (now - c.at);
    if (paused !== c.paused || Math.abs(predicted - positionMs) > 140) {
      ref.current = { pos: positionMs, at: now, paused };
    }
  }, [positionMs, paused]);
  return ref;
}

/* ------------------------------------------------------------------ */
/* Synced lyrics (Apple Music style)                                   */
/* ------------------------------------------------------------------ */

const REST_SCALE = 0.86;
/** Seconds-per-character used to estimate how long a line takes to sing. */
const MS_PER_CHAR = 90;

/** Word boundaries as fractions of the line, for the progressive fill. */
function wordSpans(text: string) {
  const total = text.length || 1;
  let used = 0;
  return text.split(" ").map((word) => {
    const s = used / total;
    used += word.length + 1;
    return { word, s, e: Math.min(1, used / total) };
  });
}

interface SyncedProps {
  lines: LyricLine[];
  clock: MutableRefObject<Clock>;
  onSeek: (ms: number) => void;
}

function SyncedLyrics({ lines, clock, onSeek }: SyncedProps) {
  const box = useRef<HTMLDivElement>(null);
  const lineEls = useRef<(HTMLElement | null)[]>([]);
  const tops = useRef<number[]>([]);
  const activeRef = useRef(-1);

  const [active, setActive] = useState(-1);
  const [boxH, setBoxH] = useState(600);
  const [, setLayoutVersion] = useState(0);
  const [settled, setSettled] = useState(false);

  // Manual scrolling (wheel / touch). Auto-follow resumes after a short idle.
  const [userOffset, setUserOffset] = useState(0);
  const [manual, setManual] = useState(false);
  const idle = useRef<ReturnType<typeof setTimeout>>(undefined);
  const touchY = useRef<number | null>(null);

  /* ---- measure line positions (they are fixed: only transforms animate) ---- */
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      tops.current = lineEls.current.map((l) => l?.offsetTop ?? 0);
      setBoxH(el.clientHeight);
      setLayoutVersion((v) => v + 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    // Enable transitions only after the first placement so lines don't fly in from 0.
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setSettled(true)));
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [lines]);

  /* ---- 60fps loop: active line + soft word fill, written straight to the DOM ---- */
  useEffect(() => {
    let raf = 0;
    let words: HTMLElement[] = [];

    const tick = () => {
      const c = clock.current;
      const pos = c.paused ? c.pos : c.pos + (performance.now() - c.at);

      let idx = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].timeMs <= pos + 80) idx = i;
        else break;
      }

      if (idx !== activeRef.current) {
        words.forEach((w) => w.style.removeProperty("--f")); // finished line snaps to fully lit
        activeRef.current = idx;
        setActive(idx);
        words = idx >= 0 ? Array.from(lineEls.current[idx]?.querySelectorAll<HTMLElement>(".lyric-word") ?? []) : [];
      }

      if (idx >= 0 && words.length) {
        const line = lines[idx];
        const next = lines[idx + 1];
        const gap = next ? next.timeMs - line.timeMs : 4000;
        const span = line.text
          ? Math.min(Math.max(1200, line.text.length * MS_PER_CHAR), Math.max(600, gap))
          : Math.max(600, gap);
        const p = clamp((pos - line.timeMs) / span);
        for (const w of words) {
          const s = Number(w.dataset.s);
          const e = Number(w.dataset.e);
          const f = clamp((p - s) / Math.max(0.0001, e - s));
          // -14%..114% so the soft edge fully enters and leaves each word.
          w.style.setProperty("--f", `${(-14 + f * 128).toFixed(2)}%`);
        }
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [lines, clock]);

  /* ---- manual scroll ---- */
  const nudge = (delta: number) => {
    const t = tops.current;
    const a = Math.max(active, 0);
    const lo = -((t[t.length - 1] ?? 0) - (t[a] ?? 0));
    const hi = (t[a] ?? 0) - (t[0] ?? 0) + boxH * 0.2;
    setManual(true);
    setUserOffset((o) => clamp(o + delta, lo, hi));
    clearTimeout(idle.current);
    idle.current = setTimeout(() => {
      setManual(false);
      setUserOffset(0);
    }, 3200);
  };
  useEffect(() => () => clearTimeout(idle.current), []);

  const onTouchMove = (e: TouchEvent) => {
    const y = e.touches[0].clientY;
    if (touchY.current !== null) nudge(y - touchY.current);
    touchY.current = y;
  };

  /* ---- layout ---- */
  const anchorY = boxH * 0.3; // where the active line rests
  const shift = anchorY - (tops.current[Math.max(active, 0)] ?? 0) + userOffset;

  return (
    <div
      ref={box}
      className="lyrics-mask relative h-full min-h-0 overflow-hidden px-5 md:px-10"
      onWheel={(e) => nudge(-e.deltaY)}
      onTouchStart={(e) => (touchY.current = e.touches[0].clientY)}
      onTouchMove={onTouchMove}
      onTouchEnd={() => (touchY.current = null)}
    >
      {lines.map((line, i) => {
        const d = i - active;
        const isActive = i === active;
        const dist = Math.abs(d);
        const opacity = isActive ? 1 : clamp(d < 0 ? 0.36 - dist * 0.07 : 0.56 - dist * 0.07, 0.12, 0.56);
        const blur = isActive ? 0 : Math.min(dist, 5) * 0.8 + 0.4;
        // Lines below the active one trail slightly behind it - the "wave" you see in Apple Music.
        const delay = !manual && d > 0 ? Math.min(d, 8) * 55 : 0;

        const style: CSSProperties = {
          transform: `translate3d(0, ${shift}px, 0) scale(${isActive ? 1 : REST_SCALE})`,
          opacity,
          filter: blur ? `blur(${blur}px)` : "none",
          transitionProperty: settled ? "transform, opacity, filter" : "none",
          transitionDuration: manual ? "140ms" : "800ms, 600ms, 600ms",
          transitionTimingFunction: manual ? "linear" : "cubic-bezier(0.22, 1, 0.36, 1), ease, ease",
          transitionDelay: `${delay}ms, 0ms, 0ms`,
        };

        return (
          <p
            key={i}
            ref={(el) => {
              lineEls.current[i] = el;
            }}
            onClick={() => {
              setManual(false);
              setUserOffset(0);
              onSeek(line.timeMs);
            }}
            style={style}
            className="lyric-line cursor-pointer origin-left py-[0.32em] pr-6 text-[2rem] font-extrabold leading-[1.12] tracking-tight will-change-transform hover:!opacity-90 md:text-[3.4rem]"
          >
            {wordSpans(line.text || "• • •").map(({ word, s, e }, w) => (
              <span key={w}>
                <span className="lyric-word" data-s={s} data-e={e}>
                  {word}
                </span>{" "}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Plain (unsynced) lyrics                                             */
/* ------------------------------------------------------------------ */

function PlainLyrics({ lines }: { lines: LyricLine[] }) {
  return (
    <div className="lyrics-mask h-full overflow-y-auto px-5 py-10 md:px-10" style={{ scrollbarWidth: "none" }}>
      {lines.map((l, i) => (
        <p key={i} className="my-1 text-xl font-bold leading-snug text-white/80 md:text-3xl">
          {l.text || " "}
        </p>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function LyricsView({ onClose }: { onClose: () => void }) {
  const { track, positionMs, seek, paused } = usePlayer();
  const clock = useSmoothClock(positionMs, paused);

  const { data, loading, error } = useAsync(() => (track ? loadLyrics(track) : Promise.resolve(null)), [track?.uri]);
  // Ignore a result that belongs to the previous track while the new one loads.
  const lyrics = data && track && data.trackUri === track.uri ? data : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const synced = lyrics?.synced ?? false;

  return (
    <section
      aria-label="Lyrics"
      className="glass-flat relative grid min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-3xl md:grid-cols-[18rem_minmax(0,1fr)] md:grid-rows-1"
    >
      <aside className="flex items-center gap-4 p-4 md:flex-col md:items-start md:justify-start md:gap-5 md:p-8">
        <button
          onClick={onClose}
          aria-label="Close lyrics"
          className="order-last ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 hover:bg-white/20 md:order-first md:ml-0"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
        <Cover
          src={track?.image ?? null}
          className="h-14 w-14 rounded-xl shadow-2xl shadow-fuchsia-900/50 ring-1 ring-white/15 md:aspect-square md:h-auto md:w-full md:rounded-2xl"
        />
        <div className="min-w-0 md:w-full">
          <p className="truncate text-base font-bold md:text-xl">{track?.title ?? "Nothing playing"}</p>
          <p className="truncate text-sm text-white/55">{track?.artist}</p>
          <p className="mt-3 hidden items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50 md:flex">
            Lyrics
            <span
              className={`rounded-full px-2 py-0.5 text-[9px] tracking-wider ${
                synced ? "bg-fuchsia-500/25 text-fuchsia-100" : "bg-white/10 text-white/60"
              }`}
            >
              {synced ? (paused ? "SYNCED" : "LIVE") : "TEXT"}
            </span>
          </p>
        </div>
      </aside>

      <div className="relative min-h-0">
        {!track && <Message>Play a song to see its lyrics.</Message>}
        {track && loading && !lyrics && <Message>Finding lyrics…</Message>}
        {track && !loading && !lyrics && (
          <Message>{error ? "Couldn't load lyrics right now." : "No lyrics available for this track."}</Message>
        )}
        {lyrics && synced && <SyncedLyrics key={lyrics.trackUri} lines={lyrics.lines} clock={clock} onSeek={seek} />}
        {lyrics && !synced && <PlainLyrics lines={lyrics.lines} />}
        {lyrics?.source === "lrclib" && (
          <p className="pointer-events-none absolute bottom-3 left-5 text-xs text-white/30 md:left-10">Lyrics provided by LRCLIB</p>
        )}
      </div>
    </section>
  );
}

function Message({ children }: { children: React.ReactNode }) {
  return <p className="px-5 pt-[18vh] text-2xl font-bold text-white/40 md:px-10 md:text-4xl">{children}</p>;
}
