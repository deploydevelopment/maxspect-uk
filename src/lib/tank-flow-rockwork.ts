/* ------------------------------------------------------------------ */
/*  Rockwork & Aquascape obstruction silhouettes                      */
/*  Monotone blue silhouette style reflecting exact settings:         */
/*  - Styles: Island Lagoon (twin bommies/ring), Bonsai (central tree */
/*    structure + cantilevered shelves), NSA (Negative Space         */
/*    Aquascape arches, floating branch terraces, open centre)        */
/*  - Densities: Open (minimal, sparse), Moderate (balanced islands),  */
/*    Dense (heavy, tight structure)                                  */
/* ------------------------------------------------------------------ */

import type { ViewMode } from "./tank-flow-helpers";
import { drawSideReefScape } from "./tank-flow-rockwork-side";
import { drawTopReefScape } from "./tank-flow-rockwork-top";

export function rockworkDensity(rockwork: string): number {
  if (rockwork === "Dense") return 1.0;
  if (rockwork === "Moderate") return 0.55;
  if (rockwork === "Open") return 0.22;
  if (rockwork === "None") return 0;
  return 0;
}

export function drawRockwork(
  ctx: CanvasRenderingContext2D,
  offX: number,
  offY: number,
  tankW: number,
  tankH: number,
  vm: ViewMode,
  rockwork: string,
  style: string,
) {
  const density = rockworkDensity(rockwork);
  if (density <= 0) return;

  ctx.save();
  ctx.globalAlpha = 0.35;
  if (vm === "side") {
    drawSideReefScape(ctx, offX, offY, tankW, tankH, density, style);
  } else {
    drawTopReefScape(ctx, offX, offY, tankW, tankH, density, style);
  }
  ctx.restore();
}
