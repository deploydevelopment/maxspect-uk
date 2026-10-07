/* ------------------------------------------------------------------ */
/*  Tank Flow Simulator — pump-driven flow field                       */
/*  Each gyre emits a directional beam from its actual wall position,  */
/*  plus a divergence-free circulation cell. Multiple gyres combine.   */
/*  Each gyre's strength/pattern comes from its attached controller.   */
/*  Returns normalized velocity { vx, vy } at point (nx, ny) 0..1.     */
/* ------------------------------------------------------------------ */

import type { FlowMode, PumpConfig, ViewMode, ControllerConfig } from "./tank-flow-helpers";
import { defaultCages, gyreFieldParams, PUMP_MODELS } from "./tank-flow-helpers";

export interface FlowState {
  pumps: PumpConfig[]; // placed gyres — flow originates from each
  controllers: ControllerConfig[]; // controllers drive the gyres
  viewMode: ViewMode; // which position axis (height/depth) to use
  rockwork?: string; // Open, Moderate, Dense — affects flow drag
}

function speedFactor(speed: number) {
  return (speed / 100) * 0.9 + 0.1; // 0.1 .. 1.0
}

/* ------------------------------------------------------------------ */
/*  Time modulation per flow pattern                                    */
/* ------------------------------------------------------------------ */
interface ModeMod {
  dirScale: number; // multiplies pump direction (alternate reverses)
  strengthScale: number; // multiplies strength (pulse surges)
  noise: number; // turbulent chaotic component
}

function modeMod(mode: FlowMode, t: number): ModeMod {
  switch (mode) {
    case "alternate": {
      const d = Math.sin(t * 0.0008);
      return { dirScale: d, strengthScale: 1, noise: 0 };
    }
    case "pulse": {
      const p = Math.max(0, Math.sin(t * 0.0015));
      return { dirScale: 1, strengthScale: p, noise: 0 };
    }
    case "turbulent": {
      const n = Math.sin(t * 0.0023) * Math.cos(t * 0.0017);
      return { dirScale: 1, strengthScale: 1, noise: n };
    }
    default:
      return { dirScale: 1, strengthScale: 1, noise: 0 };
  }
}

/* ------------------------------------------------------------------ */
/*  Single gyre contribution                                            */
/* ------------------------------------------------------------------ */
function directorFlow(
  x: number,
  y: number,
  pump: PumpConfig,
  py: number,
  s: number,
  spread: number,
  flowScale: number,
  dirScale: number,
  strengthScale: number,
  viewMode: ViewMode,
): { vx: number; vy: number } {
  const cages = pump.cages ?? defaultCages(pump.side);
  const px = pump.side === "left" ? 0.02 : 0.98;
  const gain = s * strengthScale * flowScale;
  const flip = dirScale < 0 ? -1 : 1;
  let vx = 0;
  let vy = 0;

  cages.forEach((cage, ci) => {
    const cageCenter = py + (ci === 0 ? -0.055 : 0.055);
    cage.aims.forEach((aim, i) => {
      const outlet = cageCenter + (i - 1.5) * 0.028;
      const sigma = 0.05 * spread;
      const yd = y - outlet;
      const gauss = Math.exp(-(yd * yd) / (2 * sigma * sigma));
      const vertical = cage.axis === "vertical";

      if (vertical && viewMode === "top") {
        const dx = x - px;
        const dist = Math.hypot(dx, yd) + 0.001;
        const swirl = aim * gauss * Math.exp(-dist * 3) * gain * 0.014;
        vx += (-yd / dist) * swirl;
        vy += (dx / dist) * swirl;
        return;
      }

      if (vertical) {
        const dir = -aim;
        const travel = dir < 0 ? outlet - y : y - outlet;
        if (travel <= 0) return;
        vy += dir * Math.exp(-travel * 2.4) * gauss * gain * 0.024;
        return;
      }

      const dir = aim * flip;
      const travel = dir > 0 ? x - px : px - x;
      if (travel <= 0) return;
      vx += dir * Math.exp(-travel * 1.35) * gauss * gain * 0.022;
    });
  });

  return { vx, vy };
}

