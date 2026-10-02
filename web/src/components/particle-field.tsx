"use client";

/**
 * Floating pixels — canvas particle field, hero only.
 * ~60 particles, rAF, paused offscreen and under reduced motion. No library.
 * Restrained: sparkle-on-everything is an AI-design tell.
 */
import { useEffect, useRef } from "react";

export function ParticleField({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const COLORS = ["#7c5cff", "#22d3ee", "#22c55e"];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function size() {
      const r = canvas!.parentElement!.getBoundingClientRect();
      canvas!.width = r.width * dpr;
      canvas!.height = r.height * dpr;
      canvas!.style.width = `${r.width}px`;
      canvas!.style.height = `${r.height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();

    const COUNT = 60;
    const ps = Array.from({ length: COUNT }, () => ({
      x: Math.random() * (canvas.width / dpr),
      y: Math.random() * (canvas.height / dpr),
      vx: (Math.random() - 0.5) * 0.14,
      vy: (Math.random() - 0.5) * 0.1,
      r: Math.random() * 1.4 + 0.5,
      c: COLORS[Math.floor(Math.random() * COLORS.length)],
      a: Math.random() * 0.5 + 0.15,
    }));

    let raf = 0;
    let visible = true;

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible && !raf && !reduce) raf = requestAnimationFrame(tick);
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    function tick() {
      if (!visible) {
        raf = 0;
        return;
      }
      const w = canvas!.width / dpr;
      const h = canvas!.height / dpr;
      ctx!.clearRect(0, 0, w, h);
      for (const p of ps) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        ctx!.globalAlpha = p.a;
        ctx!.fillStyle = p.c;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    }

    if (!reduce) raf = requestAnimationFrame(tick);
    window.addEventListener("resize", size);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", size);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className={className}
      aria-hidden
      style={{ pointerEvents: "none" }}
    />
  );
}
