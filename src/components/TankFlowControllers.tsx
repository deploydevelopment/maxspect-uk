import React from "react";
import { Cpu, X, Plus } from "lucide-react";
import {
  type FlowMode,
  type PumpConfig,
  type ControllerConfig,
  PUMP_MODELS,
  controllerColor,
} from "@/lib/tank-flow-helpers";
import { Slider } from "./TankFlowBits";

export interface ControllersPanelProps {
  controllers: ControllerConfig[];
  pumps: PumpConfig[];
  modes: { id: FlowMode; label: string; icon: React.ReactNode; desc: string }[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<ControllerConfig>) => void;
}

export function ControllersPanel({
  controllers,
  pumps,
  modes,
  onAdd,
  onRemove,
  onUpdate,
}: ControllersPanelProps) {
  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-wider">
          <Cpu className="w-4 h-4" /> Controllers
        </div>
        <button
          onClick={onAdd}
          disabled={controllers.length >= 8}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-3 h-3" /> Add Controller
        </button>
      </div>

      <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
        {controllers.map((c) => {
          const color = controllerColor(c.id, controllers);
          const attached = pumps.filter((p) => p.controllerId === c.id);
          const cFlow = Math.round(
            attached.reduce((sum, p) => {
              const m = PUMP_MODELS.find((mm) => mm.id === p.pumpModelId) ?? PUMP_MODELS[0];
              return sum + m.flow * (c.speed / 100);
            }, 0),
          );
          return (
            <div
              key={c.id}
              className="rounded-lg bg-slate-950/60 border p-3 space-y-3"
              style={{ borderColor: `${color}40` }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="inline-block w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <input
                    value={c.name}
                    onChange={(e) => onUpdate(c.id, { name: e.target.value })}
                    className="bg-transparent text-[11px] font-semibold text-slate-200 outline-none focus:bg-slate-900/80 rounded px-1 py-0.5 min-w-0 flex-1"
                  />
                </div>
                <button
                  onClick={() => onRemove(c.id)}
                  disabled={controllers.length <= 1 || attached.length > 0}
                  title={
                    attached.length > 0
                      ? "Detach all gyres before deleting"
                      : controllers.length <= 1
                        ? "At least one controller required"
                        : "Delete controller"
                  }
                  className="text-slate-500 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* speed */}
              <Slider
                label="Controller Speed"
                value={c.speed}
                min={10}
                max={100}
                unit="%"
                onChange={(v) => onUpdate(c.id, { speed: v })}
                accentColor={color}
              />

              {/* flow pattern */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                  Flow Pattern
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {modes.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => onUpdate(c.id, { flowMode: m.id })}
                      className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all border ${
                        c.flowMode === m.id
                          ? "bg-slate-800/80 text-white"
                          : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                      }`}
                      style={c.flowMode === m.id ? { borderColor: `${color}80` } : undefined}
                    >
                      {m.icon}
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800">
                <span className="text-slate-500">
                  {attached.length} gyre{attached.length === 1 ? "" : "s"} attached
                </span>
                <span className="font-mono font-bold" style={{ color }}>
                  {cFlow.toLocaleString()} L/h
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
