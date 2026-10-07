/* ------------------------------------------------------------------ */
/*  Tank dimensions button with modal/popover                          */
/* ------------------------------------------------------------------ */

import { useState, useEffect } from "react";
import { Box, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider, Stat } from "./TankFlowBits";
import { TankIsometric } from "./TankIsometric";
import { presetsByBrand, type TankPreset } from "@/lib/tank-presets";
import { recommendedGlassMm } from "@/lib/tank-wizard";
import type { ControllerConfig, PumpConfig } from "@/lib/tank-flow-helpers";

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

export function TankDimensionsButton({
  length,
  width,
  height,
  layout,
  litres,
  pumps,
  controllers,
  setLength,
  setWidth,
  setHeight,
  setLayout,
  setGlass,
  activePreset,
}: {
  length: number;
  width: number;
  height: number;
  layout: string;
  litres: number;
  pumps: PumpConfig[];
  controllers: ControllerConfig[];
  setLength: (v: number) => void;
  setWidth: (v: number) => void;
  setHeight: (v: number) => void;
  setLayout: (v: string) => void;
  setGlass: (v: string) => void;
  activePreset?: TankPreset;
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [lastPreset, setLastPreset] = useState<TankPreset | null>(activePreset ?? null);
  const [preferCustom, setPreferCustom] = useState(false);

  const exactMatch = preferCustom ? null : (activePreset ?? null);
  const presetLabel = exactMatch
    ? `${exactMatch.brand} ${exactMatch.model} — ${exactMatch.length}×${exactMatch.width}×${exactMatch.height}cm`
    : lastPreset
      ? `${lastPreset.brand} ${lastPreset.model} (custom) — ${length}×${width}×${height}cm`
      : `Custom build or another brand — ${length}×${width}×${height}cm`;

  const content = (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-cyan-300 text-[10px] font-bold uppercase tracking-wider">
          <Box className="w-3.5 h-3.5" /> Tank Setup &amp; Dimensions
        </div>
        <button
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-2">
        <TankIsometric
          length={length}
          width={width}
          height={height}
          layout={layout}
          pumps={pumps}
          controllers={controllers}
        />
      </div>

      <div className="space-y-1.5 pt-1">
        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
          Preset sizes
        </div>
        <Select
          value={exactMatch ? exactMatch.id : "__custom"}
          onValueChange={(val) => {
            if (val === "__custom") {
              setPreferCustom(true);
              setLastPreset(null);
              return;
            }
            setPreferCustom(false);
            const p = presetsByBrand()
              .flatMap((g) => g.presets)
              .find((pp) => pp.id === val);
            if (p) {
              setLength(p.length);
              setWidth(p.width);
              setHeight(p.height);
              if (p.layout) setLayout(p.layout);
              // Auto-set glass thickness based on the preset's water-column height
              const mm = recommendedGlassMm(p.height);
              setGlass(`${mm} mm`);
              setLastPreset(p);
            }
          }}
        >
          <SelectTrigger className="w-full h-9 text-xs bg-slate-900/60 border-slate-800">
            <SelectValue placeholder="Custom dimensions">{presetLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-80">
            <SelectItem value="__custom" className="text-xs">
              Custom build or another brand
            </SelectItem>
            {presetsByBrand().map((group) => (
              <SelectGroup key={group.brand}>
                <SelectLabel className="text-[10px] uppercase tracking-wider">{group.brand}</SelectLabel>
                {group.presets.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    {p.model} — {p.length}×{p.width}×{p.height}cm
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Slider
        label="Length"
        value={length}
        min={30}
        max={300}
        unit="cm"
        onChange={setLength}
        notch={lastPreset?.length}
      />
      <Slider
        label="Width"
        value={width}
        min={25}
        max={90}
        unit="cm"
        onChange={setWidth}
        notch={lastPreset?.width}
      />
      <Slider
        label="Height"
        value={height}
        min={25}
        max={80}
        unit="cm"
        onChange={setHeight}
        notch={lastPreset?.height}
      />

      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
        <Stat label="Tank Volume" value={`${litres} L`} />
        <Stat label="Water Column" value={`${(height * 0.9).toFixed(0)} cm`} />
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile modal with backdrop */}
      {isMobile ? (
        <>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/25 hover:border-cyan-400/60 transition-colors whitespace-nowrap max-w-[14rem] lg:max-w-[max(8rem,calc(100vw-56rem))] xl:max-w-[16rem]"
          >
            <Box className="w-4 h-4 shrink-0" />
            <span className="truncate">
            {exactMatch
              ? `${exactMatch.brand} ${exactMatch.model} · ${litres}L`
              : lastPreset
                ? `${lastPreset.brand} ${lastPreset.model} (custom) · ${litres}L`
                : `${layout} · ${length}×${width}×${height}cm · ${litres}L`}
            </span>
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
                {content}
              </div>
            </div>
          )}
        </>
      ) : (
        /* Tablet & desktop: popover anchored to button with collision avoidance */
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/25 hover:border-cyan-400/60 transition-colors whitespace-nowrap max-w-[14rem] lg:max-w-[max(8rem,calc(100vw-56rem))] xl:max-w-[16rem]">
              <Box className="w-4 h-4 shrink-0" />
              <span className="truncate">
              {exactMatch
                ? `${exactMatch.brand} ${exactMatch.model} · ${litres}L`
                : lastPreset
                  ? `${lastPreset.brand} ${lastPreset.model} (custom) · ${litres}L`
                  : `${layout} · ${length}×${width}×${height}cm · ${litres}L`}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            side="bottom"
            sideOffset={8}
            collisionPadding={16}
            avoidCollisions={true}
            className="!w-80 max-w-[calc(100vw-2rem)] max-h-[85vh] overflow-y-auto bg-slate-950 border-slate-800 p-4 z-50 rounded-xl shadow-2xl"
          >
            {content}
          </PopoverContent>
        </Popover>
      )}
    </>
  );
}
