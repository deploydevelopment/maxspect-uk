/* ------------------------------------------------------------------ */
/*  Tank Flow Simulator — small presentational helpers                */
/* ------------------------------------------------------------------ */

export function Slider({
  label,
  value,
  min,
  max,
  unit,
  onChange,
  accentColor,
  notch,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
  accentColor?: string;
  notch?: number;
}) {
  const fill = accentColor ?? "rgb(34 211 238)";
  const track = "rgb(30 41 59)";
  const pct = (v: number) => `${((v - min) / (max - min)) * 100}%`;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="font-mono font-bold" style={{ color: accentColor ?? "#67e8f9" }}>
          {value}
          {unit}
        </span>
      </div>
      <div className="relative flex items-center h-5">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const raw = Number(e.target.value);
            // snap to notch when close (within 4% of range)
            if (notch != null && Math.abs(raw - notch) <= (max - min) * 0.04) {
              onChange(notch);
            } else {
              onChange(raw);
            }
          }}
          className="range-circle w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-800 relative z-20"
          style={{
            background: `linear-gradient(to right, ${fill} ${pct(value)}, ${track} ${pct(value)})`,
          }}
        />
        {notch != null && (
          <div
            className="absolute top-1/2 w-0.5 h-3 bg-slate-500 rounded-full pointer-events-none z-10"
            style={{ left: pct(notch), transform: "translate(-50%, -50%)" }}
          />
        )}
      </div>
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-950/60 border border-slate-800 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-sm font-bold text-white">{value}</div>
    </div>
  );
}

export function RecCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-gradient-to-b from-slate-900/80 to-slate-950/60 border border-cyan-500/20 p-4">
      <div className="text-[10px] uppercase tracking-wider text-cyan-400 font-semibold">
        {label}
      </div>
      <div className="text-lg font-bold text-white mt-1">{value}</div>
      <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>
    </div>
  );
}

export function Legend({ color, label, solid }: { color: string; label: string; solid?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
