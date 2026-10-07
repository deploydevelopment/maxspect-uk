import React, { useRef, useState, useCallback, useEffect } from "react";
import { HelpCircle } from "lucide-react";
import type { PumpConfig, ControllerConfig, FlowMode, GyrePatch } from "@/lib/tank-flow-helpers";
import { computeWiringLayout, type WiringLayout } from "@/lib/tank-wiring-layout";
import { useIsMobile } from "@/hooks/use-mobile";
import { FlowDialogs } from "./TankFlowDialogs";
import { WiringSvg } from "./TankFlowWiringSvg";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const DRAG_THRESHOLD = 6; // px of movement before a tap becomes a drag
type DragMode = "reassign" | "reorder";

export function WiringDiagram({
  pumps,
  controllers,
  modes,
  onReassign,
  onReorderGyres,
  onAddController,
  onRemoveController,
  onAddGyre,
  onRemoveGyre,
  onUpdateGyre,
  onUpdateController,
}: {
  pumps: PumpConfig[];
  controllers: ControllerConfig[];
  modes: { id: FlowMode; label: string; icon: React.ReactNode; desc: string }[];
  onReassign?: (pumpId: string, controllerId: string) => void;
  onReorderGyres?: (pumpId: string, targetId: string) => void;
  onAddController?: () => void;
  onRemoveController?: (id: string) => void;
  onAddGyre?: (side: "left" | "right", controllerId: string) => void;
  onRemoveGyre?: (id: string) => void;
  onUpdateGyre?: (id: string, patch: GyrePatch) => void;
  onUpdateController?: (id: string, patch: Partial<ControllerConfig>) => void;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragPump, setDragPump] = useState<string | null>(null);
  const dragPumpRef = useRef<string | null>(null);
  const [dragMode, setDragMode] = useState<DragMode | null>(null);
  const dragModeRef = useRef<DragMode | null>(null);
  const [hoverCtrl, setHoverCtrl] = useState<string | null>(null);
  const [reorderTarget, setReorderTarget] = useState<string | null>(null);
  const reorderTargetRef = useRef<string | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const [addGyreCtrl, setAddGyreCtrl] = useState<string | null>(null);
  const [editingGyre, setEditingGyre] = useState<string | null>(null);
  const [editingController, setEditingController] = useState<string | null>(null);
  const pendingRef = useRef<{ id: string; x: number; y: number } | null>(null);
  const layoutRef = useRef<WiringLayout | null>(null);

  const isMobile = useIsMobile();
  const L = computeWiringLayout(pumps, controllers, isMobile);
  layoutRef.current = L;
  const { W, H } = L;

  // Mobile: rotate the whole diagram 90° clockwise so the wide side-by-side
  // layout fits a portrait screen without horizontal scrolling.
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [availW, setAvailW] = useState(440);
  useEffect(() => {
    if (!isMobile) return;
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setAvailW(e.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [isMobile]);

  const maxW = Math.min(availW, 460);
  const maxH = 560;
  const rotScale = Math.min(maxW / H, maxH / W);
  const boxW = H * rotScale; // visual width after rotation
  const boxH = W * rotScale; // visual height after rotation

  const toSvg = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      if (isMobile) {
        // The <svg> is CSS-rotated 90° clockwise around its centre, so un-rotate
        // the client point before mapping it into viewBox space.
        const r = svg.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = clientX - cx;
        const dy = clientY - cy;
        // inverse of 90° CW (screen, y-down): (dx,dy) -> (dy,-dx)
        const ux = dy;
        const uy = -dx;
        const s = Math.min(boxH / W, boxW / H);
        const contentW = W * s;
        const contentH = H * s;
        const offX = (boxH - contentW) / 2;
        const offY = (boxW - contentH) / 2;
        const lx = ux + boxH / 2 - offX;
        const ly = uy + boxW / 2 - offY;
        return { x: lx / s, y: ly / s };
      }
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return { x: 0, y: 0 };
      const local = pt.matrixTransform(ctm.inverse());
      return { x: local.x, y: local.y };
    },
    [isMobile, boxH, boxW, W, H],
  );

  const controllerAt = useCallback(
    (x: number, y: number): string | null => {
      const LL = layoutRef.current;
      if (!LL) return null;
      for (const c of controllers) {
        const cy = LL.ctrlY[c.id];
        if (x >= LL.ctrlX && x <= LL.ctrlX + LL.ctrlW && y >= cy - 24 && y <= cy + 24) {
          return c.id;
        }
      }
      return null;
    },
    [controllers],
  );

  const pumpSlotAt = useCallback(
    (y: number): string | null => {
      const LL = layoutRef.current;
      if (!LL) return null;
      let best: string | null = null;
      let bestDist = LL.pumpRowH / 2 + 12;
      for (const p of pumps) {
        const py = LL.pumpY[p.id];
        const d = Math.abs(py - y);
        if (d < bestDist) {
          bestDist = d;
          best = p.id;
        }
      }
      return best;
    },
    [pumps],
  );

  const onPointerDownGyre = useCallback((e: React.PointerEvent, pumpId: string) => {
    e.preventDefault();
    pendingRef.current = { id: pumpId, x: e.clientX, y: e.clientY };
    svgRef.current?.setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const pending = pendingRef.current;
      if (pending) {
        const dx = e.clientX - pending.x;
        const dy = e.clientY - pending.y;
        if (Math.hypot(dx, dy) > DRAG_THRESHOLD && (onReassign || onReorderGyres)) {
          const mode: DragMode = Math.abs(dx) > Math.abs(dy) && onReassign ? "reassign" : "reorder";
          dragModeRef.current = mode;
          setDragMode(mode);
          dragPumpRef.current = pending.id;
          setDragPump(pending.id);
          const p = toSvg(e.clientX, e.clientY);
          setPointer(p);
          if (mode === "reassign") {
            setHoverCtrl(controllerAt(p.x, p.y));
          } else {
            const tgt = pumpSlotAt(p.y);
            const next = tgt && tgt !== pending.id ? tgt : null;
            reorderTargetRef.current = next;
            setReorderTarget(next);
          }
          pendingRef.current = null;
          return;
        }
        return;
      }
      const id = dragPumpRef.current;
      if (!id) return;
      const mode = dragModeRef.current;
      const p = toSvg(e.clientX, e.clientY);
      setPointer(p);
      if (mode === "reassign") {
        setHoverCtrl(controllerAt(p.x, p.y));
      } else {
        const tgt = pumpSlotAt(p.y);
        const next = tgt && tgt !== id ? tgt : null;
        reorderTargetRef.current = next;
        setReorderTarget(next);
      }
    },
    [toSvg, controllerAt, pumpSlotAt, onReassign, onReorderGyres],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      try {
        svgRef.current?.releasePointerCapture?.(e.pointerId);
      } catch {
        /* noop */
      }
      const pending = pendingRef.current;
      if (pending) {
        setEditingGyre(pending.id);
        pendingRef.current = null;
        return;
      }
      const id = dragPumpRef.current;
      if (!id) return;
      const mode = dragModeRef.current;
      const p = toSvg(e.clientX, e.clientY);
      if (mode === "reassign") {
        const target = controllerAt(p.x, p.y);
        if (target && target !== pumps.find((pp) => pp.id === id)?.controllerId) {
          onReassign?.(id, target);
        }
      } else if (mode === "reorder" && reorderTargetRef.current) {
        onReorderGyres?.(id, reorderTargetRef.current);
      }
      dragPumpRef.current = null;
      dragModeRef.current = null;
      reorderTargetRef.current = null;
      setDragPump(null);
      setDragMode(null);
      setHoverCtrl(null);
      setReorderTarget(null);
      setPointer(null);
    },
    [toSvg, controllerAt, onReassign, onReorderGyres, pumps],
  );

  const editingPump = editingGyre ? pumps.find((p) => p.id === editingGyre) : null;
  const editingControllerObj = editingController
    ? (controllers.find((c) => c.id === editingController) ?? null)
    : null;

  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-cyan-300 text-sm font-bold uppercase tracking-wider">
          Controller → Gyre Wiring
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label="How to use the wiring diagram"
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <HelpCircle className="w-6 h-6" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-200">
            <DialogHeader>
              <DialogTitle className="text-cyan-300">Using the Wiring Diagram</DialogTitle>
            </DialogHeader>
            <ul className="space-y-2.5 text-sm text-slate-300 list-disc pl-5">
              <li>
                <span className="text-white font-medium">Drag horizontally</span> onto a controller
                to reassign a gyre to it.
              </li>
              <li>
                <span className="text-white font-medium">Drag vertically</span> to reorder gyres
                within the column.
              </li>
              <li>
                <span className="text-white font-medium">Tap a gyre</span> to edit its model and
                mounting wall.
              </li>
              <li>
                <span className="text-white font-medium">Tap a controller</span> to edit its speed
                and flow pattern.
              </li>
              <li>
                Click the <span className="text-cyan-300 font-medium">+</span> next to a controller
                to add a gyre to it.
              </li>
              <li>
                Click the <span className="text-cyan-300 font-medium">dotted outline</span> to add a
                new controller.
              </li>
              <li>
                Use the <span className="text-cyan-300 font-medium">×</span> on a controller to
                remove it (it must be empty).
              </li>
            </ul>
          </DialogContent>
        </Dialog>
      </div>
      <div
        ref={wrapRef}
        className={isMobile ? "w-full flex justify-center" : "w-full overflow-x-auto"}
      >
        <div
          style={isMobile ? { width: boxW, height: boxH, position: "relative" } : { width: "100%" }}
        >
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid meet"
            className={isMobile ? "select-none" : "w-full select-none"}
            width={isMobile ? boxH : undefined}
            height={isMobile ? boxW : undefined}
            style={
              isMobile
                ? {
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%) rotate(90deg)",
                    transformOrigin: "center",
                    touchAction: "none",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                  }
                : {
                    minWidth: 480,
                    touchAction: "none",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                  }
            }
            onPointerDown={() => setAddGyreCtrl(null)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={() => {
              pendingRef.current = null;
            }}
          >
            <WiringSvg
              L={L}
              pumps={pumps}
              controllers={controllers}
              dragPump={dragPump}
              dragMode={dragMode}
              hoverCtrl={hoverCtrl}
              reorderTarget={reorderTarget}
              pointer={pointer}
              addGyreCtrl={addGyreCtrl}
              editingGyre={editingGyre}
              canDrag={!!(onReassign || onReorderGyres)}
              onPointerDownGyre={onPointerDownGyre}
              onAddGyre={onAddGyre}
              onRemoveController={onRemoveController}
              onAddController={onAddController}
              onRemoveGyre={onRemoveGyre}
              setAddGyreCtrl={setAddGyreCtrl}
              setEditingController={setEditingController}
            />
          </svg>
        </div>
      </div>

      <FlowDialogs
        editingPump={editingPump}
        editingController={editingControllerObj}
        controllers={controllers}
        pumps={pumps}
        modes={modes}
        onUpdateGyre={onUpdateGyre}
        onUpdateController={onUpdateController}
        onCloseGyre={() => setEditingGyre(null)}
        onCloseController={() => setEditingController(null)}
      />
    </div>
  );
}
