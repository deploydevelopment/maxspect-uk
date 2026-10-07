/* ------------------------------------------------------------------ */
/*  Tank Flow Simulator — pump drag interaction hook                    */
/* ------------------------------------------------------------------ */

import { useRef, useState, useCallback } from "react";
import type { PumpConfig, ViewMode } from "./tank-flow-helpers";
import { tankRect, pumpPixel, PUMP_RADIUS, type SimState } from "./tank-flow-renderer";

const TAP_THRESHOLD = 6; // px of movement before a tap becomes a drag
const HIT_RADIUS = 48; // generous clickable area around each gyre

interface DragCtx {
  stateRef: React.RefObject<SimState>;
  updatePump: (id: string, patch: Partial<Pick<PumpConfig, "height" | "depth">>) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onTap?: (id: string) => void;
}

export function usePumpDrag({ stateRef, updatePump, canvasRef, onTap }: DragCtx) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragIdRef = useRef<string | null>(null);
  dragIdRef.current = dragId;

  // Track the pointer-down origin so we can distinguish a tap (no movement)
  // from a drag (movement beyond threshold). A tap opens the gyre editor.
  const downRef = useRef<{ id: string; x: number; y: number; moved: boolean } | null>(null);

  const pointerPos = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top, w: rect.width, h: rect.height };
    },
    [canvasRef],
  );

  const pumpAt = useCallback(
    (x: number, y: number, w: number, h: number): string | null => {
      const st = stateRef.current;
      const { offX, offY, tankW, tankH } = tankRect(w, h, st);
      // Generous hit zone for easy dragging — big enough for fat fingers on mobile.
      // Scales up on touch devices via pointer type, but a fixed large radius works
      // well for both mouse and touch.
      let hit: string | null = null;
      let bestDist = HIT_RADIUS;
      for (const p of st.pumps) {
        const { px, py } = pumpPixel(p, st.viewMode, offX, offY, tankW, tankH);
        const d = Math.hypot(px - x, py - y);
        if (d < bestDist) {
          bestDist = d;
          hit = p.id;
        }
      }
      return hit;
    },
    [stateRef],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const { x, y, w, h } = pointerPos(e);
      const id = pumpAt(x, y, w, h);
      if (id) {
        setDragId(id);
        downRef.current = { id, x, y, moved: false };
        (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
      }
    },
    [pointerPos, pumpAt],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const id = dragIdRef.current;
      if (!id) {
        const { x, y, w, h } = pointerPos(e);
        const hit = e.pointerType === "mouse" ? pumpAt(x, y, w, h) : null;
        canvas.style.cursor = hit ? "pointer" : "default";
        setHoverId((prev) => (prev === hit ? prev : hit));
        return;
      }
      setHoverId((prev) => (prev === null ? prev : null));
      const { x, y, w, h } = pointerPos(e);

      // Mark as moved if the pointer has travelled beyond the tap threshold.
      if (downRef.current && !downRef.current.moved) {
        const dx = x - downRef.current.x;
        const dy = y - downRef.current.y;
        if (Math.hypot(dx, dy) > TAP_THRESHOLD) {
          downRef.current.moved = true;
          setIsDragging(true);
        }
      }

      const st = stateRef.current;
      const { offY, tankH } = tankRect(w, h, st);
      const rel = (y - offY) / tankH; // 0..1 along the wall
      const clamped = Math.max(0.02, Math.min(0.98, rel));
      updatePump(id, st.viewMode === "side" ? { height: clamped } : { depth: clamped });
      canvas.style.cursor = "grabbing";
    },
    [canvasRef, pointerPos, pumpAt, stateRef, updatePump],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const down = downRef.current;
      if (dragIdRef.current) {
        try {
          (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId);
        } catch {
          /* noop */
        }
        // If the pointer never moved beyond the threshold, treat as a tap →
        // open the gyre editor for that pump.
        if (down && !down.moved && onTap) {
          onTap(down.id);
        }
        setDragId(null);
        setIsDragging(false);
      }
      downRef.current = null;
    },
    [onTap],
  );

  const onPointerLeave = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    setHoverId(null);
    onPointerUp(e);
  }, [onPointerUp]);

  return { dragId, hoverId, isDragging, onPointerDown, onPointerMove, onPointerUp, onPointerLeave };
}

export type { ViewMode };
