/* ------------------------------------------------------------------ */
/*  Side-view rockwork silhouettes                                     */
/*  Monotone blue silhouette style accurately reflecting layout style  */
/*  (Bonsai, NSA, Island Lagoon) and density (Open, Moderate, Dense)  */
/* ------------------------------------------------------------------ */

// Base blue tones — single unified hue family
const BLUE = "#0c4a6e";
const BLUE_MID = "#0e7490";
const BLUE_LIGHT = "#155e75";
const BLUE_DARK = "#082f49";

export function drawSideReefScape(
  ctx: CanvasRenderingContext2D,
  offX: number,
  offY: number,
  tankW: number,
  tankH: number,
  density: number,
  style: string,
) {
  const floorY = offY + tankH;

  ctx.save();
  ctx.beginPath();
  ctx.rect(offX, offY, tankW, tankH);
  ctx.clip();

  if (style === "Bonsai") {
    drawSideBonsai(ctx, offX, floorY, tankW, tankH, density);
  } else if (style === "NSA") {
    drawSideNSA(ctx, offX, floorY, tankW, tankH, density);
  } else {
    // Island Lagoon (default)
    drawSideIslandLagoon(ctx, offX, floorY, tankW, tankH, density);
  }

  ctx.restore();
}

/* ------------------------------------------------------------------ */
/*  1. BONSAI Aquascape                                               */
/*  Single dominant focal structure with ascending stem and broad     */
/*  horizontal flat cantilevered shelves, plus small accent pebble    */
/* ------------------------------------------------------------------ */
function drawSideBonsai(
  ctx: CanvasRenderingContext2D,
  offX: number,
  floorY: number,
  tankW: number,
  tankH: number,
  density: number,
) {
  const cx = offX + tankW * 0.48;
  const maxH = tankH * (0.35 + density * 0.35); // Open: ~42% height, Dense: ~70%
  const w = tankW * (0.22 + density * 0.16);

  // Background delicate seaweed / gorgonian branch
  drawSlenderBranch(ctx, cx + w * 0.35, floorY, maxH * 0.8, BLUE_DARK);

  // Sturdy base trunk / pillar on the floor
  drawRockTrunk(ctx, cx, floorY, w * 0.45, maxH * 0.55);

  // Lower cantilever shelf (reaching left)
  drawFlatShelf(ctx, cx - w * 0.5, floorY - maxH * 0.4, w * 0.65, maxH * 0.18, BLUE);

  // Middle cantilever shelf (reaching right)
  drawFlatShelf(ctx, cx + w * 0.05, floorY - maxH * 0.65, w * 0.6, maxH * 0.17, BLUE_MID);

  // Crown top bonsai terrace
  drawFlatShelf(ctx, cx - w * 0.25, floorY - maxH * 0.95, w * 0.55, maxH * 0.16, BLUE_LIGHT);

  // If moderate or dense: small satellite accent rock on the side
  if (density > 0.3) {
    const accentX = offX + tankW * 0.74;
    const accentH = maxH * 0.32;
    drawDomeRock(ctx, accentX, floorY, w * 0.3, accentH, BLUE);
  }

  // Dense adds a secondary small left outpost
  if (density > 0.7) {
    const leftX = offX + tankW * 0.22;
    const leftH = maxH * 0.28;
    drawDomeRock(ctx, leftX, floorY, w * 0.25, leftH, BLUE_DARK);
  }
}

/* ------------------------------------------------------------------ */
/*  2. NSA (Negative Space Aquascape)                                 */
/*  Airy floating arches, sweeping branches, twin asymmetric towers,  */
/*  wide open negative space in the centre channel                    */
/* ------------------------------------------------------------------ */
function drawSideNSA(
  ctx: CanvasRenderingContext2D,
  offX: number,
  floorY: number,
  tankW: number,
  tankH: number,
  density: number,
) {
  const maxH = tankH * (0.32 + density * 0.36);
  const leftX = offX + tankW * 0.22;
  const rightX = offX + tankW * 0.78;
  const w = tankW * (0.16 + density * 0.1);

  // Left NSA branch tower
  drawNSATower(ctx, leftX, floorY, w, maxH * 0.9, true);

  // Right NSA branch tower (taller focal point)
  drawNSATower(ctx, rightX, floorY, w * 1.1, maxH, false);

  // If dense: low central connecting arch or stepping boulder
  if (density > 0.7) {
    const archCx = offX + tankW * 0.5;
    drawFloatingArch(ctx, archCx, floorY, tankW * 0.2, maxH * 0.32);
  } else if (density > 0.3) {
    // Moderate: single small low stepping rock leaving lots of negative space
    drawDomeRock(ctx, offX + tankW * 0.5, floorY, tankW * 0.08, maxH * 0.2, BLUE_DARK);
  }
}

/* ------------------------------------------------------------------ */
/*  3. ISLAND LAGOON                                                  */
/*  Classic dual bommies (left reef structure + right reef structure) */
/*  with a natural lagoon swimming pass in the centre                 */
/* ------------------------------------------------------------------ */
function drawSideIslandLagoon(
  ctx: CanvasRenderingContext2D,
  offX: number,
  floorY: number,
  tankW: number,
  tankH: number,
  density: number,
) {
  const maxH = tankH * (0.3 + density * 0.35);
  const leftX = offX + tankW * (0.2 + (1 - density) * 0.05);
  const rightX = offX + tankW * (0.78 - (1 - density) * 0.05);
  const leftW = tankW * (0.2 + density * 0.12);
  const rightW = tankW * (0.24 + density * 0.14);

  // Background subtle kelp in the lagoon gap
  if (density > 0.3) {
    drawSlenderBranch(ctx, offX + tankW * 0.48, floorY, maxH * 0.45, "rgba(8, 47, 73, 0.45)");
  }

  // Left island bommie — tiered shelves + dome
  drawLayeredBommie(ctx, leftX, floorY, leftW, maxH * 0.82, false);

  // Right island bommie (dominant)
  drawLayeredBommie(ctx, rightX, floorY, rightW, maxH, true);

  // Dense adds a small center-rear mini mound
  if (density > 0.7) {
    drawDomeRock(ctx, offX + tankW * 0.5, floorY, tankW * 0.12, maxH * 0.3, BLUE_DARK);
  }
}

