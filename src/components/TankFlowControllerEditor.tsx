import React from "react";
import type {
  PumpConfig,
  ControllerConfig,
  FlowMode,
  GyrePatch,
  GyreCage,
  DirectorAim,
} from "@/lib/tank-flow-helpers";
import { controllerColor, PUMP_MODELS, FLOW_PRESETS, defaultCages } from "@/lib/tank-flow-helpers";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Slider } from "./TankFlowBits";

/* ------------------------------------------------------------------ */
/*  Gyre editor — per-gyre pump model + mounting wall                   */
/*  (Speed & flow pattern live on the controller, edited separately.)  */
/* ------------------------------------------------------------------ */

export interface GyreEditorProps {
  open: boolean;
  editingPump: PumpConfig | null;
  controllers: ControllerConfig[];
  onUpdateGyre?: (id: string, patch: GyrePatch) => void;
  onClose: () => void;
}

export function GyreEditor({
  open,
  editingPump,
  controllers,
  onUpdateGyre,
  onClose,
}: GyreEditorProps) {
  const controller = editingPump
    ? controllers.find((c) => c.id === editingPump.controllerId)
    : null;
  const color = controller ? controllerColor(controller.id, controllers) : "#22d3ee";
  const model = editingPump
    ? (PUMP_MODELS.find((m) => m.id === editingPump.pumpModelId) ?? PUMP_MODELS[0])
    : PUMP_MODELS[0];
  const effFlow = controller ? Math.round(model.flow * (controller.speed / 100)) : model.flow;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            {model.name}
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs">
            Choose the pump model and mounting wall for this gyre. Speed and flow pattern are set on
            its controller.
          </DialogDescription>
        </DialogHeader>

        {editingPump && (
          <div className="space-y-4">
            {/* pump model — per gyre */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500">Pump Model</span>
                <span className="font-mono font-bold" style={{ color }}>
                  {model.flow.toLocaleString()} L/h
                </span>
              </div>
              <Select
                value={editingPump.pumpModelId}
                onValueChange={(v) => {
                  const next = PUMP_MODELS.find((p) => p.id === v);
                  if (next?.directors && !editingPump.cages) {
                    onUpdateGyre?.(editingPump.id, {
                      pumpModelId: v,
                      cages: defaultCages(editingPump.side),
                    });
                    return;
                  }
                  onUpdateGyre?.(editingPump.id, { pumpModelId: v });
                }}
              >
                <SelectTrigger className="w-full bg-slate-950/60 border-slate-800 text-white text-xs h-8 hover:border-slate-700">
                  <SelectValue placeholder="Select a pump" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 max-h-72">
                  {Array.from(new Set(PUMP_MODELS.map((p) => p.series))).map((series) => (
                    <SelectGroup key={series}>
                      <SelectLabel className="text-cyan-400 text-[10px] uppercase tracking-wider">
                        {series === "Cloud Edition" ? series : `${series} Series`}
                      </SelectLabel>
                      {PUMP_MODELS.filter((p) => p.series === series).map((p) => (
                        <SelectItem
                          key={p.id}
                          value={p.id}
                          className="text-slate-200 text-xs focus:bg-cyan-500/15 focus:text-white"
                        >
                          <span className="flex items-center justify-between gap-4 w-full">
                            <span>{p.name}</span>
                            <span className="text-slate-500 font-mono text-[10px]">
                              {p.flow.toLocaleString()} L/h
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* mounting wall */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                Mounting Wall
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {(["left", "right"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      const cages = editingPump.cages ?? defaultCages(editingPump.side);
                      const wasDefault =
                        JSON.stringify(cages) === JSON.stringify(defaultCages(editingPump.side));
                      onUpdateGyre?.(editingPump.id, {
                        side: s,
                        cages: wasDefault ? defaultCages(s) : cages,
                      });
                    }}
                    className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all border capitalize ${
                      editingPump.side === s
                        ? "bg-slate-800/80 text-white"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                    }`}
                    style={editingPump.side === s ? { borderColor: `${color}80` } : undefined}
                  >
                    {s} wall
                  </button>
                ))}
              </div>
            </div>

            {model.directors && (
              <CloudDirectors
                pump={editingPump}
                onChange={(cages) => onUpdateGyre?.(editingPump.id, { cages })}
              />
            )}

            <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800">
              <span className="text-slate-500">Driven by {controller?.name ?? "—"}</span>
              <span className="font-mono font-bold" style={{ color }}>
                {effFlow.toLocaleString()} L/h
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CloudDirectors({
  pump,
  onChange,
}: {
  pump: PumpConfig;
  onChange: (cages: [GyreCage, GyreCage]) => void;
}) {
  const cages = pump.cages ?? defaultCages(pump.side);

  const write = (index: 0 | 1, next: GyreCage) => {
    const copy: [GyreCage, GyreCage] = [
      { axis: cages[0].axis, aims: [...cages[0].aims] as GyreCage["aims"] },
      { axis: cages[1].axis, aims: [...cages[1].aims] as GyreCage["aims"] },
    ];
    copy[index] = next;
    onChange(copy);
  };

  return (
    <div className="space-y-2">
      <div>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Flow directors</span>
        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
          Two cages, four outlets each. Point each outlet left or right, or rotate the cage so they
          point up or down.
        </p>
      </div>
      {cages.map((cage, ci) => (
        <div key={ci} className="rounded-lg border border-slate-800 bg-slate-950/40 p-2 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold text-slate-300">Cage {ci + 1}</span>
            <div className="grid grid-cols-2 gap-1">
              {(
                [
                  ["horizontal", "Left / right"],
                  ["vertical", "Up / down"],
                ] as const
              ).map(([axis, label]) => (
                <button
                  key={axis}
                  type="button"
                  onClick={() => write(ci as 0 | 1, { ...cage, axis })}
                  className={`px-1.5 py-1 rounded-md text-[9px] font-semibold border transition-colors ${
                    cage.axis === axis
                      ? "border-cyan-400/70 text-cyan-200 bg-cyan-500/10"
                      : "border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {cage.aims.map((aim, i) => {
              const next: DirectorAim = aim === 1 ? -1 : 1;
              const label =
                cage.axis === "vertical" ? (aim === 1 ? "Up" : "Down") : aim === 1 ? "Right" : "Left";
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    const aims = [...cage.aims] as GyreCage["aims"];
                    aims[i] = next;
                    write(ci as 0 | 1, { axis: cage.axis, aims });
                  }}
                  className="px-1 py-1.5 rounded-md text-[9px] font-semibold border border-slate-700 text-slate-200 hover:border-cyan-400/60 hover:text-white transition-colors"
                >
                  {i + 1} {label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Controller editor — speed + flow pattern                            */
/*  (Pump model & wall live on each gyre, edited separately.)           */
/* ------------------------------------------------------------------ */

export interface ControllerEditorProps {
  open: boolean;
  editingController: ControllerConfig | null;
  controllers: ControllerConfig[];
  pumps: PumpConfig[];
  modes: { id: FlowMode; label: string; icon: React.ReactNode; desc: string }[];
  onUpdateController?: (id: string, patch: Partial<ControllerConfig>) => void;
  onClose: () => void;
}

export function ControllerEditor({
  open,
  editingController,
  controllers,
  pumps,
  modes,
  onUpdateController,
  onClose,
}: ControllerEditorProps) {
  if (!editingController) return null;
  const color = controllerColor(editingController.id, controllers);
  const attached = pumps.filter((p) => p.controllerId === editingController.id);
  const totalFlow = Math.round(
    attached.reduce((sum, p) => {
      const m = PUMP_MODELS.find((mm) => mm.id === p.pumpModelId) ?? PUMP_MODELS[0];
      return sum + m.flow * (editingController.speed / 100);
    }, 0),
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            {editingController.name}
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs">
            Set the speed and flow pattern for this controller. Changes apply to all gyres attached
            to it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* speed */}
          <Slider
            label="Controller Speed"
            value={editingController.speed}
            min={10}
            max={100}
            unit="%"
            onChange={(v) => onUpdateController?.(editingController.id, { speed: v })}
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
                  onClick={() => onUpdateController?.(editingController.id, { flowMode: m.id })}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all border ${
                    editingController.flowMode === m.id
                      ? "bg-slate-800/80 text-white"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                  }`}
                  style={
                    editingController.flowMode === m.id ? { borderColor: `${color}80` } : undefined
                  }
                >
                  {m.icon}
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Flow presets — tailored to livestock types */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">
              Quick Presets
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {FLOW_PRESETS.map((p) => {
                const active =
                  editingController.flowMode === p.flowMode && editingController.speed === p.speed;
                return (
                  <button
                    key={p.id}
                    onClick={() =>
                      onUpdateController?.(editingController.id, {
                        flowMode: p.flowMode,
                        speed: p.speed,
                      })
                    }
                    className={`flex flex-col items-start gap-0.5 px-2 py-1.5 rounded-lg text-left transition-all border ${
                      active
                        ? "bg-slate-800/80 text-white"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                    }`}
                    style={active ? { borderColor: `${color}80` } : undefined}
                  >
                    <span className="text-[10px] font-semibold leading-tight">{p.label}</span>
                    <span className="text-[9px] text-slate-500 leading-tight">{p.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800">
            <span className="text-slate-500">
              {attached.length} gyre{attached.length === 1 ? "" : "s"} attached
            </span>
            <span className="font-mono font-bold" style={{ color }}>
              {totalFlow.toLocaleString()} L/h
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
