/* ------------------------------------------------------------------ */
/*  Top-view rockwork silhouettes                                     */
/*  Monotone blue silhouette style reflecting exact settings:         */
/*  - Styles: Island Lagoon (twin bommies/lagoon ring), Bonsai        */
/*    (central dominant tree & shelves), NSA (perimeter corner towers  */
/*    with wide open negative space)                                   */
/*  - Densities: Open (minimal, sparse), Moderate (balanced islands),  */
/*    Dense (heavy, tight structure)                                  */
/* ------------------------------------------------------------------ */

interface TopFormation {
  rx: number; // 0..1 relative to tank inner width
  ry: number; // 0..1 relative to tank inner depth
  type: "shelf" | "crater" | "cabbage" | "monolith";
  size: number;
  rot: number;
}

// Base blue tones — all elements use this single hue family
const BLUE = "#0c4a6e";
const BLUE_MID = "#0e7490";
const BLUE_LIGHT = "#155e75";
const BLUE_DARK = "#082f49";

export function getTopFormations(style: string, density: number): TopFormation[] {
  // 1. BONSAI: Single strong central focal formation with compact accent stones
  if (style === "Bonsai") {
    if (density <= 0.25) {
      // Open: Single compact central bonsai cluster
      return [
        { rx: 0.5, ry: 0.5, type: "shelf", size: 1.15, rot: 0.15 },
        { rx: 0.44, ry: 0.44, type: "crater", size: 0.65, rot: -0.2 },
      ];
    }
    if (density <= 0.6) {
      // Moderate: Central tree structure with cantilever shelves & satellite stone
      return [
        { rx: 0.48, ry: 0.5, type: "shelf", size: 1.35, rot: 0.2 },
        { rx: 0.38, ry: 0.42, type: "cabbage", size: 0.75, rot: -0.3 },
        { rx: 0.58, ry: 0.56, type: "crater", size: 0.8, rot: 0.4 },
        { rx: 0.72, ry: 0.62, type: "monolith", size: 0.48, rot: 0.1 },
      ];
    }
    // Dense: Heavy multi-tier central structure + accent satellites
    return [
      { rx: 0.48, ry: 0.5, type: "shelf", size: 1.5, rot: 0.2 },
      { rx: 0.36, ry: 0.4, type: "cabbage", size: 0.85, rot: -0.3 },
      { rx: 0.6, ry: 0.58, type: "crater", size: 0.9, rot: 0.4 },
      { rx: 0.26, ry: 0.52, type: "monolith", size: 0.55, rot: 0.1 },
      { rx: 0.74, ry: 0.45, type: "cabbage", size: 0.65, rot: 0.5 },
      { rx: 0.52, ry: 0.74, type: "crater", size: 0.6, rot: -0.2 },
    ];
  }

  // 2. NSA (Negative Space Aquascape): Rocks pushed to perimeter/corners, open central channel
  if (style === "NSA") {
    if (density <= 0.25) {
      // Open: Clean corner pillar outposts, huge open negative space
      return [
        { rx: 0.2, ry: 0.3, type: "shelf", size: 0.8, rot: -0.3 },
        { rx: 0.8, ry: 0.7, type: "shelf", size: 0.85, rot: 0.3 },
      ];
    }
    if (density <= 0.6) {
      // Moderate: Two asymmetrical corner structures (left-front, right-back)
      return [
        { rx: 0.18, ry: 0.32, type: "shelf", size: 0.95, rot: -0.4 },
        { rx: 0.24, ry: 0.45, type: "crater", size: 0.68, rot: 0.2 },
        { rx: 0.82, ry: 0.68, type: "cabbage", size: 0.92, rot: 0.3 },
        { rx: 0.76, ry: 0.52, type: "shelf", size: 0.85, rot: 0.4 },
      ];
    }
    // Dense: 4 corner branch complexes with open middle swimway
    return [
      { rx: 0.16, ry: 0.26, type: "shelf", size: 0.95, rot: -0.4 },
      { rx: 0.25, ry: 0.36, type: "crater", size: 0.72, rot: 0.2 },
      { rx: 0.84, ry: 0.26, type: "cabbage", size: 0.9, rot: 0.3 },
      { rx: 0.16, ry: 0.74, type: "cabbage", size: 0.85, rot: 0.1 },
      { rx: 0.84, ry: 0.74, type: "shelf", size: 0.95, rot: 0.4 },
      { rx: 0.74, ry: 0.62, type: "crater", size: 0.75, rot: -0.3 },
    ];
  }

  // 3. ISLAND LAGOON: Classic dual bommies with clear lagoon gap
  if (density <= 0.25) {
    // Open: Two compact modest bommies
    return [
      { rx: 0.25, ry: 0.5, type: "shelf", size: 0.85, rot: -0.2 },
      { rx: 0.75, ry: 0.5, type: "crater", size: 0.88, rot: 0.25 },
    ];
  }
  if (density <= 0.6) {
    // Moderate: Balanced twin reef islands
    return [
      { rx: 0.24, ry: 0.48, type: "shelf", size: 1.05, rot: -0.2 },
      { rx: 0.28, ry: 0.62, type: "crater", size: 0.75, rot: 0.3 },
      { rx: 0.76, ry: 0.48, type: "shelf", size: 1.1, rot: 0.2 },
      { rx: 0.72, ry: 0.62, type: "cabbage", size: 0.85, rot: -0.4 },
    ];
  }
  // Dense: Rich dual bommies with connecting mini-mound in background
  return [
    { rx: 0.22, ry: 0.46, type: "shelf", size: 1.15, rot: -0.2 },
    { rx: 0.28, ry: 0.62, type: "crater", size: 0.82, rot: 0.3 },
    { rx: 0.78, ry: 0.48, type: "shelf", size: 1.18, rot: 0.2 },
    { rx: 0.72, ry: 0.64, type: "cabbage", size: 0.9, rot: -0.4 },
    { rx: 0.5, ry: 0.28, type: "monolith", size: 0.68, rot: 0.1 },
    { rx: 0.5, ry: 0.72, type: "cabbage", size: 0.75, rot: 0.2 },
  ];
}

