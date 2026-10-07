/* ------------------------------------------------------------------ */
/*  Tank Flow Simulator — canvas renderer                              */
/* ------------------------------------------------------------------ */

import type {
  Particle,
  PumpConfig,
  TrailMode,
  ViewMode,
  ControllerConfig,
} from "./tank-flow-helpers";
import { roundRect, controllerColor } from "./tank-flow-helpers";
import { flowAtTop, flowAtSide, type FlowState } from "./tank-flow-fields";
import { drawRockwork } from "./tank-flow-rockwork";

export interface SimState {
  length: number;
  width: number;
  height: number;
  pumps: PumpConfig[];
  controllers: ControllerConfig[];
  viewMode: ViewMode;
  trails: TrailMode;
  rockwork: string;
  rockworkStyle: string;
  substrate: string;
  dragId?: string | null;
  hoverId?: string | null;
}

// pixel radius of the pump marker (used for hit-testing + drawing)
export const PUMP_RADIUS = 17;

// Convert a pump's normalised position into canvas pixel coords for the current view.
export function pumpPixel(
  pump: PumpConfig,
  viewMode: ViewMode,
  offX: number,
  offY: number,
  tankW: number,
  tankH: number,
) {
  const px = pump.side === "left" ? offX : offX + tankW;
  const py = offY + tankH * (viewMode === "side" ? pump.height : pump.depth);
  return { px, py };
}

export function seedParticles(n: number): Particle[] {
  return Array.from({ length: n }, () => ({
    x: Math.random(),
    y: Math.random(),
    vx: 0,
    vy: 0,
    life: Math.random() * 900,
    maxLife: 1100 + Math.random() * 700,
    history: [],
  }));
}

// how many past positions each trail mode retains
const TRAIL_LEN: Record<TrailMode, number> = {
  none: 0,
  light: 14,
  heavy: 32,
};

// Shared tank geometry so the component can hit-test pump markers for dragging.
export function tankRect(
  W: number,
  H: number,
  state: { length: number; width: number; height: number; viewMode: ViewMode },
) {
  const { length: L, width: Wd, height: Ht, viewMode: vm } = state;
  const aspect = vm === "top" ? L / Wd : L / Ht;
  let tankW = W;
  let tankH = W / aspect;
  if (tankH > H) {
    tankH = H;
    tankW = H * aspect;
  }
  const offX = (W - tankW) / 2;
  const offY = (H - tankH) / 2;
  return { offX, offY, tankW, tankH };
}

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  t: number,
  state: SimState,
  particles: Particle[],
) {
  const { offX, offY, tankW, tankH } = tankRect(W, H, state);
  const vm = state.viewMode;

  // Always fully clear the frame to avoid background accumulation of static elements
  ctx.clearRect(0, 0, W, H);

  // tank water gradient
  const grad = ctx.createLinearGradient(0, offY, 0, offY + tankH);
  if (vm === "side") {
    grad.addColorStop(0, "rgba(14,116,144,0.55)");
    grad.addColorStop(0.5, "rgba(8,47,73,0.6)");
    grad.addColorStop(1, "rgba(2,6,23,0.9)");
  } else {
    grad.addColorStop(0, "rgba(8,47,73,0.55)");
    grad.addColorStop(1, "rgba(2,6,23,0.85)");
  }
  ctx.fillStyle = grad;
  if (vm === "side") {
    fillWavyWater(ctx, offX, offY, tankW, tankH, t, state.controllers, grad);
  } else {
    roundRect(ctx, offX, offY, tankW, tankH, 14);
    ctx.fill();
  }

  // tank border — side view has no top panel; the wave is the water surface
  ctx.strokeStyle = "rgba(34,211,238,0.35)";
  ctx.lineWidth = 1.5;
  if (vm === "side") {
    strokeWavyWalls(ctx, offX, offY, tankW, tankH, t, state.controllers);
  } else {
    roundRect(ctx, offX, offY, tankW, tankH, 14);
    ctx.stroke();
  }

  // grid lines (subtle)
  ctx.strokeStyle = "rgba(56,189,248,0.07)";
  ctx.lineWidth = 1;
  const waveAt = vm === "side" ? surfaceWave(offY, t, state.controllers).waveY : null;
  for (let i = 1; i < 6; i++) {
    const gx = offX + (tankW / 6) * i;
    ctx.beginPath();
    ctx.moveTo(gx, waveAt ? waveAt(gx - offX) : offY);
    ctx.lineTo(gx, offY + tankH);
    ctx.stroke();
  }
  for (let i = 1; i < 3; i++) {
    const gy = offY + (tankH / 3) * i;
    ctx.beginPath();
    ctx.moveTo(offX, gy);
    ctx.lineTo(offX + tankW, gy);
    ctx.stroke();
  }

  // ---- Side view: surface turbulence only, no extra band ----
  if (vm === "side") {
    drawSurfaceLine(ctx, offX, tankW, offY, t, state.controllers);
  }

  // ---- Substrate bed ----
  drawSubstrate(ctx, offX, offY, tankW, tankH, vm, state.substrate);

  // ---- Rockwork obstruction silhouettes ----
  drawRockwork(ctx, offX, offY, tankW, tankH, vm, state.rockwork, state.rockworkStyle);

  // ---- alignment guides: show when a pump is being dragged ----
  if (state.dragId) {
    drawGuides(ctx, offX, offY, tankW, tankH, state.dragId, state.pumps, vm);
  }

  // draw pumps (markers on left/right walls)
  drawPumps(
    ctx,
    offX,
    offY,
    tankW,
    tankH,
    state.pumps,
    state.controllers,
    vm,
    state.dragId,
    state.hoverId,
  );

  updateAndDrawParticles(ctx, offX, offY, tankW, tankH, t, state, particles);
}

