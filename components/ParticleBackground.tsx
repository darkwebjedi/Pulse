"use client";
import { useEffect, useRef } from "react";

/** Soft glowing dust that drifts down the screen. Canvas-based, DPR-aware, pauses when hidden. */

const COLORS: [number, number, number][] = [
  [255, 255, 255],
  [240, 171, 252], // fuchsia-300
  [196, 181, 253], // violet-300
  [232, 121, 249], // fuchsia-400
];

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number; // px / s
  sway: number; // px
  swaySpeed: number;
  twinkle: number;
  phase: number;
  alpha: number;
  sprite: number;
}

function makeSprite([r, g, b]: [number, number, number]): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g2 = c.getContext("2d")!;
  const grad = g2.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, `rgba(${r},${g},${b},1)`);
  grad.addColorStop(0.3, `rgba(${r},${g},${b},.35)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  g2.fillStyle = grad;
  g2.fillRect(0, 0, 64, 64);
  return c;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

function spawn(w: number, h: number, anywhere: boolean): Particle {
  const bokeh = Math.random() < 0.09; // a few big, faint orbs for depth
  const size = bokeh ? rand(18, 40) : rand(3, 9);
  return {
    x: rand(0, w),
    y: anywhere ? rand(0, h) : -size,
    size,
    speed: bokeh ? rand(10, 22) : rand(16, 46) + size * 2,
    sway: rand(6, 28),
    swaySpeed: rand(0.2, 0.7),
    twinkle: rand(0.6, 1.8),
    phase: rand(0, Math.PI * 2),
    alpha: bokeh ? rand(0.07, 0.16) : rand(0.35, 0.9),
    sprite: Math.floor(rand(0, COLORS.length)),
  };
}

export default function ParticleBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sprites = COLORS.map(makeSprite);
    let w = 0;
    let h = 0;
    let particles: Particle[] = [];
    let raf = 0;
    let last = 0;
    let t = 0;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        const x = p.x + Math.sin(t * p.swaySpeed + p.phase) * p.sway;
        ctx.globalAlpha = p.alpha * (0.72 + 0.28 * Math.sin(t * p.twinkle + p.phase));
        ctx.drawImage(sprites[p.sprite], x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
      ctx.globalAlpha = 1;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(150, Math.max(45, Math.round((w * h) / 14000)));
      particles = Array.from({ length: count }, () => spawn(w, h, true));
      if (reduceMotion) draw();
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      t += dt;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y += p.speed * dt;
        if (p.y - p.size > h) particles[i] = spawn(w, h, false);
      }
      draw();
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (reduceMotion || raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    resize();
    start();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="absolute inset-0" />;
}