export function drawTopReefScape(
  ctx: CanvasRenderingContext2D,
  offX: number,
  offY: number,
  tankW: number,
  tankH: number,
  density: number,
  style: string,
) {
  const pad = Math.max(16, Math.min(tankW, tankH) * 0.11);
  const innerW = tankW - pad * 2;
  const innerH = tankH - pad * 2;
  const innerX = offX + pad;
  const innerY = offY + pad;

  ctx.beginPath();
  const cr = 12;
  ctx.moveTo(offX + cr, offY);
  ctx.arcTo(offX + tankW, offY, offX + tankW, offY + tankH, cr);
  ctx.arcTo(offX + tankW, offY + tankH, offX, offY + tankH, cr);
  ctx.arcTo(offX, offY + tankH, offX, offY, cr);
  ctx.arcTo(offX, offY, offX + tankW, offY, cr);
  ctx.closePath();
  ctx.clip();

  const formations = getTopFormations(style, density);
  const baseR = Math.min(innerW / 5.5, innerH * 0.42);

  formations.forEach((f) => {
    const cx = innerX + f.rx * innerW;
    const cy = innerY + f.ry * innerH;
    const r = baseR * f.size;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(f.rot);

    if (f.type === "shelf") {
      drawTopShelfLedge(ctx, r);
    } else if (f.type === "cabbage") {
      drawTopCabbageCoral(ctx, r);
    } else if (f.type === "crater") {
      drawTopCraterCoral(ctx, r);
    } else {
      drawTopMonolith(ctx, r);
    }

    ctx.restore();
  });
}

function drawTopShelfLedge(ctx: CanvasRenderingContext2D, r: number) {
  // outer
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.7, 0, 0, Math.PI * 2);
  ctx.fillStyle = BLUE_DARK;
  ctx.fill();

  // mid
  ctx.beginPath();
  ctx.ellipse(-r * 0.08, -r * 0.06, r * 0.72, r * 0.5, 0.1, 0, Math.PI * 2);
  ctx.fillStyle = BLUE;
  ctx.fill();

  // inner
  ctx.beginPath();
  ctx.ellipse(-r * 0.15, -r * 0.12, r * 0.45, r * 0.32, 0.15, 0, Math.PI * 2);
  ctx.fillStyle = BLUE_MID;
  ctx.fill();

  // highlight
  ctx.beginPath();
  ctx.ellipse(-r * 0.15, -r * 0.12, r * 0.38, r * 0.28, Math.PI * 1.1, 0, Math.PI * 1.8);
  ctx.fillStyle = "rgba(125, 211, 252, 0.16)";
  ctx.fill();
}

function drawTopCabbageCoral(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
  ctx.fillStyle = BLUE_DARK;
  ctx.fill();

  const petals = [
    { rad: r * 0.65, c: BLUE },
    { rad: r * 0.48, c: BLUE_LIGHT },
    { rad: r * 0.3, c: BLUE_MID },
    { rad: r * 0.15, c: BLUE },
  ];
  petals.forEach((p) => {
    ctx.beginPath();
    ctx.arc(0, 0, p.rad, 0, Math.PI * 2);
    ctx.fillStyle = p.c;
    ctx.fill();
  });
}

function drawTopCraterCoral(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.85, r * 0.75, 0, 0, Math.PI * 2);
  ctx.fillStyle = BLUE;
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(-r * 0.1, -r * 0.1, r * 0.55, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = BLUE_LIGHT;
  ctx.fill();

  const cups = [
    { x: 0, y: 0, cr: r * 0.2 },
    { x: -r * 0.35, y: -r * 0.2, cr: r * 0.16 },
    { x: r * 0.35, y: -r * 0.18, cr: r * 0.15 },
    { x: -r * 0.25, y: r * 0.3, cr: r * 0.15 },
    { x: r * 0.28, y: r * 0.28, cr: r * 0.17 },
  ];
  cups.forEach((c) => {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.cr, 0, Math.PI * 2);
    ctx.fillStyle = BLUE_MID;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(c.x, c.y + 1, c.cr * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = BLUE_DARK;
    ctx.fill();
  });
}

function drawTopMonolith(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.6, r * 0.45, 0.2, 0, Math.PI * 2);
  ctx.fillStyle = BLUE;
  ctx.fill();

  // highlight
  ctx.beginPath();
  ctx.ellipse(-r * 0.15, -r * 0.1, r * 0.3, r * 0.2, 0.2, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(125, 211, 252, 0.14)";
  ctx.fill();
}
