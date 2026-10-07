import React, { useEffect, useRef, useState } from "react";
import { RotateCw, ArrowLeftRight, Activity, Zap, Wand2, HelpCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  type FlowMode,
  type ViewMode,
  type TrailMode,
  type PumpConfig,
  type ControllerConfig,
  type GyrePatch,
  PUMP_MODELS,
  defaultCages,
  pumpForLitres,
  litresFromCm,
  recommendedFlow,
} from "@/lib/tank-flow-helpers";
import { renderFrame, seedParticles, tankRect, pumpPixel, type SimState } from "@/lib/tank-flow-renderer";
import { usePumpDrag } from "@/lib/tank-flow-drag";
import { WiringDiagram } from "./TankFlowWiring";
import { GyreEditor } from "./TankFlowControllerEditor";
import { RecCard } from "./TankFlowBits";
import { recommendGyreConfig, standardConfig } from "@/lib/tank-wizard";
import { TankSetupButtons } from "./TankSetupButtons";
import { TankIsometric } from "./TankIsometric";
import { TankSetupWizard } from "./TankSetupWizard";
import { TankPurchaseShare } from "./TankPurchaseShare";

export function TankFlowSimulator() {
  const std = standardConfig();
  const [length, setLength] = useState(std.length);
  const [width, setWidth] = useState(std.width);
  const [height, setHeight] = useState(std.height);

  const [controllers, setControllers] = useState<ControllerConfig[]>(std.controllers);
  const [pumps, setPumps] = useState<PumpConfig[]>(std.pumps);
  const [viewMode, setViewMode] = useState<ViewMode>("side");
  const [trails, setTrails] = useState<TrailMode>("light");
  const [livestock, setLivestock] = useState<string>("Mixed reef");
  const [rockwork, setRockwork] = useState<string>("Moderate");
  const [rockworkStyle, setRockworkStyle] = useState<string>("Island Lagoon");
  const [substrate, setSubstrate] = useState<string>("Fine sand");
  const [glass, setGlass] = useState<string>("10 mm");
  const [layout, setLayout] = useState<string>("Standard");
  const [editingPumpId, setEditingPumpId] = useState<string | null>(null);
  // The simulator loads with a default config running in the background; the
  // setup wizard animates in after 3 seconds and stays until dismissed.
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setWizardOpen(true), 1000);
    return () => clearTimeout(t);
  }, []);

  const restartWizard = () => {
    setLength(std.length);
    setWidth(std.width);
    setHeight(std.height);
    setControllers(std.controllers);
    setPumps(std.pumps);
    setLivestock("Mixed reef");
    setRockwork("Moderate");
    setRockworkStyle("Island Lagoon");
    setSubstrate("Fine sand");
    setGlass("10 mm");
    setLayout("Standard");
    setWizardOpen(true);
  };

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef(seedParticles(220));
  const animRef = useRef<number>(0);

  const litres = litresFromCm(length, width, height);
  const rec = recommendedFlow(litres);

  const totalFlow = pumps.reduce((sum, p) => {
    const c = controllers.find((cc) => cc.id === p.controllerId);
    if (!c) return sum;
    const model = PUMP_MODELS.find((m) => m.id === p.pumpModelId) ?? PUMP_MODELS[0];
    return sum + model.flow * (c.speed / 100);
  }, 0);
  const actualFlow = Math.round(totalFlow);
  const turnover = actualFlow / litres;

  const addController = () =>
    setControllers((prev) =>
      prev.length >= 8
        ? prev
        : [
            ...prev,
            {
              id: `c${Date.now()}`,
              name: `Controller ${prev.length + 1}`,
              speed: 60,
              flowMode: "gyre",
            },
          ],
    );
  const removeController = (id: string) =>
    setControllers((prev) => {
      // Only allow removing a controller that has no gyres attached.
      if (prev.length <= 1) return prev;
      if (pumps.some((p) => p.controllerId === id)) return prev;
      return prev.filter((c) => c.id !== id);
    });
  const updateController = (id: string, patch: Partial<ControllerConfig>) =>
    setControllers((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const addPump = () => addPumpWithSide("left");
  const addPumpWithSide = (side: "left" | "right", controllerId?: string) =>
    setPumps((prev) => {
      if (prev.length >= 8) return prev;
      // Smart placement: spread the new gyre so it doesn't overlap existing
      // ones on either the vertical (height) or depth axis. We find the
      // largest gap among gyres already on the chosen wall and place the
      // new pump at that gap's midpoint — independently per axis.
      const onWall = prev.filter((p) => p.side === side);
      const gapMid = (vals: number[]) => {
        if (vals.length === 0) return 0.5;
        const sorted = [...vals].sort((a, b) => a - b);
        const gaps: { mid: number; size: number }[] = [];
        gaps.push({ mid: sorted[0] / 2, size: sorted[0] });
        for (let i = 0; i < sorted.length - 1; i++)
          gaps.push({ mid: (sorted[i] + sorted[i + 1]) / 2, size: sorted[i + 1] - sorted[i] });
        gaps.push({
          mid: (sorted[sorted.length - 1] + 1) / 2,
          size: 1 - sorted[sorted.length - 1],
        });
        // biggest gap; tie-break toward the middle of the tank
        gaps.sort((a, b) => b.size - a.size || Math.abs(a.mid - 0.5) - Math.abs(b.mid - 0.5));
        return Math.max(0.05, Math.min(0.95, Math.round(gaps[0].mid * 100) / 100));
      };
      const heights = onWall.map((p) => p.height);
      const depths = onWall.map((p) => p.depth);
      return [
        ...prev,
        {
          id: `p${Date.now()}`,
          pumpModelId: pumpForLitres(litres).id,
          side,
          height: gapMid(heights),
          depth: gapMid(depths),
          controllerId: controllerId ?? controllers[0]?.id ?? "c1",
          cages: defaultCages(side),
        },
      ];
    });
  const removePump = (id: string) =>
    setPumps((prev) => (prev.length <= 1 ? prev : prev.filter((p) => p.id !== id)));
  const updatePump = (
    id: string,
    patch: GyrePatch & Partial<Pick<PumpConfig, "height" | "depth" | "controllerId">>,
  ) => setPumps((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const reorderGyres = (pumpId: string, targetId: string) =>
    setPumps((prev) => {
      const from = prev.findIndex((p) => p.id === pumpId);
      const to = prev.findIndex((p) => p.id === targetId);
      if (from < 0 || to < 0 || from === to) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });

  const stateRef = useRef<SimState>({
    length,
    width,
    height,
    pumps,
    controllers,
    viewMode,
    trails,
    rockwork,
    rockworkStyle,
    substrate,
    dragId: null,
  });

  const { dragId, hoverId, isDragging, onPointerDown, onPointerMove, onPointerUp, onPointerLeave } =
    usePumpDrag({
    stateRef,
    updatePump,
    canvasRef,
    onTap: (id) => setEditingPumpId(id),
  });

  const editingPump = editingPumpId ? (pumps.find((p) => p.id === editingPumpId) ?? null) : null;

  useEffect(() => {
    stateRef.current = {
      length,
      width,
      height,
      pumps,
      controllers,
      viewMode,
      trails,
      rockwork,
      rockworkStyle,
      substrate,
      dragId,
      hoverId,
    };
  }, [
    length,
    width,
    height,
    pumps,
    controllers,
    viewMode,
    trails,
    rockwork,
    rockworkStyle,
    substrate,
    dragId,
    hoverId,
  ]);

  // ---- Floating 3D preview: show ONLY while actively dragging a gyre. ----

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const render = (t: number) => {
      const rect = canvas.getBoundingClientRect();
      // Slow the pattern clock (relay, pulse, surface) with the particle motion.
      renderFrame(ctx, rect.width, rect.height, t * 0.4, stateRef.current, particlesRef.current);
      animRef.current = requestAnimationFrame(render);
    };
    animRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const modes: { id: FlowMode; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: "gyre",
      label: "Continuous Gyre",
      icon: <RotateCw className="w-3.5 h-3.5" />,
      desc: "Cross-flow circulation",
    },
    {
      id: "alternate",
      label: "Alternating",
      icon: <ArrowLeftRight className="w-3.5 h-3.5" />,
      desc: "Reversing back & forth",
    },
    {
      id: "relay",
      label: "Relay",
      icon: <ArrowLeftRight className="w-3.5 h-3.5" />,
      desc: "One eases off as the next comes on",
    },
    {
      id: "pulse",
      label: "Pulse / Surge",
      icon: <Activity className="w-3.5 h-3.5" />,
      desc: "Rhythmic surges",
    },
    {
      id: "turbulent",
      label: "Turbulent",
      icon: <Zap className="w-3.5 h-3.5" />,
      desc: "Random chaotic flow",
    },
  ];

  const turnoverNote =
    turnover < 20
      ? "Below reef target (20×)"
      : turnover > 40
        ? "High-flow setup (40×+)"
        : "Ideal reef range (20–40×)";

  return (
    <section
      id="flow-simulator"
      className="py-20 bg-slate-950 text-white border-b border-blue-900/30"
    >
      <div className="absolute top-1/3 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        {/* Heading */}
        <div className="flex items-center justify-between gap-4 w-full flex-wrap">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Tank Flow <span className="text-cyan-400">Simulator</span>
          </h2>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              onClick={restartWizard}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-cyan-300 bg-cyan-500/10 border border-cyan-400/30 hover:bg-cyan-500/20 hover:text-cyan-200 transition-colors shrink-0"
            >
              <Wand2 className="w-3.5 h-3.5" /> Restart
            </button>
            <TankPurchaseShare
              controllers={controllers}
              pumps={pumps}
              length={length}
              width={width}
              height={height}
              livestock={livestock}
              rockwork={rockwork}
              substrate={substrate}
              glass={glass}
            />
          </div>
        </div>

        <div className="space-y-5">
          {/* Visualization */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
            {/* Setup buttons + view/trails controls arranged in a responsive 2-row / 1-row flow */}
            <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between lg:gap-3">
              <TankSetupButtons
                length={length}
                width={width}
                height={height}
                layout={layout}
                livestock={livestock}
                rockwork={rockwork}
                rockworkStyle={rockworkStyle}
                substrate={substrate}
                glass={glass}
                pumps={pumps}
                controllers={controllers}
                setLength={setLength}
                setWidth={setWidth}
                setHeight={setHeight}
                setLayout={setLayout}
                setLivestock={setLivestock}
                setRockwork={setRockwork}
                setRockworkStyle={setRockworkStyle}
                setSubstrate={setSubstrate}
                setGlass={setGlass}
              />
              <div className="flex items-center gap-1.5 lg:gap-1.5 shrink-0">
                <div className="inline-flex rounded-lg bg-slate-950/70 border border-slate-800 p-0.5">
                  <button
                    onClick={() => setViewMode("top")}
                    className={`px-2 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                      viewMode === "top"
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Top View
                  </button>
                  <button
                    onClick={() => setViewMode("side")}
                    className={`px-2 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                      viewMode === "side"
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Side View
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="hidden xl:inline text-[10px] text-slate-500 uppercase tracking-wider mr-0.5">
                    Trails
                  </span>
                  <Select value={trails} onValueChange={(v) => setTrails(v as TrailMode)}>
                    <SelectTrigger className="h-8 w-[96px] xl:w-[130px] text-xs bg-slate-900/60 border-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-56 bg-slate-900 border-slate-800">
                      {(
                        [
                          { id: "none", label: "Basic" },
                          { id: "light", label: "Enhanced" },
                          { id: "heavy", label: "Long" },
                        ] as { id: TrailMode; label: string }[]
                      ).map((opt) => (
                        <SelectItem key={opt.id} value={opt.id} className="text-xs">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const rec = recommendGyreConfig(litres, livestock, rockwork, substrate);
                      setControllers(rec.controllers);
                      setPumps(rec.pumps);
                    }}
                    className="inline-flex items-center h-8 px-2.5 xl:px-3 rounded-lg text-xs font-semibold text-cyan-300 bg-cyan-500/10 border border-cyan-400/30 hover:bg-cyan-500/20 hover:text-cyan-200 transition-colors whitespace-nowrap"
                  >
                    <span className="xl:hidden">Recommended</span>
                    <span className="hidden xl:inline">Set to Recommended</span>
                  </button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        aria-label="How the recommended setup is chosen"
                        className="text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        <HelpCircle className="w-5 h-5" />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-200">
                      <DialogHeader>
                        <DialogTitle className="text-cyan-300">Recommended setup</DialogTitle>
                      </DialogHeader>
                      <ul className="space-y-2.5 text-sm text-slate-300 list-disc pl-5">
                        <li>
                          <span className="text-white font-medium">Livestock</span> sets the turnover
                          target and the flow pattern. Soft corals use a gentler alternating flow.
                          SPS uses stronger turbulent flow. Other tanks use a continuous gyre.
                        </li>
                        <li>
                          <span className="text-white font-medium">Rock</span> adds flow on top of
                          that. Open rock adds none. Moderate adds a little, and dense rock adds
                          more, because the structure blocks the current.
                        </li>
                        <li>
                          <span className="text-white font-medium">Sand</span> sets how high the
                          gyres sit. Fine sand keeps them further off the bed than a bare bottom, so
                          the flow does not blow the substrate around.
                        </li>
                        <li>
                          The pump is the smallest current Gyre rated for this volume. The number of
                          gyres and the controller speed are chosen so the combined output meets that
                          turnover. More than four gyres adds a second controller.
                        </li>
                        <li>
                          <span className="text-white font-medium">Set to Recommended</span> replaces
                          the gyres and controllers on the tank. You can still move and edit them
                          afterwards.
                        </li>
                      </ul>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>

            <div className="relative w-full aspect-[16/9] rounded-xl bg-slate-950 overflow-hidden border border-slate-800 touch-none">
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerLeave}
              />
              <PumpHoverHint
                hoverId={dragId ? null : hoverId}
                pumps={pumps}
                controllers={controllers}
                viewMode={viewMode}
                length={length}
                width={width}
                height={height}
                canvasRef={canvasRef}
              />

              {/* Top row: measurements (left) + volume (right) */}
              <div className="absolute top-2.5 left-3 text-xs text-cyan-200 font-mono pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                {viewMode === "top"
                  ? `${length}cm × ${width}cm (top view)`
                  : `${length}cm × ${height}cm (side view)`}
              </div>
              <div className="absolute top-2.5 right-3 text-xs text-cyan-200 font-mono pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                {actualFlow.toLocaleString()} L/h total
              </div>

              {/* 3D isometric preview — bottom-left corner, shown only while
                  actively dragging a gyre. */}
              {isDragging && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-auto animate-in fade-in zoom-in-95 duration-150">
                  <TankIsometric
                    length={length}
                    width={width}
                    height={height}
                    layout={layout}
                    pumps={pumps}
                    controllers={controllers}
                    className="w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] md:w-[380px] md:h-[380px] max-w-[380px] max-h-[380px] cursor-grab active:cursor-grabbing touch-none select-none"
                    showHint={false}
                  />
                </div>
              )}
            </div>
          </div>

          <WiringDiagram
            pumps={pumps}
            controllers={controllers}
            modes={modes}
            onReassign={(pumpId, controllerId) => updatePump(pumpId, { controllerId })}
            onReorderGyres={reorderGyres}
            onAddController={addController}
            onRemoveController={removeController}
            onAddGyre={addPumpWithSide}
            onRemoveGyre={removePump}
            onUpdateGyre={(id, patch) => updatePump(id, patch)}
            onUpdateController={updateController}
          />

          <GyreEditor
            open={!!editingPump}
            editingPump={editingPump}
            controllers={controllers}
            onUpdateGyre={(id, patch) => updatePump(id, patch)}
            onClose={() => setEditingPumpId(null)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <RecCard
              label="Controllers"
              value={`${controllers.length}`}
              sub={`${pumps.length} gyres attached total`}
            />
            <RecCard
              label="Total Output"
              value={`${actualFlow.toLocaleString()} L/h`}
              sub="Combined across all controllers"
            />
            <RecCard
              label="Turnover Rate"
              value={`${turnover.toFixed(1)}×/hr`}
              sub={turnoverNote}
            />
          </div>
        </div>
      </div>

      {wizardOpen && (
        <TankSetupWizard
          length={length}
          width={width}
          height={height}
          layout={layout}
          livestock={livestock}
          rockwork={rockwork}
          rockworkStyle={rockworkStyle}
          substrate={substrate}
          glass={glass}
          setLength={setLength}
          setWidth={setWidth}
          setHeight={setHeight}
          setLayout={setLayout}
          setLivestock={setLivestock}
          setRockwork={setRockwork}
          setRockworkStyle={setRockworkStyle}
          setSubstrate={setSubstrate}
          setGlass={setGlass}
          setControllers={setControllers}
          setPumps={setPumps}
          onDismiss={() => setWizardOpen(false)}
        />
      )}
    </section>
  );
}

const FLOW_NAMES: Record<FlowMode, string> = {
  gyre: "Continuous Gyre",
  alternate: "Alternating",
  relay: "Relay",
  pulse: "Pulse / Surge",
  turbulent: "Turbulent",
};

function PumpHoverHint({
  hoverId,
  pumps,
  controllers,
  viewMode,
  length,
  width,
  height,
  canvasRef,
}: {
  hoverId: string | null;
  pumps: PumpConfig[];
  controllers: ControllerConfig[];
  viewMode: ViewMode;
  length: number;
  width: number;
  height: number;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}) {
  if (!hoverId) return null;
  const pump = pumps.find((p) => p.id === hoverId);
  const canvas = canvasRef.current;
  const model = pump ? PUMP_MODELS.find((m) => m.id === pump.pumpModelId) : undefined;
  if (!pump || !canvas || !model) return null;

  const rect = canvas.getBoundingClientRect();
  const { offX, offY, tankW, tankH } = tankRect(rect.width, rect.height, {
    length,
    width,
    height,
    viewMode,
  });
  const { px, py } = pumpPixel(pump, viewMode, offX, offY, tankW, tankH);
  const controller = controllers.find((c) => c.id === pump.controllerId);
  const placeRight = pump.side === "left";
  const pos = Math.round((viewMode === "side" ? pump.height : pump.depth) * 100);
  const output = controller ? Math.round(model.flow * (controller.speed / 100)) : model.flow;
  const top = Math.max(48, Math.min(py, rect.height - 48));

  return (
    <div
      className="absolute z-20 pointer-events-none w-[220px] rounded-lg border border-cyan-400/45 bg-slate-950/95 px-3 py-2"
      style={{
        left: placeRight ? px + 28 : px - 28,
        top,
        transform: placeRight ? "translate(0, -50%)" : "translate(-100%, -50%)",
      }}
    >
      <span
        aria-hidden
        className="absolute w-0 h-0"
        style={{
          top: `calc(50% + ${py - top}px)`,
          transform: "translateY(-50%)",
          ...(placeRight
            ? {
                left: -7,
                borderTop: "5px solid transparent",
                borderBottom: "5px solid transparent",
                borderRight: "7px solid rgba(34,211,238,0.85)",
              }
            : {
                right: -7,
                borderTop: "5px solid transparent",
                borderBottom: "5px solid transparent",
                borderLeft: "7px solid rgba(34,211,238,0.85)",
              }),
        }}
      />
      <div className="text-xs font-bold text-white">{model.name}</div>
      <div className="mt-1 text-[11px] text-slate-300 leading-snug">
        {pump.side === "left" ? "Left" : "Right"} wall · {pos}%{" "}
        {viewMode === "side" ? "from the top" : "front to back"}
      </div>
      <div className="text-[11px] text-slate-400 leading-snug">
        {output.toLocaleString()} L/h
        {controller
          ? ` · ${controller.name} · ${controller.speed}% · ${FLOW_NAMES[controller.flowMode]}`
          : ""}
      </div>
      {model.directors && pump.cages && (
        <div className="text-[11px] text-slate-400 leading-snug">
          {pump.cages
            .map((cage, i) => `Cage ${i + 1} ${cage.axis === "vertical" ? "up/down" : "left/right"}`)
            .join(" · ")}
        </div>
      )}
    </div>
  );
}
