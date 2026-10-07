/* ------------------------------------------------------------------ */
/*  Tank configuration — shared types & recommendation helpers        */
/* ------------------------------------------------------------------ */

import type { ControllerConfig, PumpConfig, FlowMode } from "./tank-flow-helpers";
import { defaultCages, pumpForLitres, smartPlacement, type PumpModel } from "./tank-flow-helpers";

export type LivestockType =
  "freshwater" | "marine-fish" | "soft-corals" | "lps" | "mixed-reef" | "sps";

export type TankLayout = "standard" | "peninsula";
export type MountingPanel = "back" | "left" | "right" | "front";
export type Rockwork = "none" | "open" | "moderate" | "dense";
export type Substrate = "bare" | "fine-sand" | "coarse-sand";
export type GlassThickness = "6" | "8" | "10" | "12" | "15" | "19";

export const LIVESTOCK_OPTIONS: {
  id: LivestockType;
  label: string;
  desc: string;
  turnover: [number, number]; // min/max x volume per hour
}[] = [
  {
    id: "freshwater",
    label: "Freshwater",
    desc: "Tropical or coldwater freshwater",
    turnover: [5, 10],
  },
  {
    id: "marine-fish",
    label: "Marine fish only",
    desc: "Fish-only saltwater (FOWLR)",
    turnover: [10, 20],
  },
  {
    id: "soft-corals",
    label: "Soft corals",
    desc: "Leather, xenia, mushrooms",
    turnover: [15, 25],
  },
  { id: "lps", label: "Mainly LPS", desc: "Large-polyp stony corals", turnover: [20, 30] },
  { id: "mixed-reef", label: "Mixed reef", desc: "LPS + some SPS", turnover: [25, 35] },
  { id: "sps", label: "Mainly SPS", desc: "Small-polyp stony, high-flow", turnover: [30, 50] },
];

export const ROCKWORK_OPTIONS: {
  id: Rockwork;
  label: string;
  desc: string;
  flowBoost: number; // multiplier added to target turnover
}[] = [
  { id: "none", label: "None", desc: "No rockwork — bare tank", flowBoost: 0 },
  { id: "open", label: "Open", desc: "Minimal rock, lots of swimming space", flowBoost: 0 },
  { id: "moderate", label: "Moderate", desc: "Island or wall aquascape", flowBoost: 3 },
  { id: "dense", label: "Dense", desc: "Heavy rockwork, tight structure", flowBoost: 6 },
];

export type RockworkStyle = "island-lagoon" | "bonsai" | "nsa";

export const ROCKWORK_STYLE_OPTIONS: {
  id: RockworkStyle;
  label: string;
  desc: string;
}[] = [
  {
    id: "island-lagoon",
    label: "Island Lagoon",
    desc: "Ring of bommies around an open centre",
  },
  {
    id: "bonsai",
    label: "Bonsai",
    desc: "Single central formation with accent rocks",
  },
  {
    id: "nsa",
    label: "NSA",
    desc: "Negative space — rocks to the corners, open middle",
  },
];

export const SUBSTRATE_OPTIONS: {
  id: Substrate;
  label: string;
  desc: string;
  minPumpHeight: number; // 0..1 — pumps shouldn't sit too low over sand
}[] = [
  { id: "bare", label: "No substrate", desc: "No substrate added", minPumpHeight: 0.1 },
  {
    id: "fine-sand",
    label: "Fine sand",
    desc: "Sugar-fine aragonite / oolitic",
    minPumpHeight: 0.3,
  },
  {
    id: "coarse-sand",
    label: "Coarse sand / gravel",
    desc: "Crushed coral or pea gravel",
    minPumpHeight: 0.22,
  },
];

export const GLASS_OPTIONS: { id: GlassThickness; label: string }[] = [
  { id: "6", label: "6 mm" },
  { id: "8", label: "8 mm" },
  { id: "10", label: "10 mm" },
  { id: "12", label: "12 mm" },
  { id: "15", label: "15 mm" },
  { id: "19", label: "19 mm" },
];

/**
 * Recommend a glass thickness (in mm) from the tank's water-column height.
 * Based on common aquarium engineering standards:
 *   - Small (under ~12" / 31 cm):         6 mm
 *   - Medium (12-21" / 31-54 cm):         8 mm
 *   - Large (22-25" / 55-64 cm):          10 mm
 *   - Extra-large / rimless (25"+ / 65+):12 mm
 * Height is the primary driver of hydrostatic pressure on the panels.
 */
export function recommendedGlassMm(heightCm: number): string {
  if (heightCm < 31) return "6";
  if (heightCm < 55) return "8";
  if (heightCm < 65) return "10";
  return "12";
}

