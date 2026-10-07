/* ------------------------------------------------------------------ */
/*  Tank Setup Wizard — multi-step modal overlaying the simulator.    */
/*  Guides the user through tank / livestock / rockwork / substrate /  */
/*  glass, then applies a recommended gyre + controller config.         */
/* ------------------------------------------------------------------ */

import { useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Box,
  Fish,
  Mountain,
  Stone,
  MirrorRectangular,
  Lightbulb,
  Wand2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TankIsometric } from "./TankIsometric";
import { Slider } from "./TankFlowBits";
import { presetsByBrand, TANK_PRESETS } from "@/lib/tank-presets";
import { litresFromCm, PUMP_MODELS } from "@/lib/tank-flow-helpers";
import {
  LIVESTOCK_OPTIONS,
  ROCKWORK_OPTIONS,
  ROCKWORK_STYLE_OPTIONS,
  SUBSTRATE_OPTIONS,
  GLASS_OPTIONS,
  recommendedGlassMm,
  recommendGyreConfig,
} from "@/lib/tank-wizard";
import type { ControllerConfig, PumpConfig } from "@/lib/tank-flow-helpers";

interface WizardProps {
  length: number;
  width: number;
  height: number;
  layout: string;
  livestock: string;
  rockwork: string;
  rockworkStyle: string;
  substrate: string;
  glass: string;
  setLength: (v: number) => void;
  setWidth: (v: number) => void;
  setHeight: (v: number) => void;
  setLayout: (v: string) => void;
  setLivestock: (v: string) => void;
  setRockwork: (v: string) => void;
  setRockworkStyle: (v: string) => void;
  setSubstrate: (v: string) => void;
  setGlass: (v: string) => void;
  setControllers: (c: ControllerConfig[]) => void;
  setPumps: (p: PumpConfig[]) => void;
  onDismiss: () => void;
}

/* Per-step accent — mirrors the colours used by the setup buttons on the
   page so the wizard feels continuous with the simulator controls. */
type StepAccent = {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string; // tailwind text-* class for the icon + title
  hex: string; // raw colour for the progress bar segment
};

const STEP_ACCENTS: StepAccent[] = [
  {
    id: "tank",
    label: "Tank",
    icon: <Box className="w-4 h-4" />,
    color: "text-cyan-400",
    hex: "#22d3ee",
  },
  {
    id: "livestock",
    label: "Livestock",
    icon: <Fish className="w-4 h-4" />,
    color: "text-emerald-300",
    hex: "#6ee7b7",
  },
  {
    id: "rockwork",
    label: "Rockwork",
    icon: <Mountain className="w-4 h-4" />,
    color: "text-rose-300",
    hex: "#fda4af",
  },
  {
    id: "substrate",
    label: "Substrate",
    icon: <Stone className="w-4 h-4" />,
    color: "text-yellow-300",
    hex: "#fde047",
  },
  {
    id: "glass",
    label: "Glass",
    icon: <MirrorRectangular className="w-4 h-4" />,
    color: "text-indigo-300",
    hex: "#a5b4fc",
  },
  {
    id: "review",
    label: "Review",
    icon: <Lightbulb className="w-4 h-4" />,
    color: "text-cyan-400",
    hex: "#22d3ee",
  },
];

const SELECTED = "bg-cyan-500/15 border-cyan-400/50 text-cyan-200";
const IDLE =
  "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-slate-100";

