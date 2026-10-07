import type { PumpConfig, ControllerConfig } from "./tank-flow-helpers";

export interface WiringLayout {
  W: number;
  H: number;
  ctrlX: number;
  ctrlW: number;
  pumpX: number;
  pumpW: number;
  plusGap: number;
  ctrlH: number;
  pumpH: number;
  ctrlRowH: number;
  pumpRowH: number;
  ctrlY: Record<string, number>;
  pumpY: Record<string, number>;
  placeholderY: number;
  isMobile: boolean;
}

const PAD_X = 24;
const CTRL_ROW_H = 60;
const PUMP_ROW_H = 60;
const CTRL_H = 48;
const PUMP_H = 48;
const PLACEHOLDER_H = 36;

/**
 * Always uses the horizontal side-by-side layout (controllers in the left
 * column, gyres in the right column). On narrow screens the SVG scrolls
 * horizontally inside its `overflow-x-auto` container, so the diagram is
 * effectively "on its side" rather than stacked vertically.
 */
export function computeWiringLayout(
  pumps: PumpConfig[],
  controllers: ControllerConfig[],
  isMobile: boolean,
): WiringLayout {
  const nCtrls = controllers.length;
  const nPump = pumps.length;
  const ctrlContentH = nCtrls * CTRL_ROW_H + PLACEHOLDER_H;
  const pumpContentH = nPump * PUMP_ROW_H;

  const ctrlW = 150;
  const pumpW = 150;
  const W = 560;
  const ctrlX = PAD_X;
  const pumpX = W - PAD_X - pumpW;
  const plusGap = 14;
  const H = Math.max(180, Math.max(ctrlContentH, pumpContentH) + 36);
  const ctrlYStart = (H - ctrlContentH) / 2 + CTRL_ROW_H / 2;
  const pumpYStart = (H - pumpContentH) / 2 + PUMP_ROW_H / 2;

  const ctrlY: Record<string, number> = {};
  controllers.forEach((c, i) => (ctrlY[c.id] = ctrlYStart + i * CTRL_ROW_H));
  const pumpY: Record<string, number> = {};
  pumps.forEach((p, i) => (pumpY[p.id] = pumpYStart + i * PUMP_ROW_H));

  const placeholderY = ctrlYStart + (nCtrls - 1) * CTRL_ROW_H + CTRL_ROW_H;

  return {
    W,
    H,
    ctrlX,
    ctrlW,
    pumpX,
    pumpW,
    plusGap,
    ctrlH: CTRL_H,
    pumpH: PUMP_H,
    ctrlRowH: CTRL_ROW_H,
    pumpRowH: PUMP_ROW_H,
    ctrlY,
    pumpY,
    placeholderY,
    isMobile,
  };
}

/** Build the SVG connection path between a controller and one of its gyres. */
export function connectionPath(
  L: WiringLayout,
  ctrlId: string,
  pumpId: string,
  ctrlIdx: number,
): string {
  const y1c = L.ctrlY[ctrlId] ?? L.ctrlY[Object.keys(L.ctrlY)[ctrlIdx]] ?? 0;
  const y2 = L.pumpY[pumpId];
  const x1 = L.ctrlX + L.ctrlW;
  const y1 = y1c;
  const x2 = L.pumpX;
  const yy2 = y2;
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${yy2}, ${x2} ${yy2}`;
}