/** Water and particles only, stretched to the canvas. Pumps still drive the flow. */
export function renderFlowBackdrop(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  t: number,
  state: SimState,
  particles: Particle[],
) {
  ctx.clearRect(0, 0, W, H);

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  // Aqua at the top, theme blue through the middle, site dark blue at the bottom.
  grad.addColorStop(0, "oklch(0.78 0.12 200)");
  grad.addColorStop(0.22, "oklch(0.62 0.14 210)");
  grad.addColorStop(0.55, "oklch(0.42 0.16 245)");
  grad.addColorStop(1, "oklch(0.12 0.04 260)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(56,189,248,0.07)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 6; i++) {
    const gx = (W / 6) * i;
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, H);
    ctx.stroke();
  }
  for (let i = 1; i < 3; i++) {
    const gy = (H / 3) * i;
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(W, gy);
    ctx.stroke();
  }

  updateAndDrawParticles(ctx, 0, 0, W, H, t, state, particles);
}

function updateAndDrawParticles(
  ctx: CanvasRenderingContext2D,
  offX: number,
  offY: number,
  tankW: number,
  tankH: number,
  t: number,
  state: SimState,
  particles: Particle[],
) {
  const flowState: FlowState = {
    pumps: state.pumps,
    controllers: state.controllers,
    viewMode: state.viewMode,
    rockwork: state.rockwork,
  };
  const flowFn = state.viewMode === "side" ? flowAtSide : flowAtTop;
  const maxHist = TRAIL_LEN[state.trails];
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const f = flowFn(p.x, p.y, t, flowState);
    p.vx = p.vx * 0.92 + f.vx * 8;
    p.vy = p.vy * 0.92 + f.vy * 8;
    // Tank fraction per frame. A circuit should take many seconds, not one.
    p.x += p.vx * 0.0008;
    p.y += p.vy * 0.0008;
    p.life++;

    // wrap around tank bounds: clear history on wrap so history points never connect across the screen
    let wrapped = false;
    if (p.x < 0) {
      p.x = 1;
      wrapped = true;
    } else if (p.x > 1) {
      p.x = 0;
      wrapped = true;
    }
    if (p.y < 0) {
      p.y = 1;
      wrapped = true;
    } else if (p.y > 1) {
      p.y = 0;
      wrapped = true;
    }

    // respawn if too old
    if (p.life > p.maxLife) {
      p.x = Math.random();
      p.y = Math.random();
      p.life = 0;
      p.vx = 0;
      p.vy = 0;
      wrapped = true;
    }

    if (wrapped) {
      p.history.length = 0;
    } else if (maxHist > 0) {
      p.history.push({ x: p.x, y: p.y });
      if (p.history.length > maxHist) p.history.shift();
    } else if (p.history.length) {
      p.history.length = 0;
    }

    const sx = offX + p.x * tankW;
    const sy = offY + p.y * tankH;
    const speed = Math.hypot(p.vx, p.vy);
    const alpha = Math.min(1, speed * 0.5 + 0.3);

    // ---- fading tail polyline (history) ----
    if (maxHist > 0 && p.history.length > 1) {
      // outer glow pass
      ctx.strokeStyle = `rgba(34,211,238,${alpha * 0.18})`;
      ctx.lineWidth = 4.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      for (let h = 0; h < p.history.length; h++) {
        const hx = offX + p.history[h].x * tankW;
        const hy = offY + p.history[h].y * tankH;
        if (h === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.lineTo(sx, sy);
      ctx.stroke();

      // bright core pass, fading from tail -> head
      ctx.lineWidth = 1.8;
      for (let h = 1; h < p.history.length; h++) {
        const t0 = h / p.history.length;
        const a = alpha * t0 * 0.85;
        ctx.strokeStyle = `rgba(165,243,252,${a})`;
        ctx.beginPath();
        const x0 = offX + p.history[h - 1].x * tankW;
        const y0 = offY + p.history[h - 1].y * tankH;
        const x1 = offX + p.history[h].x * tankW;
        const y1 = offY + p.history[h].y * tankH;
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
      // connect last history point to current head
      const lx = offX + p.history[p.history.length - 1].x * tankW;
      const ly = offY + p.history[p.history.length - 1].y * tankH;
      ctx.strokeStyle = `rgba(165,243,252,${alpha})`;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(sx, sy);
      ctx.stroke();
    }

    const len = Math.min(6, speed * 1.4);
    const ang = Math.atan2(p.vy, p.vx);

    // brighter core stroke
    ctx.strokeStyle = `rgba(165,243,252,${alpha})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx - Math.cos(ang) * len, sy - Math.sin(ang) * len);
    ctx.stroke();

    // glow halo for enhanced visibility
    ctx.strokeStyle = `rgba(34,211,238,${alpha * 0.4})`;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx - Math.cos(ang) * len, sy - Math.sin(ang) * len);
    ctx.stroke();
  }
}

/* ------------------------------------------------------------------ */
/*  Substrate bed — monotone blue silhouette matching rockwork style   */
/* ------------------------------------------------------------------ */

function drawSubstrate(
  ctx: CanvasRenderingContext2D,
  offX: number,
  offY: number,
  tankW: number,
  tankH: number,
  vm: ViewMode,
  substrate: string,
) {
  if (substrate === "No substrate") return;

  const isCoarse = substrate.includes("Coarse");
  const isFine = substrate.includes("Fine");
  if (!isCoarse && !isFine) return;

  ctx.save();
  ctx.beginPath();
  ctx.rect(offX, offY, tankW, tankH);
  ctx.clip();

  const floorY = offY + tankH;

  if (vm === "side") {
    // Side view: a dune-like bed along the tank floor
    const bedH = isCoarse ? tankH * 0.1 : tankH * 0.07;
    const sandDark = "rgba(8, 47, 73, 0.35)";
    const sandMid = "rgba(12, 74, 110, 0.35)";

    // base fill
    ctx.fillStyle = sandDark;
    ctx.beginPath();
    ctx.moveTo(offX, floorY);
    const steps = 24;
    for (let i = 0; i <= steps; i++) {
      const x = offX + (tankW / steps) * i;
      const dune = Math.sin(i * 0.9) * bedH * 0.35 + Math.sin(i * 2.1 + 1.3) * bedH * 0.25;
      ctx.lineTo(x, floorY - bedH - dune);
    }
    ctx.lineTo(offX + tankW, floorY);
    ctx.closePath();
    ctx.fill();

    // lighter top crest line
    ctx.strokeStyle = sandMid;
    ctx.lineWidth = isCoarse ? 2.5 : 1.5;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const x = offX + (tankW / steps) * i;
      const dune = Math.sin(i * 0.9) * bedH * 0.35 + Math.sin(i * 2.1 + 1.3) * bedH * 0.25;
      const y = floorY - bedH - dune;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // coarse gravel: scatter pebble dots
    if (isCoarse) {
      ctx.fillStyle = "rgba(14, 116, 144, 0.3)";
      const pebbles = Math.floor(tankW / 14);
      for (let i = 0; i < pebbles; i++) {
        const px = offX + (tankW / pebbles) * i + (i % 2) * 4;
        const dune =
          Math.sin((i / pebbles) * 24 * 0.9) * bedH * 0.35 +
          Math.sin((i / pebbles) * 24 * 2.1 + 1.3) * bedH * 0.25;
        const py = floorY - bedH * 0.5 - dune;
        ctx.beginPath();
        ctx.arc(px, py, 1.6 + (i % 3) * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    // Top view: a textured floor across the whole tank base
    const sandDark = "rgba(8, 47, 73, 0.28)";
    const sandMid = "rgba(12, 74, 110, 0.3)";

    ctx.fillStyle = sandDark;
    ctx.fillRect(offX, offY, tankW, tankH);

    // speckle texture
    const grain = isCoarse ? 90 : 160;
    ctx.fillStyle = sandMid;
    for (let i = 0; i < grain; i++) {
      const gx = offX + Math.random() * tankW;
      const gy = offY + Math.random() * tankH;
      const r = isCoarse ? 1.4 + Math.random() * 1.6 : 0.6 + Math.random() * 0.8;
      ctx.beginPath();
      ctx.arc(gx, gy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // subtle dune ripples
    ctx.strokeStyle = "rgba(14, 116, 144, 0.18)";
    ctx.lineWidth = 1;
    for (let r = 0; r < 4; r++) {
      ctx.beginPath();
      const baseY = offY + tankH * (0.2 + r * 0.2);
      for (let x = 0; x <= tankW; x += 6) {
        const y = baseY + Math.sin((x / tankW) * Math.PI * 4 + r) * tankH * 0.02;
        if (x === 0) ctx.moveTo(offX + x, y);
        else ctx.lineTo(offX + x, y);
      }
      ctx.stroke();
    }
  }

  ctx.restore();
}

/* ------------------------------------------------------------------ */
/*  Side-view extras                                                   */
/* ------------------------------------------------------------------ */

function surfaceWave(offY: number, t: number, controllers: ControllerConfig[]) {
  const avgSpeed = controllers.length
    ? controllers.reduce((s, c) => s + c.speed, 0) / controllers.length
    : 50;
  const waveAmp = 2 + (avgSpeed / 100) * 4;
  const waveFreq = 0.05;
  const speedFactor = avgSpeed / 100;
  const waveY = (x: number) =>
    offY +
    Math.sin(x * waveFreq + t * 0.004 * (0.5 + speedFactor)) * waveAmp +
    Math.sin(x * waveFreq * 2.3 + t * 0.006 * speedFactor) * (waveAmp * 0.4);
  return { waveY, waveAmp, waveFreq, speedFactor };
}

function traceWave(
  ctx: CanvasRenderingContext2D,
  offX: number,
  tankW: number,
  waveY: (x: number) => number,
) {
  ctx.moveTo(offX, waveY(0));
  for (let x = 3; x <= tankW; x += 3) ctx.lineTo(offX + x, waveY(x));
}

/** Side view water. The top edge is the wave itself — no flat cap above it. */
function fillWavyWater(
  ctx: CanvasRenderingContext2D,
  offX: number,
  offY: number,
  tankW: number,
  tankH: number,
  t: number,
  controllers: ControllerConfig[],
  grad: CanvasGradient,
) {
  const { waveY } = surfaceWave(offY, t, controllers);
  const r = 14;
  ctx.fillStyle = grad;
  ctx.beginPath();
  traceWave(ctx, offX, tankW, waveY);
  ctx.lineTo(offX + tankW, offY + tankH - r);
  ctx.arcTo(offX + tankW, offY + tankH, offX, offY + tankH, r);
  ctx.arcTo(offX, offY + tankH, offX, offY, r);
  ctx.closePath();
  ctx.fill();
}

function strokeWavyWalls(
  ctx: CanvasRenderingContext2D,
  offX: number,
  offY: number,
  tankW: number,
  tankH: number,
  t: number,
  controllers: ControllerConfig[],
) {
  const { waveY } = surfaceWave(offY, t, controllers);
  const r = 14;
  ctx.beginPath();
  ctx.moveTo(offX, waveY(0));
  ctx.lineTo(offX, offY + tankH - r);
  ctx.arcTo(offX, offY + tankH, offX + tankW, offY + tankH, r);
  ctx.arcTo(offX + tankW, offY + tankH, offX + tankW, offY, r);
  ctx.lineTo(offX + tankW, waveY(tankW));
  ctx.stroke();
}

function drawSurfaceLine(
  ctx: CanvasRenderingContext2D,
  offX: number,
  tankW: number,
  offY: number,
  t: number,
  controllers: ControllerConfig[],
) {
  const { waveY, waveAmp, waveFreq, speedFactor } = surfaceWave(offY, t, controllers);

  ctx.strokeStyle = "rgba(125,211,252,0.7)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  traceWave(ctx, offX, tankW, waveY);
  ctx.stroke();

  // glint highlights on wave crests
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  for (let x = 0; x < tankW; x += 18) {
    const wy = waveY(x);
    const slope = Math.cos(x * waveFreq + t * 0.004 * (0.5 + speedFactor)) * waveAmp * waveFreq;
    if (slope < -0.05) {
      ctx.beginPath();
      ctx.arc(offX + x, wy - 1, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Pumps — colour-coded by their controller                            */
/*  (rockwork silhouettes live in ./tank-flow-rockwork.ts)             */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Alignment guides — horizontal + vertical center lines shown when   */
/*  a pump is being dragged, with a coordinate readout badge.           */
/* ------------------------------------------------------------------ */

function drawGuides(
  ctx: CanvasRenderingContext2D,
  offX: number,
  offY: number,
  tankW: number,
  tankH: number,
  dragId: string,
  pumps: PumpConfig[],
  vm: ViewMode,
) {
  const pump = pumps.find((p) => p.id === dragId);
  if (!pump) return;
  const { px, py } = pumpPixel(pump, vm, offX, offY, tankW, tankH);

  // vertical + horizontal centre lines across the tank
  const cx = offX + tankW / 2;
  const cy = offY + tankH / 2;
  ctx.save();
  ctx.strokeStyle = "rgba(34,211,238,0.22)";
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  // vertical centre
  ctx.beginPath();
  ctx.moveTo(cx, offY);
  ctx.lineTo(cx, offY + tankH);
  ctx.stroke();
  // horizontal centre
  ctx.beginPath();
  ctx.moveTo(offX, cy);
  ctx.lineTo(offX + tankW, cy);
  ctx.stroke();

  // crosshair through the dragged pump position
  ctx.strokeStyle = "rgba(34,211,238,0.5)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px, offY);
  ctx.lineTo(px, offY + tankH);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(offX, py);
  ctx.lineTo(offX + tankW, py);
  ctx.stroke();
  ctx.restore();

  // coordinate readout badge
  const axisVal = vm === "side" ? pump.height : pump.depth;
  const pct = Math.round(axisVal * 100);
  const label = vm === "side" ? `${pct}% height` : `${pct}% depth`;
  const badgeW = 86;
  const badgeH = 24;
  let bx = px + 14;
  let by = py - badgeH - 8;
  if (bx + badgeW > offX + tankW) bx = px - 14 - badgeW;
  if (by < offY) by = py + 12;
  ctx.save();
  ctx.fillStyle = "rgba(15,23,42,0.92)";
  ctx.strokeStyle = "rgba(34,211,238,0.4)";
  ctx.lineWidth = 1;
  roundRect(ctx, bx, by, badgeW, badgeH, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(165,243,252,0.95)";
  ctx.font = "600 11px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(label, bx + 10, by + badgeH / 2 + 0.5);
  ctx.restore();
}

function drawPumps(
  ctx: CanvasRenderingContext2D,
  offX: number,
  offY: number,
  tankW: number,
  tankH: number,
  pumps: PumpConfig[],
  controllers: ControllerConfig[],
  viewMode: ViewMode,
  dragId?: string | null,
  hoverId?: string | null,
) {
  pumps.forEach((p) => {
    const { px, py } = pumpPixel(p, viewMode, offX, offY, tankW, tankH);
    const active = dragId === p.id;
    const hovered = hoverId === p.id && !active;
    const r = active ? PUMP_RADIUS + 2 : PUMP_RADIUS;
    const color = controllerColor(p.controllerId, controllers);
    // hex -> rgba helper
    const hex = color.replace("#", "");
    const cr = parseInt(hex.slice(0, 2), 16);
    const cg = parseInt(hex.slice(2, 4), 16);
    const cb = parseInt(hex.slice(4, 6), 16);
    const rgba = (a: number) => `rgba(${cr},${cg},${cb},${a})`;

    // outer glow
    ctx.fillStyle = active ? rgba(0.35) : rgba(0.18);
    ctx.beginPath();
    ctx.arc(px, py, r + 6, 0, Math.PI * 2);
    ctx.fill();

    // body
    ctx.fillStyle = rgba(0.95);
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();

    // inner ring
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = hovered ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.arc(px, py, r - 3, 0, Math.PI * 2);
    ctx.stroke();
  });
}
