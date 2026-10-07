/* ------------------------------------------------------------------ */
/*  Tank Isometric — interactive 3D orbit preview                       */
/*                                                                      */
/*  Drag to orbit around the tank; double-click resets the view.        */
/*  Faces are back-face culled + depth sorted (painter's algorithm)     */
/*  so the opaque wall, glass panels, open top and gyre markers all     */
/*  render correctly from any angle.                                    */
/* ------------------------------------------------------------------ */

import { useRef, useState, useCallback } from "react";
import type { PumpConfig, ControllerConfig } from "@/lib/tank-flow-helpers";
import { controllerColor } from "@/lib/tank-flow-helpers";

interface Props {
  length: number; // cm (X axis)
  width: number; // cm (Y / depth axis)
  height: number; // cm (Z / vertical axis)
  layout?: string; // "Standard" | "Peninsula"
  pumps?: PumpConfig[];
  controllers?: ControllerConfig[];
  className?: string;
  showHint?: boolean;
}

type FaceKey = "+X" | "-X" | "+Y" | "-Y" | "+Z" | "-Z";

interface Pt {
  x: number;
  y: number;
  depth: number;
}

const FACE_DEFS: Record<
  FaceKey,
  { normal: [number, number, number]; corners: [number, number, number][] }
> = {
  "+X": {
    normal: [1, 0, 0],
    corners: [
      [1, 0, 0],
      [1, 1, 0],
      [1, 1, 1],
      [1, 0, 1],
    ],
  },
  "-X": {
    normal: [-1, 0, 0],
    corners: [
      [0, 0, 0],
      [0, 1, 0],
      [0, 1, 1],
      [0, 0, 1],
    ],
  },
  "+Y": {
    normal: [0, 1, 0],
    corners: [
      [0, 1, 0],
      [1, 1, 0],
      [1, 1, 1],
      [0, 1, 1],
    ],
  },
  "-Y": {
    normal: [0, -1, 0],
    corners: [
      [0, 0, 0],
      [1, 0, 0],
      [1, 0, 1],
      [0, 0, 1],
    ],
  },
  "+Z": {
    normal: [0, 0, 1],
    corners: [
      [0, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 1],
    ],
  },
  "-Z": {
    normal: [0, 0, -1],
    corners: [
      [0, 0, 0],
      [0, 1, 0],
      [1, 1, 0],
      [1, 0, 0],
    ],
  },
};

const EDGES: {
  a: [number, number, number];
  b: [number, number, number];
  f1: FaceKey;
  f2: FaceKey;
  axis: "X" | "Y" | "Z";
}[] = [
  // X-parallel (length)
  { a: [0, 0, 0], b: [1, 0, 0], f1: "-Y", f2: "-Z", axis: "X" },
  { a: [0, 1, 0], b: [1, 1, 0], f1: "+Y", f2: "-Z", axis: "X" },
  { a: [0, 0, 1], b: [1, 0, 1], f1: "-Y", f2: "+Z", axis: "X" },
  { a: [0, 1, 1], b: [1, 1, 1], f1: "+Y", f2: "+Z", axis: "X" },
  // Y-parallel (width)
  { a: [0, 0, 0], b: [0, 1, 0], f1: "-X", f2: "-Z", axis: "Y" },
  { a: [1, 0, 0], b: [1, 1, 0], f1: "+X", f2: "-Z", axis: "Y" },
  { a: [0, 0, 1], b: [0, 1, 1], f1: "-X", f2: "+Z", axis: "Y" },
  { a: [1, 0, 1], b: [1, 1, 1], f1: "+X", f2: "+Z", axis: "Y" },
  // Z-parallel (height)
  { a: [0, 0, 0], b: [0, 0, 1], f1: "-X", f2: "-Y", axis: "Z" },
  { a: [1, 0, 0], b: [1, 0, 1], f1: "+X", f2: "-Y", axis: "Z" },
  { a: [0, 1, 0], b: [0, 1, 1], f1: "-X", f2: "+Y", axis: "Z" },
  { a: [1, 1, 0], b: [1, 1, 1], f1: "+X", f2: "+Y", axis: "Z" },
];

