/* ------------------------------------------------------------------ */
/*  Tank Flow Simulator — shared types & calculation helpers           */
/* ------------------------------------------------------------------ */

export type FlowMode = "gyre" | "alternate" | "relay" | "pulse" | "turbulent";

/** Cloud Edition cages sit horizontal (left/right) or rotated (up/down). */
export type CageAxis = "horizontal" | "vertical";
/** Horizontal: +1 to the right, −1 to the left. Vertical: +1 up, −1 down. */
export type DirectorAim = 1 | -1;

export interface GyreCage {
  axis: CageAxis;
  aims: [DirectorAim, DirectorAim, DirectorAim, DirectorAim];
}

export function defaultCages(side: "left" | "right"): [GyreCage, GyreCage] {
  const intoTank: DirectorAim = side === "left" ? 1 : -1;
  return [
    { axis: "horizontal", aims: [intoTank, intoTank, intoTank, intoTank] },
    { axis: "horizontal", aims: [intoTank, intoTank, intoTank, intoTank] },
  ];
}

export type ViewMode = "top" | "side";
export type TrailMode = "none" | "light" | "heavy";

/* ------------------------------------------------------------------ */
/*  Flow pattern presets — tuned combinations of flow mode + speed    */
/*  tailored to common reef livestock types.                            */
/* ------------------------------------------------------------------ */
export interface FlowPreset {
  id: string;
  label: string;
  desc: string;
  flowMode: FlowMode;
  speed: number; // controller output %
  accent: string; // tailoring tag
}

export const FLOW_PRESETS: FlowPreset[] = [
  {
    id: "soft-gentle",
    label: "Soft Coral — Gentle",
    desc: "Low, sweeping alternating flow for leathers, xenia & mushrooms",
    flowMode: "alternate",
    speed: 35,
    accent: "Soft corals",
  },
  {
    id: "lps-calm",
    label: "LPS — Calm Gyre",
    desc: "Steady moderate gyre — enough current without battering large polyps",
    flowMode: "gyre",
    speed: 50,
    accent: "Mainly LPS",
  },
  {
    id: "mixed-reef",
    label: "Mixed Reef — Balanced",
    desc: "Continuous gyre at moderate-high output for a balanced LPS/SPS mix",
    flowMode: "gyre",
    speed: 65,
    accent: "Mixed reef",
  },
  {
    id: "sps-high",
    label: "SPS — High Turulence",
    desc: "Strong, chaotic turbulent flow for high-demand small-polyp stonies",
    flowMode: "turbulent",
    speed: 85,
    accent: "Mainly SPS",
  },
];

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  history: { x: number; y: number }[];
}

/* ------------------------------------------------------------------ */
/*  Controller — a Maxspect controller drives one or more gyre pumps.  */
/*  Each controller has its own pump model, speed % and flow pattern.   */
/* ------------------------------------------------------------------ */
export interface ControllerConfig {
  id: string;
  name: string;
  speed: number; // 10..100 controller output %
  flowMode: FlowMode;
}

/* A placed gyre pump. It is driven by exactly one controller. */
export interface PumpConfig {
  id: string;
  pumpModelId: string; // this gyre's pump model (per-gyre, not per-controller)
  side: "left" | "right"; // which end wall the pump is mounted on
  height: number; // 0..1 vertical position (top→bottom) — side view
  depth: number; // 0..1 front→back position — top view
  controllerId: string; // which controller drives this gyre
  /** Cloud Edition only: two cages, four directors each. */
  cages?: [GyreCage, GyreCage];
}

export type GyrePatch = Partial<Pick<PumpConfig, "pumpModelId" | "side" | "cages">>;

export interface PumpRec {
  name: string;
  flow: number;
  series: string;
}

/* ------------------------------------------------------------------ */
/*  Maxspect Gyre pump model catalogue                                 */
/*  flow = max output L/h, power = watts, tankMax = recommended max    */
/*  tank volume, spread = relative beam width (affects flow profile)   */
/* ------------------------------------------------------------------ */
export interface PumpModel {
  id: string;
  name: string;
  series: string;
  flow: number; // L/h max
  power: number; // watts
  tankMax: number; // litres
  spread: number; // 0.7 (narrow) .. 1.5 (wide cloud beam)
  directors: boolean;
}

export const PUMP_MODELS: PumpModel[] = [
  {
    id: "jump-gf308",
    name: "Jump GF308",
    series: "Jump",
    flow: 7000,
    power: 25,
    tankMax: 400,
    spread: 0.9,
    directors: false,
  },
  {
    id: "cloud-330ce",
    name: "330CE Cloud Edition",
    series: "Cloud Edition",
    flow: 9000,
    power: 35,
    tankMax: 600,
    spread: 1.15,
    directors: true,
  },
  {
    id: "jump-gf316",
    name: "Jump GF316",
    series: "Jump",
    flow: 15000,
    power: 40,
    tankMax: 1000,
    spread: 1.05,
    directors: false,
  },
  {
    id: "cloud-350ce",
    name: "350CE Cloud Edition",
    series: "Cloud Edition",
    flow: 20000,
    power: 50,
    tankMax: 1800,
    spread: 1.35,
    directors: true,
  },
];

