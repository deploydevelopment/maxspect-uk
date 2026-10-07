/* ------------------------------------------------------------------ */
/*  Tank setup buttons — popovers for livestock, rockwork, substrate,  */
/*  glass, and the combined tank setup/dimensions button.              */
/* ------------------------------------------------------------------ */

import { useState, useEffect } from "react";
import type React from "react";
import { X, Fish, Mountain, Stone, MirrorRectangular } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TankDimensionsButton } from "./TankDimensionsButton";
import { TANK_PRESETS } from "@/lib/tank-presets";
import {
  ROCKWORK_OPTIONS,
  ROCKWORK_STYLE_OPTIONS,
  SUBSTRATE_OPTIONS,
  GLASS_OPTIONS,
} from "@/lib/tank-wizard";
import { litresFromCm } from "@/lib/tank-flow-helpers";
import type { ControllerConfig, PumpConfig } from "@/lib/tank-flow-helpers";

const LIVESTOCK_OPTIONS = [
  { id: "freshwater", label: "Freshwater", desc: "Community fish & planted tanks" },
  { id: "marine-fish", label: "Marine fish only", desc: "Fish-only saltwater (FOWLR)" },
  { id: "soft", label: "Soft corals", desc: "Low-to-moderate flow corals" },
  { id: "lps", label: "Mainly LPS", desc: "Larger polyp stony corals" },
  { id: "mixed", label: "Mixed reef", desc: "Balanced LPS & SPS mix" },
  { id: "sps", label: "Mainly SPS", desc: "High-flow small polyp stony corals" },
] as const;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

interface SetupButtonsProps {
  length: number;
  width: number;
  height: number;
  layout: string;
  livestock: string;
  rockwork: string;
  rockworkStyle: string;
  substrate: string;
  glass: string;
  pumps: PumpConfig[];
  controllers: ControllerConfig[];
  setLength: (v: number) => void;
  setWidth: (v: number) => void;
  setHeight: (v: number) => void;
  setLayout: (v: string) => void;
  setLivestock: (v: string) => void;
  setRockwork: (v: string) => void;
  setRockworkStyle: (v: string) => void;
  setSubstrate: (v: string) => void;
  setGlass: (v: string) => void;
}