export function TankSetupWizard(props: WizardProps) {
  const [step, setStep] = useState(0); // 0 = intro
  const total = STEP_ACCENTS.length;
  const isIntro = step === 0;
  const stepIdx = step - 1;
  const current = stepIdx >= 0 ? STEP_ACCENTS[stepIdx] : null;
  const litres = litresFromCm(props.length, props.width, props.height);

  const next = () => setStep((s) => Math.min(s + 1, total));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finish = () => {
    const rec = recommendGyreConfig(litres, props.livestock, props.rockwork);
    props.setControllers(rec.controllers);
    props.setPumps(rec.pumps);
    props.onDismiss();
  };

  // Header icon + colour: intro uses the wand, otherwise the current step's accent.
  const headerIcon = isIntro ? <Wand2 className="w-4 h-4" /> : current?.icon;
  const headerColor = isIntro ? "text-cyan-400" : (current?.color ?? "text-cyan-400");
  const headerLabel = isIntro ? "Tank Setup Wizard" : current?.label;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] animate-in fade-in duration-300" />
      <div className="relative z-10 w-full max-w-lg max-h-[88vh] flex flex-col bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header — single icon, coloured to match the page button */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className={headerColor}>{headerIcon}</span>
            <span className="text-sm font-bold text-white">{headerLabel}</span>
          </div>
          <button
            onClick={props.onDismiss}
            className="text-slate-500 hover:text-white transition-colors"
            aria-label="Skip wizard"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress */}
        {!isIntro && (
          <div className="px-5 py-2.5 border-b border-slate-800/60 flex items-center gap-1.5">
            {STEP_ACCENTS.map((s, i) => (
              <div
                key={s.id}
                className="h-1.5 flex-1 rounded-full transition-colors"
                style={{ backgroundColor: i <= stepIdx ? s.hex : "#1e293b" }}
              />
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {isIntro ? (
            <IntroStep />
          ) : stepIdx === 0 ? (
            <TankStep {...props} litres={litres} />
          ) : stepIdx === 1 ? (
            <LivestockStep {...props} />
          ) : stepIdx === 2 ? (
            <RockworkStep {...props} />
          ) : stepIdx === 3 ? (
            <SubstrateStep {...props} />
          ) : stepIdx === 4 ? (
            <GlassStep {...props} />
          ) : (
            <ReviewStep {...props} litres={litres} />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4">
          {!isIntro ? (
            <button
              onClick={back}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : (
            <span />
          )}
          {isIntro ? (
            <button
              onClick={next}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors"
            >
              Get Started <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : stepIdx < total - 1 ? (
            <button
              onClick={next}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={finish}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors"
            >
              <Check className="w-3.5 h-3.5" /> Apply &amp; Finish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- steps ------------------------------- */

function StepHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{title}</div>
      <p className="text-[11px] text-slate-400">{desc}</p>
    </div>
  );
}

function IntroStep() {
  return (
    <div className="space-y-4 text-center py-2">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center">
        <Wand2 className="w-7 h-7 text-cyan-400" />
      </div>
      <h2 className="text-lg font-bold text-white">Set up your tank in a few steps</h2>
      <p className="text-sm text-slate-400 max-w-sm mx-auto">
        We'll guide you through choosing your tank, livestock, rockwork, substrate and glass. Your
        choices update the simulator live behind this panel — and at the end we'll recommend the
        right Maxspect Gyre pumps and controllers for your setup.
      </p>
      <div className="flex flex-wrap justify-center gap-1.5 pt-1">
        {STEP_ACCENTS.filter((s) => s.id !== "review").map((s) => (
          <span
            key={s.id}
            className="inline-flex items-center gap-1 rounded-md bg-slate-900/60 border border-slate-800 px-2 py-1 text-[10px] font-semibold text-slate-400"
          >
            <span className={s.color}>{s.icon}</span>
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function TankStep(props: WizardProps & { litres: number }) {
  const [preferCustom, setPreferCustom] = useState(false);
  const matched = TANK_PRESETS.find(
    (p) => p.length === props.length && p.width === props.width && p.height === props.height,
  );
  const activePreset = preferCustom ? undefined : matched;
  return (
    <div className="space-y-4">
      <StepHeader
        title="Choose your tank"
        desc="Maxspect, Red Sea, CADE, Nyos, D-D and more — or set your own dimensions."
      />
      <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-2">
        <TankIsometric
          length={props.length}
          width={props.width}
          height={props.height}
          layout={props.layout}
          pumps={[]}
          controllers={[]}
          showHint={false}
        />
      </div>
      <div className="space-y-1.5">
        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
          Preset sizes
        </div>
        <Select
          value={activePreset ? activePreset.id : "__custom"}
          onValueChange={(val) => {
            if (val === "__custom") {
              setPreferCustom(true);
              return;
            }
            setPreferCustom(false);
            const p = TANK_PRESETS.find((pp) => pp.id === val);
            if (p) {
              props.setLength(p.length);
              props.setWidth(p.width);
              props.setHeight(p.height);
              if (p.layout) props.setLayout(p.layout);
              props.setGlass(`${recommendedGlassMm(p.height)} mm`);
            }
          }}
        >
          <SelectTrigger className="w-full h-9 text-xs bg-slate-900/60 border-slate-800">
            <SelectValue placeholder="Custom dimensions">
              {activePreset
                ? `${activePreset.brand} ${activePreset.model}`
                : "Custom build or another brand"}
            </SelectValue>
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
        value={props.length}
        min={30}
        max={300}
        unit="cm"
        onChange={props.setLength}
        notch={activePreset?.length}
      />
      <Slider
        label="Width"
        value={props.width}
        min={25}
        max={90}
        unit="cm"
        onChange={props.setWidth}
        notch={activePreset?.width}
      />
      <Slider
        label="Height"
        value={props.height}
        min={25}
        max={80}
        unit="cm"
        onChange={props.setHeight}
        notch={activePreset?.height}
      />
      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
        <span className="text-slate-500">Volume</span>
        <span className="font-mono font-bold text-cyan-300">{props.litres} L</span>
      </div>
    </div>
  );
}

function LivestockStep(props: WizardProps) {
  return (
    <div className="space-y-4">
      <StepHeader
        title="What livestock?"
        desc="This tunes the recommended flow rate and pattern."
      />
      <div className="space-y-1.5">
        {LIVESTOCK_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => props.setLivestock(opt.label)}
            className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
              props.livestock === opt.label ? SELECTED : IDLE
            }`}
          >
            <div className="text-xs font-semibold">{opt.label}</div>
            <div className="text-[10px] text-slate-500">
              {opt.desc} · {opt.turnover[0]}–{opt.turnover[1]}× turnover
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function RockworkStep(props: WizardProps) {
  return (
    <div className="space-y-4">
      <StepHeader title="Rockwork density" desc="How much rock will fill the tank?" />
      <div className="grid grid-cols-2 gap-2">
        {ROCKWORK_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => props.setRockwork(opt.label)}
            className={`text-left px-3 py-2 rounded-lg border transition-colors ${
              props.rockwork === opt.label ? SELECTED : IDLE
            }`}
          >
            <div className="text-xs font-semibold">{opt.label}</div>
            <div className="text-[10px] text-slate-500">{opt.desc}</div>
          </button>
        ))}
      </div>
      <div className="space-y-1.5 pt-1">
        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
          Bommie layout
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {ROCKWORK_STYLE_OPTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => props.setRockworkStyle(s.label)}
              title={s.desc}
              className={`px-2 py-1.5 rounded-md border text-[10px] font-semibold transition-colors ${
                props.rockworkStyle === s.label
                  ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-200"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SubstrateStep(props: WizardProps) {
  return (
    <div className="space-y-4">
      <StepHeader title="Substrate" desc="Affects how low pumps can sit without stirring sand." />
      <div className="space-y-1.5">
        {SUBSTRATE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => props.setSubstrate(opt.label)}
            className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
              props.substrate === opt.label ? SELECTED : IDLE
            }`}
          >
            <div className="text-xs font-semibold">{opt.label}</div>
            <div className="text-[10px] text-slate-500">{opt.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function GlassStep(props: WizardProps) {
  const rec = recommendedGlassMm(props.height);
  return (
    <div className="space-y-4">
      <StepHeader
        title="Glass thickness"
        desc="Auto-recommended from your tank's water-column height."
      />
      <div className="grid grid-cols-3 gap-2">
        {GLASS_OPTIONS.map((opt) => {
          const isRec = opt.id === rec;
          const isSelected = props.glass === opt.label;
          return (
            <button
              key={opt.id}
              onClick={() => props.setGlass(opt.label)}
              className={`relative px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                isSelected ? SELECTED : IDLE
              }`}
            >
              {opt.label}
              {isRec && (
                <span className="absolute -top-1.5 -right-1.5 text-[8px] bg-cyan-500 text-slate-950 font-bold rounded-full px-1.5 py-0.5">
                  REC
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-slate-500">
        Recommended for your {props.height}cm height:{" "}
        <span className="text-cyan-300 font-semibold">{rec} mm</span>
      </p>
    </div>
  );
}

function ReviewStep(props: WizardProps & { litres: number }) {
  const rec = recommendGyreConfig(props.litres, props.livestock, props.rockwork);
  const model = PUMP_MODELS.find((m) => m.id === rec.pumpModelId) ?? PUMP_MODELS[0];
  return (
    <div className="space-y-4">
      <StepHeader
        title="Your recommended setup"
        desc="Based on your tank and livestock, here's the suggested gyre configuration."
      />
      <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-2">
        <TankIsometric
          length={props.length}
          width={props.width}
          height={props.height}
          layout={props.layout}
          pumps={rec.pumps}
          controllers={rec.controllers}
          showHint={false}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <SummaryCard label="Controllers" value={`${rec.controllers.length}`} />
        <SummaryCard label="Gyre pumps" value={`${rec.pumps.length}`} />
        <SummaryCard label="Pump model" value={model.name} small />
        <SummaryCard label="Total flow" value={`${rec.targetFlow.toLocaleString()} L/h`} />
      </div>
      <div className="rounded-lg bg-cyan-500/5 border border-cyan-400/20 p-3 space-y-1">
        <Row label="Target turnover" value={`${rec.turnover}×/hr`} accent />
        <Row label="Tank volume" value={`${props.litres} L`} />
        <Row label="Livestock" value={props.livestock} />
        <Row label="Rockwork" value={props.rockwork} />
      </div>
      <p className="text-[10px] text-slate-500 text-center">
        Tap "Apply & Finish" to load this into the simulator. You can fine-tune everything
        afterwards.
      </p>
    </div>
  );
}

function SummaryCard({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="rounded-lg bg-slate-900/60 border border-slate-800 px-3 py-2">
      <div className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</div>
      <div className={`${small ? "text-[11px]" : "text-sm"} font-bold text-white`}>{value}</div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between text-[11px]">
      <span className="text-slate-400">{label}</span>
      <span className={accent ? "font-mono font-bold text-cyan-300" : "text-slate-200"}>
        {value}
      </span>
    </div>
  );
}