/**
 * Build an orthographic projector for a given azimuth (around Z) and
 * elevation (above horizontal). Returns screen x, screen y and a depth
 * value (larger = closer to camera) for a 3D point.
 */
function makeProjector(az: number, el: number) {
  const ca = Math.cos(az);
  const sa = Math.sin(az);
  const ce = Math.cos(el);
  const se = Math.sin(el);
  return (x: number, y: number, z: number): Pt => {
    // rotate around Z by azimuth
    const x1 = x * ca - y * sa;
    const y1 = x * sa + y * ca;
    const z1 = z;
    // rotate around X by -elevation (tilt top toward camera)
    const y2 = y1 * ce + z1 * se; // depth (toward camera = +)
    const z2 = -y1 * se + z1 * ce; // vertical (up = +)
    return { x: x1, y: -z2, depth: y2 };
  };
}

export function TankIsometric({
  length,
  width,
  height,
  layout = "Standard",
  pumps = [],
  controllers = [],
  className,
  showHint = true,
}: Props) {
  const [az, setAz] = useState(Math.PI / 4); // 45°
  const [el, setEl] = useState(Math.PI / 6); // 30°
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    dragRef.current = { x: e.clientX, y: e.clientY };
    setAz((a) => a + dx * 0.01);
    setEl((v) => Math.max(0.08, Math.min(Math.PI / 2 - 0.08, v - dy * 0.01)));
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }, []);

  const resetView = useCallback(() => {
    setAz(Math.PI / 4);
    setEl(Math.PI / 6);
  }, []);

  const maxDim = Math.max(length, width, height);
  const nx = length / maxDim;
  const ny = width / maxDim;
  const nz = height / maxDim;

  const isPeninsula = layout.toLowerCase() === "peninsula";
  const wallFace: FaceKey = isPeninsula ? "-X" : "+Y";

  const scale = 70;
  const project = makeProjector(az, el);
  const pc = (cx: number, cy: number, cz: number): Pt => {
    const r = project(cx * nx, cy * ny, cz * nz);
    return { x: r.x * scale, y: r.y * scale, depth: r.depth };
  };

  // ---- face visibility + projected corners ----
  const faceData = (Object.keys(FACE_DEFS) as FaceKey[]).map((key) => {
    const def = FACE_DEFS[key];
    const pts = def.corners.map(([cx, cy, cz]) => pc(cx, cy, cz));
    const centerDepth = (pts[0].depth + pts[1].depth + pts[2].depth + pts[3].depth) / 4;
    const n = project(def.normal[0], def.normal[1], def.normal[2]);
    return { key, pts, centerDepth, visible: n.depth > 0.0001 };
  });
  const visibleMap = Object.fromEntries(faceData.map((f) => [f.key, f.visible])) as Record<
    FaceKey,
    boolean
  >;

  // ---- viewBox bounds ----
  const allPts = faceData.flatMap((f) => f.pts);
  const xs = allPts.map((p) => p.x);
  const ys = allPts.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const pad = 34;
  const vbW = maxX - minX + pad * 2;
  const vbH = maxY - minY + pad * 2;
  const ox = -minX + pad;
  const oy = -minY + pad;

  const cxScreen = (minX + maxX) / 2 + ox;
  const cyScreen = (minY + maxY) / 2 + oy;

  // ---- gyre markers ----
  const gyreMarkers = pumps.map((p, i) => {
    const cx = p.side === "left" ? 0 : 1;
    const cy = p.depth;
    const cz = 1 - p.height;
    const pos = pc(cx, cy, cz);
    const faceKey: FaceKey = p.side === "left" ? "-X" : "+X";
    const visible = visibleMap[faceKey];
    const color = controllerColor(p.controllerId, controllers);
    return { pump: p, pos, visible, color, idx: i, faceKey };
  });

  // ---- edges ----
  const edgeData = EDGES.map((e) => {
    const a = pc(e.a[0], e.a[1], e.a[2]);
    const b = pc(e.b[0], e.b[1], e.b[2]);
    const hidden = !visibleMap[e.f1] && !visibleMap[e.f2];
    const mid = {
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
      depth: (a.depth + b.depth) / 2,
    };
    return { a, b, hidden, axis: e.axis, mid };
  });

  // ---- dimension labels: frontmost visible edge per axis ----
  const labelFor: Record<"X" | "Y" | "Z", { mid: Pt; axis: "X" | "Y" | "Z" } | null> = {
    X: null,
    Y: null,
    Z: null,
  };
  edgeData.forEach((e) => {
    if (e.hidden) return;
    const cur = labelFor[e.axis];
    if (!cur || e.mid.depth > cur.mid.depth) {
      labelFor[e.axis] = { mid: e.mid, axis: e.axis };
    }
  });
  const dimText = (axis: "X" | "Y" | "Z") =>
    axis === "X" ? `${length}cm` : axis === "Y" ? `${width}cm` : `${height}cm`;

  // ---- face styling ----
  const faceFill = (key: FaceKey) => {
    if (key === wallFace) return "url(#iso-wall-pane)";
    if (key === "+Z") return "url(#iso-top)";
    return "url(#iso-glass-pane)";
  };
  const faceStroke = (key: FaceKey) => {
    if (key === wallFace) return "rgba(45,212,191,0.55)";
    if (key === "+Z") return "rgba(34,211,238,0.55)";
    return "rgba(34,211,238,0.4)";
  };

  const visibleFaces = faceData
    .filter((f) => f.visible)
    .sort((a, b) => a.centerDepth - b.centerDepth);
  const hiddenGyres = gyreMarkers.filter((g) => !g.visible);
  const visibleGyres = gyreMarkers.filter((g) => g.visible);
  const wallFaceData = faceData.find((f) => f.key === wallFace);

  return (
    <svg
      viewBox={`0 0 ${vbW} ${vbH}`}
      className={
        className ?? "w-full h-52 cursor-grab active:cursor-grabbing touch-none select-none"
      }
      role="img"
      aria-label={`3D tank ${length}×${width}×${height} cm with ${pumps.length} gyres — drag to rotate`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onDoubleClick={resetView}
    >
      <defs>
        <linearGradient id="iso-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(34,211,238,0.22)" />
          <stop offset="100%" stopColor="rgba(34,211,238,0.10)" />
        </linearGradient>
        <linearGradient id="iso-glass-pane" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(8,47,73,0.35)" />
          <stop offset="100%" stopColor="rgba(2,6,23,0.5)" />
        </linearGradient>
        <linearGradient id="iso-wall-pane" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(34,211,238,0.28)" />
          <stop offset="50%" stopColor="rgba(20,184,166,0.22)" />
          <stop offset="100%" stopColor="rgba(13,148,136,0.30)" />
        </linearGradient>
      </defs>

      {/* hidden edges — faint dashed */}
      <g fill="none">
        {edgeData
          .filter((e) => e.hidden)
          .map((e, i) => (
            <line
              key={`he${i}`}
              x1={e.a.x + ox}
              y1={e.a.y + oy}
              x2={e.b.x + ox}
              y2={e.b.y + oy}
              stroke="rgba(56,189,248,0.16)"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          ))}
      </g>

      {/* hidden gyres — faint, behind faces (show through glass) */}
      {hiddenGyres.map((g) => (
        <g key={`hg-${g.pump.id}`}>
          <circle
            cx={g.pos.x + ox}
            cy={g.pos.y + oy}
            r="4.5"
            fill={g.color}
            fillOpacity="0.3"
            stroke={g.color}
            strokeOpacity="0.5"
            strokeWidth="1"
            strokeDasharray="2 1.5"
          />
          <text
            x={g.pos.x + ox + 6}
            y={g.pos.y + oy - 5}
            fill="rgba(165,243,252,0.5)"
            stroke="rgba(2,6,23,0.9)"
            strokeWidth="2"
            paintOrder="stroke"
            fontSize="7"
            fontFamily="monospace"
          >
            {g.idx + 1}
          </text>
        </g>
      ))}

      {/* visible faces — back to front */}
      {visibleFaces.map((f) => {
        const ptsStr = f.pts.map((p) => `${p.x + ox},${p.y + oy}`).join(" ");
        const wcx = (f.pts[0].x + f.pts[1].x + f.pts[2].x + f.pts[3].x) / 4 + ox;
        const wcy = (f.pts[0].y + f.pts[1].y + f.pts[2].y + f.pts[3].y) / 4 + oy;
        return (
          <g key={`face-${f.key}`}>
            <polygon
              points={ptsStr}
              fill={faceFill(f.key)}
              stroke={faceStroke(f.key)}
              strokeWidth="1.2"
            />
            {f.key === wallFace && (
              <text
                x={wcx}
                y={wcy + 2}
                textAnchor="middle"
                fill="rgba(255,255,255,0.75)"
                fontSize="6"
                letterSpacing="0.1em"
                fontFamily="sans-serif"
                fontWeight="600"
              >
                WALL
              </text>
            )}
          </g>
        );
      })}

      {/* visible edges — crisp on top of faces */}
      <g fill="none">
        {edgeData
          .filter((e) => !e.hidden)
          .map((e, i) => (
            <line
              key={`ve${i}`}
              x1={e.a.x + ox}
              y1={e.a.y + oy}
              x2={e.b.x + ox}
              y2={e.b.y + oy}
              stroke="rgba(34,211,238,0.5)"
              strokeWidth="1"
            />
          ))}
      </g>

      {/* visible gyres — on top */}
      {visibleGyres.map((g) => (
        <g key={`vg-${g.pump.id}`}>
          <circle cx={g.pos.x + ox} cy={g.pos.y + oy} r="7" fill={g.color} fillOpacity="0.18" />
          <circle
            cx={g.pos.x + ox}
            cy={g.pos.y + oy}
            r="3.6"
            fill={g.color}
            stroke="white"
            strokeWidth="0.8"
          />
          <text
            x={g.pos.x + ox + 6}
            y={g.pos.y + oy - 5}
            fill="rgba(165,243,252,0.85)"
            stroke="rgba(2,6,23,0.9)"
            strokeWidth="2"
            paintOrder="stroke"
            fontSize="7"
            fontFamily="monospace"
          >
            {g.idx + 1}
          </text>
        </g>
      ))}

      {/* dimension labels — placed outside the tank on the frontmost edge */}
      {(["X", "Y", "Z"] as const).map((axis) => {
        const lab = labelFor[axis];
        if (!lab) return null;
        const mx = lab.mid.x + ox;
        const my = lab.mid.y + oy;
        const dx = mx - cxScreen;
        const dy = my - cyScreen;
        const len = Math.hypot(dx, dy) || 1;
        const lx = mx + (dx / len) * 13;
        const ly = my + (dy / len) * 13 + 3;
        return (
          <text
            key={`lab-${axis}`}
            x={lx}
            y={ly}
            textAnchor="middle"
            fill="rgba(165,243,252,0.9)"
            stroke="rgba(2,6,23,0.9)"
            strokeWidth="1"
            paintOrder="stroke"
            fontSize="6"
            fontFamily="monospace"
          >
            {dimText(axis)}
          </text>
        );
      })}

      {/* hint */}
      {showHint && (
        <text
          x={vbW / 2}
          y={vbH - 4}
          textAnchor="middle"
          fill="rgba(100,116,139,0.7)"
          fontSize="6.5"
          fontFamily="sans-serif"
        >
          drag to orbit · double-click to reset
        </text>
      )}
    </svg>
  );
}