function pumpContribution(
  x: number,
  y: number,
  pump: PumpConfig,
  py: number,
  s: number, // per-pump speed factor (already normalized for pump count)
  spread: number,
  flowScale: number, // bigger pumps push harder
  dirScale: number,
  strengthScale: number,
  noise: number,
  viewMode: ViewMode,
): { vx: number; vy: number } {
  const model = PUMP_MODELS.find((m) => m.id === pump.pumpModelId);
  if (model?.directors) {
    const directed = directorFlow(
      x,
      y,
      pump,
      py,
      s,
      spread,
      flowScale,
      dirScale,
      strengthScale,
      viewMode,
    );
    if (noise !== 0) {
      const a =
        Math.sin(x * 11 + y * 7 + noise * 6) +
        Math.cos(y * 9 + x * 5 + noise * 4) +
        Math.sin((x + y) * 6 + noise * 3);
      directed.vx += Math.cos(a * 2) * s * 0.006 * Math.abs(noise) * flowScale;
      directed.vy += Math.sin(a * 2) * s * 0.006 * Math.abs(noise) * flowScale;
    }
    return directed;
  }

  const px = pump.side === "left" ? 0 : 1;
  const baseDir = pump.side === "left" ? 1 : -1;
  const dir = baseDir * dirScale;
  const A = dir * s * 0.01 * strengthScale * flowScale;

  // --- circulation cell (divergence-free) ---
  const sx = Math.sin(Math.PI * x);
  const cx = Math.cos(Math.PI * x);
  const sy = Math.sin(Math.PI * (y - py));
  const cy = Math.cos(Math.PI * (y - py));
  let vx = A * Math.PI * sx * cy;
  let vy = -A * Math.PI * cx * sy;

  // --- localized jet beam from the pump ---
  const xd = (x - px) * baseDir; // positive in front of the pump
  if (xd > 0) {
    const sigma = 0.09 * spread;
    const beamY = Math.exp(-((y - py) * (y - py)) / (2 * sigma * sigma));
    const beamX = Math.exp(-xd * 1.4); // decays across the tank
    vx += dir * beamY * beamX * s * 0.018 * strengthScale * flowScale;
    // slight vertical spread of the beam as it travels
    vy +=
      dir * beamY * beamX * (-(y - py) / (sigma * sigma)) * s * 0.004 * strengthScale * flowScale;
  }

  // --- turbulent chaotic component ---
  if (noise !== 0) {
    const a =
      Math.sin(x * 11 + y * 7 + noise * 6) +
      Math.cos(y * 9 + x * 5 + noise * 4) +
      Math.sin((x + y) * 6 + noise * 3);
    vx += Math.cos(a * 2) * s * 0.006 * Math.abs(noise) * flowScale;
    vy += Math.sin(a * 2) * s * 0.006 * Math.abs(noise) * flowScale;
  }

  return { vx, vy };
}

/* ------------------------------------------------------------------ */
/*  Combined field — sum of all placed gyres                            */
/* ------------------------------------------------------------------ */
function combinedFlow(
  nx: number,
  ny: number,
  t: number,
  state: FlowState,
): { vx: number; vy: number } {
  const n = Math.max(1, state.pumps.length);
  const perPump = 1 / Math.sqrt(n);
  // Rockwork drag resistance: dense rock structures create slight flow damping and deflections
  const rockDrag = state.rockwork === "Dense" ? 0.88 : state.rockwork === "Moderate" ? 0.94 : 1.0;
  let vx = 0;
  let vy = 0;
  for (const pump of state.pumps) {
    const controller = state.controllers.find((c) => c.id === pump.controllerId);
    if (!controller) continue;
    const { spread, flowScale } = gyreFieldParams(pump);
    const s = speedFactor(controller.speed) * perPump * rockDrag;
    const mod = modeMod(controller.flowMode, t);
    let strengthScale = mod.strengthScale;
    if (controller.flowMode === "relay") {
      const mates = state.pumps.filter((p) => p.controllerId === pump.controllerId);
      const idx = Math.max(0, mates.findIndex((p) => p.id === pump.id));
      const span = mates.length < 2 ? 0 : (2 * Math.PI) / mates.length;
      strengthScale *= 0.5 + 0.5 * Math.sin(t * 0.0007 + idx * span);
    }
    const py = state.viewMode === "side" ? pump.height : pump.depth;
    const c = pumpContribution(
      nx,
      ny,
      pump,
      py,
      s,
      spread,
      flowScale,
      mod.dirScale,
      strengthScale,
      mod.noise,
      state.viewMode,
    );
    vx += c.vx;
    vy += c.vy;
  }
  return { vx, vy };
}

/* ------------------------------------------------------------------ */
/*  Side view — vertical circulation (nx across length, ny top→bottom)  */
/* ------------------------------------------------------------------ */
export function flowAtSide(
  nx: number,
  ny: number,
  t: number,
  state: FlowState,
): { vx: number; vy: number } {
  return combinedFlow(nx, ny, t, state);
}

/* ------------------------------------------------------------------ */
/*  Top-down view — horizontal circulation (nx length, ny depth)        */
/* ------------------------------------------------------------------ */
export function flowAtTop(
  nx: number,
  ny: number,
  t: number,
  state: FlowState,
): { vx: number; vy: number } {
  return combinedFlow(nx, ny, t, state);
}
