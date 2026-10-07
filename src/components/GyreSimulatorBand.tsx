import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { Waves } from "lucide-react";
import { renderFlowBackdrop, seedParticles, type SimState } from "@/lib/tank-flow-renderer";
import { standardConfig } from "@/lib/tank-wizard";

function FlowField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const std = standardConfig();
    const state: SimState = {
      length: std.length,
      width: std.width,
      height: std.height,
      pumps: std.pumps,
      controllers: std.controllers,
      viewMode: "side",
      trails: "light",
      rockwork: "None",
      rockworkStyle: "Island Lagoon",
      substrate: "No substrate",
    };
    const particles = seedParticles(220);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let running = true;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, rect.width * dpr);
      canvas.height = Math.max(1, rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const render = (t: number) => {
      if (!running) return;
      const rect = canvas.getBoundingClientRect();
      renderFlowBackdrop(ctx, rect.width, rect.height, t * 0.4, state, particles);
      if (!reduced) frame = window.requestAnimationFrame(render);
    };

    frame = window.requestAnimationFrame(render);
    return () => {
      running = false;
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />;
}

export function GyreSimulatorBand() {
  return (
    <section className="relative flex min-h-[320px] items-center overflow-hidden bg-slate-950 text-white sm:min-h-[380px]">
      <FlowField />
      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 py-14 text-center sm:px-6 sm:py-16">
        <img
          src="/media/images/Products/Innovate/gyre-300-ce-newlayout/gyre-300-7th1.png"
          alt="Maxspect Gyre pump with cross-flow arrows"
          className="mx-auto mb-5 w-full max-w-md h-auto"
        />
        <h2
          className="text-2xl sm:text-3xl font-bold tracking-tight"
          style={{
            textShadow:
              "0 0 16px rgba(2, 12, 40, 0.25), 0 0 32px rgba(8, 30, 80, 0.25), 0 2px 6px rgba(2, 6, 23, 0.2)",
          }}
        >
          Try the Gyre Simulator
        </h2>
        <p className="mt-3 text-sm sm:text-base text-white/90">
          See how Gyre cross-flow moves through your aquarium.
        </p>
        <Link
          to="/flow-simulator"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-7 inline-flex items-center gap-2.5 rounded-xl border border-white/70 bg-white/10 px-7 py-3.5 text-base font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20"
        >
          <Waves className="w-5 h-5" />
          Open the simulator
        </Link>
      </div>
    </section>
  );
}