/* ------------------------------------------------------------------ */
/*  Primitive side-view builders                                      */
/* ------------------------------------------------------------------ */

function drawFlatShelf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
) {
  // rock shelf body
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.45);
  ctx.bezierCurveTo(x + w * 0.2, y, x + w * 0.8, y, x + w, y + h * 0.4);
  ctx.bezierCurveTo(x + w * 1.02, y + h * 0.85, x + w * 0.7, y + h, x + w * 0.5, y + h);
  ctx.bezierCurveTo(x + w * 0.15, y + h, x - w * 0.02, y + h * 0.85, x, y + h * 0.45);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();

  // highlight on top edge
  ctx.beginPath();
  ctx.ellipse(x + w * 0.5, y + h * 0.25, w * 0.38, h * 0.14, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(125, 211, 252, 0.15)";
  ctx.fill();
}

function drawRockTrunk(
  ctx: CanvasRenderingContext2D,
  cx: number,
  floorY: number,
  w: number,
  h: number,
) {
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.55, floorY);
  ctx.lineTo(cx - w * 0.3, floorY - h);
  ctx.lineTo(cx + w * 0.3, floorY - h);
  ctx.lineTo(cx + w * 0.55, floorY);
  ctx.closePath();
  ctx.fillStyle = BLUE;
  ctx.fill();
}

function drawDomeRock(
  ctx: CanvasRenderingContext2D,
  cx: number,
  floorY: number,
  w: number,
  h: number,
  fill: string,
) {
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.5, floorY);
  ctx.bezierCurveTo(cx - w * 0.55, floorY - h * 0.7, cx - w * 0.2, floorY - h, cx, floorY - h);
  ctx.bezierCurveTo(
    cx + w * 0.2,
    floorY - h,
    cx + w * 0.55,
    floorY - h * 0.7,
    cx + w * 0.5,
    floorY,
  );
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawNSATower(
  ctx: CanvasRenderingContext2D,
  cx: number,
  floorY: number,
  w: number,
  h: number,
  leanLeft: boolean,
) {
  const lean = leanLeft ? -w * 0.25 : w * 0.25;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.4, floorY);
  ctx.bezierCurveTo(
    cx - w * 0.2,
    floorY - h * 0.4,
    cx + lean - w * 0.15,
    floorY - h * 0.7,
    cx + lean,
    floorY - h * 0.9,
  );
  ctx.bezierCurveTo(
    cx + lean + w * 0.2,
    floorY - h * 0.85,
    cx + w * 0.3,
    floorY - h * 0.35,
    cx + w * 0.4,
    floorY,
  );
  ctx.closePath();
  ctx.fillStyle = BLUE_MID;
  ctx.fill();

  // Floating branch shelf jutting out
  const shelfX = leanLeft ? cx - w * 0.65 : cx - w * 0.1;
  drawFlatShelf(ctx, shelfX, floorY - h * 0.65, w * 0.75, h * 0.15, BLUE_LIGHT);

  // Top crown cup
  drawDomeRock(ctx, cx + lean, floorY - h * 0.9, w * 0.35, h * 0.18, BLUE_MID);
}

function drawFloatingArch(
  ctx: CanvasRenderingContext2D,
  cx: number,
  floorY: number,
  w: number,
  h: number,
) {
  ctx.beginPath();
  // outer arch
  ctx.moveTo(cx - w * 0.5, floorY);
  ctx.quadraticCurveTo(cx, floorY - h * 1.3, cx + w * 0.5, floorY);
  ctx.lineTo(cx + w * 0.3, floorY);
  // inner negative space cutout
  ctx.quadraticCurveTo(cx, floorY - h * 0.6, cx - w * 0.3, floorY);
  ctx.closePath();
  ctx.fillStyle = BLUE;
  ctx.fill();
}

function drawLayeredBommie(
  ctx: CanvasRenderingContext2D,
  cx: number,
  floorY: number,
  w: number,
  h: number,
  isRight: boolean,
) {
  // Lower mound
  drawDomeRock(ctx, cx, floorY, w * 0.95, h * 0.45, BLUE_DARK);
  // Mid shelf
  const midOffset = isRight ? -w * 0.1 : w * 0.1;
  drawFlatShelf(ctx, cx - w * 0.4 + midOffset, floorY - h * 0.65, w * 0.8, h * 0.28, BLUE);
  // Crown top
  const topOffset = isRight ? w * 0.08 : -w * 0.08;
  drawDomeRock(ctx, cx + topOffset, floorY - h * 0.65, w * 0.48, h * 0.35, BLUE_LIGHT);
}

function drawSlenderBranch(
  ctx: CanvasRenderingContext2D,
  x: number,
  floorY: number,
  h: number,
  color: string,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, floorY);
  ctx.quadraticCurveTo(x + 12, floorY - h * 0.5, x + 6, floorY - h);
  ctx.stroke();

  // side offshoot
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(x + 8, floorY - h * 0.45);
  ctx.quadraticCurveTo(x + 22, floorY - h * 0.65, x + 18, floorY - h * 0.8);
  ctx.stroke();
  ctx.restore();
}