/* Distinct colour per controller — used in the wiring diagram + pump markers */
export const CONTROLLER_COLORS = [
  "#22d3ee", // cyan
  "#a78bfa", // violet
  "#f472b6", // pink
  "#fbbf24", // amber
  "#34d399", // emerald
  "#fb7185", // rose
  "#60a5fa", // blue
  "#facc15", // yellow
];

export function controllerColor(controllerId: string, controllers: ControllerConfig[]): string {
  const idx = controllers.findIndex((c) => c.id === controllerId);
  return (
    CONTROLLER_COLORS[
      ((idx % CONTROLLER_COLORS.length) + CONTROLLER_COLORS.length) % CONTROLLER_COLORS.length
    ] ?? CONTROLLER_COLORS[0]
  );
}

/* Resolve a gyre's effective field params from its pump model */
export function gyreFieldParams(p: PumpConfig): {
  spread: number;
  flowScale: number;
  model: PumpModel;
} {
  const model = PUMP_MODELS.find((m) => m.id === p.pumpModelId) ?? PUMP_MODELS[0];
  // bigger pumps push harder in the visualisation
  const flowScale = Math.max(0.4, Math.min(2.5, model.flow / 8000));
  return { spread: model.spread, flowScale, model };
}

export function pumpForLitres(litres: number): PumpModel {
  for (const p of PUMP_MODELS) {
    if (p.tankMax >= litres) return p;
  }
  return PUMP_MODELS[PUMP_MODELS.length - 1];
}

/**
 * Find a sensible placement for a new gyre so it doesn't sit on top of an
 * existing one on either the vertical (height) or depth axis.
 *
 * Strategy:
 *  - Pick the wall (side) that currently has the fewest pumps (balance load).
 *  - Among the gyres already on that wall, find the largest gap in the height
 *    axis and place the new pump at the midpoint of that gap. If the wall is
 *    empty, default to mid-height (0.5).
 *  - For depth, do the same gap-finding so pumps on the same wall are also
 *    spread front-to-back, not stacked.
 *
 * Returns { side, height, depth } in 0..1 normalised space.
 */
export function smartPlacement(existing: PumpConfig[]): {
  side: "left" | "right";
  height: number;
  depth: number;
} {
  const leftCount = existing.filter((p) => p.side === "left").length;
  const rightCount = existing.filter((p) => p.side === "right").length;
  const side: "left" | "right" = leftCount <= rightCount ? "left" : "right";

  const onWall = existing.filter((p) => p.side === side);

  // ---- height (vertical) placement via largest-gap midpoint ----
  const heights = onWall.map((p) => p.height).sort((a, b) => a - b);
  let height = 0.5;
  if (heights.length === 0) {
    height = 0.5;
  } else {
    // gaps: 0 -> first, between consecutive, last -> 1
    const gaps: { lo: number; hi: number; mid: number; size: number }[] = [];
    gaps.push({ lo: 0, hi: heights[0], mid: heights[0] / 2, size: heights[0] });
    for (let i = 0; i < heights.length - 1; i++) {
      const lo = heights[i];
      const hi = heights[i + 1];
      gaps.push({ lo, hi, mid: (lo + hi) / 2, size: hi - lo });
    }
    const last = heights[heights.length - 1];
    gaps.push({ lo: last, hi: 1, mid: (last + 1) / 2, size: 1 - last });
    // pick the biggest gap; tie-break toward the middle (closest to 0.5)
    gaps.sort((a, b) => b.size - a.size || Math.abs(a.mid - 0.5) - Math.abs(b.mid - 0.5));
    height = gaps[0].mid;
  }

  // ---- depth placement via largest-gap midpoint (front->back) ----
  const depths = onWall.map((p) => p.depth).sort((a, b) => a - b);
  let depth = 0.5;
  if (depths.length === 0) {
    depth = 0.5;
  } else {
    const gaps: { lo: number; hi: number; mid: number; size: number }[] = [];
    gaps.push({ lo: 0, hi: depths[0], mid: depths[0] / 2, size: depths[0] });
    for (let i = 0; i < depths.length - 1; i++) {
      const lo = depths[i];
      const hi = depths[i + 1];
      gaps.push({ lo, hi, mid: (lo + hi) / 2, size: hi - lo });
    }
    const last = depths[depths.length - 1];
    gaps.push({ lo: last, hi: 1, mid: (last + 1) / 2, size: 1 - last });
    gaps.sort((a, b) => b.size - a.size || Math.abs(a.mid - 0.5) - Math.abs(b.mid - 0.5));
    depth = gaps[0].mid;
  }

  // clamp + round to 2dp for tidy values
  const clamp2 = (v: number) => Math.max(0.05, Math.min(0.95, Math.round(v * 100) / 100));
  return { side, height: clamp2(height), depth: clamp2(depth) };
}

export function litresFromCm(l: number, w: number, h: number) {
  // usable volume (assume 90% fill)
  return Math.round(((l * w * h) / 1000) * 0.9);
}

export function recommendedFlow(litres: number) {
  // Reef rule of thumb: 20x - 40x tank volume per hour
  const low = litres * 20;
  const high = litres * 40;
  return { low, high, mid: Math.round((low + high) / 2) };
}

export function recommendPump(litres: number): PumpRec {
  const p = pumpForLitres(litres);
  return { name: p.name, flow: p.flow, series: p.series };
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