export function TankSetupButtons({
  length,
  width,
  height,
  layout,
  livestock,
  rockwork,
  rockworkStyle,
  substrate,
  glass,
  pumps,
  controllers,
  setLength,
  setWidth,
  setHeight,
  setLayout,
  setLivestock,
  setRockwork,
  setRockworkStyle,
  setSubstrate,
  setGlass,
}: SetupButtonsProps) {
  const litres = litresFromCm(length, width, height);
  const activePreset = TANK_PRESETS.find(
    (p) => p.length === length && p.width === width && p.height === height,
  );

  return (
    <div className="flex items-center gap-1.5 flex-wrap lg:flex-nowrap lg:min-w-0 lg:gap-1 lg:[&_button]:px-1.5 lg:[&_button]:text-[11px]">
      {/* Dimensions button */}
      <TankDimensionsButton
        length={length}
        width={width}
        height={height}
        layout={layout}
        litres={litres}
        pumps={pumps}
        controllers={controllers}
        setLength={setLength}
        setWidth={setWidth}
        setHeight={setHeight}
        setLayout={setLayout}
        setGlass={setGlass}
        activePreset={activePreset}
      />

      {/* Livestock */}
      <SetupPopover
        icon={<Fish className="w-4 h-4" />}
        btnClass="bg-emerald-500/15 border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/25 hover:border-emerald-400/60"
        label={livestock}
        titleIcon={<Fish className="w-3.5 h-3.5" />}
        titleColor="text-emerald-300"
        title="Livestock"
        description="What will you keep? This tunes the recommended flow rate."
        options={LIVESTOCK_OPTIONS}
        value={livestock}
        onSelect={setLivestock}
        activeClass="bg-emerald-500/15 border-emerald-400/50 text-emerald-200"
      />

      {/* Rockwork */}
      <SetupPopover
        icon={<Mountain className="w-4 h-4" />}
        btnClass="bg-rose-500/15 border-rose-400/40 text-rose-300 hover:bg-rose-500/25 hover:border-rose-400/60"
        label={rockwork}
        titleIcon={<Mountain className="w-3.5 h-3.5" />}
        titleColor="text-rose-300"
        title="Rockwork"
        description="Pick a bommie layout style, then set how dense the rockwork is."
        options={ROCKWORK_OPTIONS.map((o) => ({ id: o.id, label: o.label, desc: o.desc }))}
        value={rockwork}
        onSelect={setRockwork}
        activeClass="bg-rose-500/15 border-rose-400/50 text-rose-200"
        headerExtra={
          <div className="space-y-1.5">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Bommie layout</div>
            <div className="grid grid-cols-3 gap-1.5">
              {ROCKWORK_STYLE_OPTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setRockworkStyle(s.label)}
                  title={s.desc}
                  className={`px-2 py-1.5 rounded-md border text-[10px] font-semibold transition-colors ${
                    rockworkStyle === s.label
                      ? "bg-rose-500/20 border-rose-400/50 text-rose-200"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {/* Substrate */}
      <SetupPopover
        icon={<Stone className="w-4 h-4" />}
        btnClass="bg-yellow-500/15 border-yellow-400/40 text-yellow-300 hover:bg-yellow-500/25 hover:border-yellow-400/60"
        label={substrate}
        titleIcon={<Stone className="w-3.5 h-3.5" />}
        titleColor="text-yellow-300"
        title="Substrate"
        description="Substrate affects how low pumps can sit without stirring sand."
        options={SUBSTRATE_OPTIONS.map((o) => ({ id: o.id, label: o.label, desc: o.desc }))}
        value={substrate}
        onSelect={setSubstrate}
        activeClass="bg-yellow-500/15 border-yellow-400/50 text-yellow-200"
      />

      {/* Glass */}
      <SetupPopover
        icon={<MirrorRectangular className="w-4 h-4" />}
        btnClass="bg-indigo-500/15 border-indigo-400/40 text-indigo-300 hover:bg-indigo-500/25 hover:border-indigo-400/60"
        label={`${glass} Glass`}
        titleIcon={<MirrorRectangular className="w-3.5 h-3.5" />}
        titleColor="text-indigo-300"
        title="Glass Thickness"
        description="Glass or acrylic thickness — affects magnet-coupler fit."
        options={GLASS_OPTIONS.map((o) => ({ id: o.label, label: o.label }))}
        value={glass}
        onSelect={setGlass}
        activeClass="bg-indigo-500/15 border-indigo-400/50 text-indigo-200"
        columns={3}
      />
    </div>
  );
}

/* ---- Generic setup popover for livestock / rockwork / substrate / glass ---- */

function SetupPopover({
  icon,
  btnClass,
  label,
  titleIcon,
  titleColor,
  title,
  description,
  options,
  value,
  onSelect,
  activeClass,
  columns,
  headerExtra,
}: {
  icon: React.ReactNode;
  btnClass: string;
  label: string;
  titleIcon: React.ReactNode;
  titleColor: string;
  title: string;
  description: string;
  options: readonly { id: string; label: string; desc?: string }[];
  value: string;
  onSelect: (v: string) => void;
  activeClass: string;
  columns?: number;
  headerExtra?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const bodyContent = (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div
          className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${titleColor}`}
        >
          {titleIcon} {title}
        </div>
        <button
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-[11px] text-slate-400 -mt-1">{description}</p>
      {headerExtra}
      {columns === 3 ? (
        <div className="grid grid-cols-3 gap-2">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                onSelect(opt.label);
                setOpen(false);
              }}
              className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                value === opt.label
                  ? activeClass
                  : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-1.5">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                onSelect(opt.label);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                value === opt.label
                  ? activeClass
                  : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
              }`}
            >
              <div className="text-xs font-semibold">{opt.label}</div>
              {opt.desc && <div className="text-[10px] text-slate-500">{opt.desc}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      {isMobile ? (
        <>
          <button
            onClick={() => setOpen(true)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap ${btnClass}`}
          >
            <span className="shrink-0">{icon}</span>
            {label}
          </button>
          {open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
                onClick={() => setOpen(false)}
                aria-hidden
              />
              <div
                role="dialog"
                aria-modal="true"
                className="relative z-10 w-full max-w-sm max-h-[85vh] overflow-y-auto bg-slate-950 border border-slate-800 p-4 rounded-xl shadow-2xl"
              >
                {bodyContent}
              </div>
            </div>
          )}
        </>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap ${btnClass}`}
            >
              <span className="shrink-0">{icon}</span>
              {label}
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            side="bottom"
            sideOffset={8}
            collisionPadding={16}
            avoidCollisions={true}
            className="!w-80 max-w-[calc(100vw-2rem)] max-h-[85vh] overflow-y-auto bg-slate-950 border-slate-800 p-4 z-50 rounded-xl shadow-2xl"
          >
            {bodyContent}
          </PopoverContent>
        </Popover>
      )}
    </>
  );
}