/** Volume in litres from dimensions (90% fill assumed). */
export function volumeFromCm(l: number, w: number, d: number): number {
  return Math.round(((l * w * d) / 1000) * 0.9);
}

/** A sensible standard default config for the simulator. */
export function standardConfig(): {
  length: number;
  width: number;
  height: number;
  controllers: ControllerConfig[];
  pumps: PumpConfig[];
} {
  const length = 120;
  const width = 50;
  const height = 55;
  const model = pumpForLitres(volumeFromCm(length, width, height));
  void model as PumpModel;
  return {
    length,
    width,
    height,
    controllers: [
      {
        id: "c1",
        name: "Controller 1",
        speed: 60,
        flowMode: "gyre" as FlowMode,
      },
    ],
    pumps: [
      {
        id: "p1",
        side: "left",
        height: 0.35,
        depth: 0.5,
        controllerId: "c1",
        pumpModelId: model.id,
        cages: defaultCages("left"),
      },
      {
        id: "p2",
        side: "right",
        height: 0.65,
        depth: 0.5,
        controllerId: "c1",
        pumpModelId: model.id,
        cages: defaultCages("right"),
      },
    ],
  };
}

function liftPumpsAboveSand(pumps: PumpConfig[], substrateLabel?: string) {
  const sub = SUBSTRATE_OPTIONS.find((s) => s.label === substrateLabel);
  const lowest = sub ? 1 - sub.minPumpHeight : 0.9;
  for (const side of ["left", "right"] as const) {
    const wall = pumps.filter((p) => p.side === side).sort((a, b) => a.height - b.height);
    if (!wall.length) continue;
    const tooLow = wall.some((p) => p.height > lowest);
    if (!tooLow) continue;
    const top = 0.2;
    wall.forEach((p, i) => {
      p.height =
        wall.length === 1 ? Math.min(0.45, lowest) : top + ((lowest - top) * i) / (wall.length - 1);
    });
  }
}

/* ------------------------------------------------------------------ */
/*  Recommend a gyre + controller configuration from the tank setup.   */
/*  Uses livestock turnover target + rockwork flow boost to size the    */
/*  number of pumps, then places them on opposite walls via the        */
/*  smart-placement gap finder so they never overlap.                    */
/* ------------------------------------------------------------------ */
export function recommendGyreConfig(
  litres: number,
  livestockLabel: string,
  rockworkLabel: string,
  substrateLabel?: string,
): {
  controllers: ControllerConfig[];
  pumps: PumpConfig[];
  targetFlow: number;
  turnover: number;
  pumpModelId: string;
  flowMode: FlowMode;
  speed: number;
} {
  const ls = LIVESTOCK_OPTIONS.find((l) => l.label === livestockLabel) ?? LIVESTOCK_OPTIONS[4];
  const rw = ROCKWORK_OPTIONS.find((r) => r.label === rockworkLabel) ?? ROCKWORK_OPTIONS[2];
  const targetTurnover = (ls.turnover[0] + ls.turnover[1]) / 2 + rw.flowBoost;
  const targetFlow = Math.round(targetTurnover * litres);

  const flowMode: FlowMode =
    ls.id === "soft-corals" ? "alternate" : ls.id === "sps" ? "turbulent" : "gyre";

  const model = pumpForLitres(litres);
  const perPumpAt70 = model.flow * 0.7;
  let numPumps = Math.max(2, Math.ceil(targetFlow / perPumpAt70));
  numPumps = Math.min(8, numPumps);

  const numControllers = numPumps > 4 ? 2 : 1;
  const speed = Math.max(
    35,
    Math.min(100, Math.round((targetFlow / (numPumps * model.flow)) * 100)),
  );

  const controllers: ControllerConfig[] = [];
  for (let i = 0; i < numControllers; i++) {
    controllers.push({
      id: `c${i + 1}`,
      name: `Controller ${i + 1}`,
      speed,
      flowMode,
    });
  }

  const pumps: PumpConfig[] = [];
  for (let i = 0; i < numPumps; i++) {
    const placement = smartPlacement(pumps);
    const controllerId = controllers[i % numControllers].id;
    pumps.push({
      id: `p${i + 1}`,
      pumpModelId: model.id,
      side: placement.side,
      height: placement.height,
      depth: placement.depth,
      controllerId,
      cages: defaultCages(placement.side),
    });
  }

  liftPumpsAboveSand(pumps, substrateLabel);

  return {
    controllers,
    pumps,
    targetFlow,
    turnover: Math.round(targetTurnover),
    pumpModelId: model.id,
    flowMode,
    speed,
  };
}
