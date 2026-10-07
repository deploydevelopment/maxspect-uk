import { Settings2, X, Plus, Link2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type PumpConfig,
  type ControllerConfig,
  type ViewMode,
  controllerColor,
} from "@/lib/tank-flow-helpers";

export interface GyrePlacementPanelProps {
  pumps: PumpConfig[];
  controllers: ControllerConfig[];
  viewMode: ViewMode;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (
    id: string,
    patch: Partial<Pick<PumpConfig, "side" | "height" | "depth" | "controllerId">>,
  ) => void;
}

export function GyrePlacementPanel({
  pumps,
  controllers,
  viewMode,
  onAdd,
  onRemove,
  onUpdate,
}: GyrePlacementPanelProps) {
  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-wider">
          <Settings2 className="w-4 h-4" /> Gyre Placement
        </div>
        <button
          onClick={onAdd}
          disabled={pumps.length >= 8}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-3 h-3" /> Add Gyre
        </button>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {pumps.map((p, i) => {
          const color = controllerColor(p.controllerId, controllers);
          const depthOffset = Math.round((p.depth - 0.5) * 200);
          const heightPct = Math.round(p.height * 100);
          const centerPos = 50 + depthOffset / 2;
          const sMin = viewMode === "top" ? -100 : 5;
          const sMax = viewMode === "top" ? 100 : 95;
          const notches = viewMode === "top" ? [-33.33, 0, 33.33] : [33.33, 50, 66.67];
          const snapTo = (raw: number) => {
            let best = raw;
            let bestDist = Infinity;
            for (const n of notches) {
              const d = Math.abs(raw - n);
              if (d < bestDist) {
                bestDist = d;
                best = n;
              }
            }
            return bestDist <= 4 ? Math.round(best) : raw;
          };
          return (
            <div
              key={p.id}
              className="rounded-lg bg-slate-950/60 border p-2.5 space-y-2"
              style={{ borderColor: `${color}40` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[11px] font-semibold text-slate-300">Gyre {i + 1}</span>
                </div>
                <button
                  onClick={() => onRemove(p.id)}
                  disabled={pumps.length <= 1}
                  className="text-slate-500 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {/* controller assignment */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 w-12 flex items-center gap-1">
                  <Link2 className="w-2.5 h-2.5" /> Ctrl
                </span>
                <div className="relative flex-1">
                  <Select
                    value={p.controllerId}
                    onValueChange={(v) => onUpdate(p.id, { controllerId: v })}
                  >
                    <SelectTrigger className="w-full bg-slate-950/70 border-slate-800 text-white text-[10px] h-7 hover:border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      {controllers.map((cc) => (
                        <SelectItem
                          key={cc.id}
                          value={cc.id}
                          className="text-slate-200 text-[10px] focus:bg-cyan-500/15 focus:text-white"
                        >
                          <span className="flex items-center gap-1.5">
                            <span
                              className="inline-block w-2 h-2 rounded-full"
                              style={{
                                backgroundColor: controllerColor(cc.id, controllers),
                              }}
                            />
                            {cc.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 w-12">Wall</span>
                <div className="inline-flex rounded-md bg-slate-950/70 border border-slate-800 p-0.5 flex-1">
                  {(["left", "right"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => onUpdate(p.id, { side: s })}
                      className={`flex-1 px-2 py-1 rounded text-[10px] font-semibold capitalize transition-all ${
                        p.side === s ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                      }`}
                      style={p.side === s ? { backgroundColor: `${color}30` } : undefined}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 w-12">
                  {viewMode === "top" ? "Center" : "Height"}
                </span>
                <div className="relative flex-1">
                  <input
                    type="range"
                    min={sMin}
                    max={sMax}
                    value={viewMode === "top" ? depthOffset : heightPct}
                    onChange={(e) => {
                      const raw = snapTo(Number(e.target.value));
                      if (viewMode === "top") {
                        onUpdate(p.id, { depth: 0.5 + raw / 200 });
                      } else {
                        onUpdate(p.id, { height: raw / 100 });
                      }
                    }}
                    className="range-circle relative z-30 w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-800"
                    style={
                      viewMode === "top"
                        ? {
                            background: `linear-gradient(to right, rgb(30 41 59) 0%, rgb(30 41 59) ${Math.min(50, centerPos)}%, ${color} ${Math.min(50, centerPos)}%, ${color} ${Math.max(50, centerPos)}%, rgb(30 41 59) ${Math.max(50, centerPos)}%)`,
                          }
                        : {
                            background: `linear-gradient(to right, ${color} ${heightPct}%, rgb(30 41 59) ${heightPct}%)`,
                          }
                    }
                  />
                  <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 z-10">
                    {notches.map((n) => {
                      const pct = ((n - sMin) / (sMax - sMin)) * 100;
                      const isCenter = viewMode === "top" ? n === 0 : n === 50;
                      return (
                        <span
                          key={n}
                          className="absolute top-1/2 -translate-y-1/2 w-px h-2.5"
                          style={{
                            left: `${pct}%`,
                            backgroundColor: isCenter ? color : "rgb(30 41 59)",
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
                <span className="text-[10px] font-mono w-8 text-right" style={{ color }}>
                  {viewMode === "top"
                    ? depthOffset === 0
                      ? "0"
                      : depthOffset > 0
                        ? `+${depthOffset}`
                        : `${depthOffset}`
                    : `${heightPct}%`}
                </span>
              </div>
              <div className="text-[9px] text-slate-600 leading-tight">
                {viewMode === "top"
                  ? "Centered on tank depth · − toward front, + toward back"
                  : "Left/right end wall · top 0% → bottom 100%"}
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-[10px] text-slate-500">
        {pumps.length} gyre{pumps.length === 1 ? "" : "s"} placed · max 8
      </div>
    </div>
  );
}
