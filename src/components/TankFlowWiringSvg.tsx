import React from "react";
import type { PumpConfig, ControllerConfig } from "@/lib/tank-flow-helpers";
import { controllerColor, PUMP_MODELS } from "@/lib/tank-flow-helpers";
import { connectionPath, type WiringLayout } from "@/lib/tank-wiring-layout";

const FLOW_LABELS: Record<string, string> = {
  gyre: "Continuous Gyre",
  alternate: "Alternating",
  relay: "Relay",
  pulse: "Pulse / Surge",
  turbulent: "Turbulent",
};

export interface WiringSvgProps {
  L: WiringLayout;
  pumps: PumpConfig[];
  controllers: ControllerConfig[];
  dragPump: string | null;
  dragMode: "reassign" | "reorder" | null;
  hoverCtrl: string | null;
  reorderTarget: string | null;
  pointer: { x: number; y: number } | null;
  addGyreCtrl: string | null;
  editingGyre: string | null;
  canDrag: boolean;
  onPointerDownGyre: (e: React.PointerEvent, pumpId: string) => void;
  onAddGyre?: (side: "left" | "right", controllerId: string) => void;
  onRemoveController?: (id: string) => void;
  onAddController?: () => void;
  onRemoveGyre?: (id: string) => void;
  setAddGyreCtrl: (v: string | null) => void;
  setEditingController: (v: string | null) => void;
}

export function WiringSvg({
  L,
  pumps,
  controllers,
  dragPump,
  dragMode,
  hoverCtrl,
  reorderTarget,
  pointer,
  addGyreCtrl,
  editingGyre,
  canDrag,
  onPointerDownGyre,
  onAddGyre,
  onRemoveController,
  onAddController,
  onRemoveGyre,
  setAddGyreCtrl,
  setEditingController,
}: WiringSvgProps) {
  const { W, H, ctrlX, ctrlW, pumpX, pumpW, plusGap, ctrlH, pumpH, ctrlY, pumpY, placeholderY } = L;

  return (
    <>
      {/* connections */}
      {pumps.map((p) => {
        const ctrlIdx = controllers.findIndex((c) => c.id === p.controllerId);
        if (ctrlIdx < 0) return null;
        const color = controllerColor(p.controllerId, controllers);
        const isDragging = dragPump === p.id;
        return (
          <path
            key={p.id}
            d={connectionPath(L, p.controllerId, p.id, ctrlIdx)}
            fill="none"
            stroke={color}
            strokeWidth={isDragging ? 3 : 2}
            strokeOpacity={isDragging ? 1 : 0.7}
            strokeDasharray={isDragging ? "6 4" : undefined}
          />
        );
      })}

      {/* controller nodes (drop targets) */}
      {controllers.map((c) => {
        const color = controllerColor(c.id, controllers);
        const y = ctrlY[c.id];
        const attached = pumps.filter((p) => p.controllerId === c.id).length;
        const isHover = hoverCtrl === c.id && dragPump;
        const canRemove = controllers.length > 1 && attached === 0 && !!onRemoveController;
        return (
          <g key={c.id} onClick={() => setEditingController(c.id)} style={{ cursor: "pointer" }}>
            <rect
              x={ctrlX}
              y={y - ctrlH / 2}
              width={ctrlW}
              height={ctrlH}
              rx={8}
              fill={`${color}1a`}
              stroke={color}
              strokeWidth={isHover ? 3 : 1.5}
              strokeDasharray={isHover ? "5 3" : undefined}
            />
            <circle cx={ctrlX + 14} cy={y} r={5} fill={color} />
            <text x={ctrlX + 26} y={y - 8} fill="#ffffff" fontSize={11} fontWeight={700}>
              {c.name}
            </text>
            <text x={ctrlX + 26} y={y + 5} fill="#ffffff" fontSize={8} fontWeight={600}>
              {c.speed}% speed
            </text>
            <text x={ctrlX + 26} y={y + 16} fill="#ffffff" fontSize={8} fontWeight={600}>
              {FLOW_LABELS[c.flowMode]}
            </text>
            {/* + button — add a gyre to THIS controller */}
            {onAddGyre && pumps.length < 8 && (
              <g
                style={{ cursor: "pointer" }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setAddGyreCtrl(addGyreCtrl === c.id ? null : c.id);
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <rect
                  x={ctrlX + ctrlW + plusGap - 12}
                  y={y - 14}
                  width={28}
                  height={28}
                  fill="transparent"
                />
                <circle
                  cx={ctrlX + ctrlW + plusGap}
                  cy={y}
                  r={10}
                  fill="#1e293b"
                  stroke={color}
                  strokeWidth={1}
                  strokeOpacity={0.45}
                />
                <text
                  x={ctrlX + ctrlW + plusGap}
                  y={y - 1}
                  fill={color}
                  fontSize={13}
                  fontWeight={700}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  +
                </text>
              </g>
            )}
            {onRemoveController && (
              <g
                style={{ cursor: canRemove ? "pointer" : "not-allowed" }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  if (canRemove) onRemoveController(c.id);
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <rect
                  x={ctrlX + ctrlW - 30}
                  y={y - ctrlH / 2}
                  width={30}
                  height={ctrlH}
                  fill="transparent"
                />
                <circle
                  cx={ctrlX + ctrlW - 14}
                  cy={y}
                  r={9}
                  fill={canRemove ? "#1e293b" : "#0f172a"}
                  stroke={canRemove ? color : "#334155"}
                  strokeWidth={1}
                  strokeOpacity={0.25}
                  fillOpacity={canRemove ? 1 : 0.4}
                />
                <text
                  x={ctrlX + ctrlW - 14}
                  y={y - 1}
                  fill={canRemove ? "#ffffff" : "#475569"}
                  fontSize={11}
                  fontWeight={700}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  ×
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* dotted "Add Controller" placeholder */}
      {onAddController && (
        <g
          style={{ cursor: controllers.length >= 8 ? "not-allowed" : "pointer" }}
          onPointerDown={(e) => {
            e.stopPropagation();
            setAddGyreCtrl(null);
            if (controllers.length < 8) onAddController();
          }}
        >
          <rect
            x={ctrlX}
            y={placeholderY - ctrlH / 2}
            width={ctrlW}
            height={ctrlH}
            rx={8}
            fill="transparent"
            stroke="#475569"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            strokeOpacity={controllers.length >= 8 ? 0.2 : 0.5}
          />
          <text
            x={ctrlX + ctrlW / 2}
            y={placeholderY}
            fill={controllers.length >= 8 ? "#334155" : "#94a3b8"}
            fontSize={10}
            fontWeight={600}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {controllers.length >= 8 ? "Max 8 controllers" : "+ Add Controller"}
          </text>
        </g>
      )}

      {/* reorder drop indicator */}
      {dragMode === "reorder" && reorderTarget && pointer && (
        <line
          x1={pumpX - 8}
          x2={pumpX + pumpW + 8}
          y1={pumpY[reorderTarget]}
          y2={pumpY[reorderTarget]}
          stroke="#22d3ee"
          strokeWidth={2.5}
          strokeDasharray="5 3"
          pointerEvents="none"
        />
      )}

      {/* gyre nodes */}
      {pumps.map((p) => {
        const color = controllerColor(p.controllerId, controllers);
        const y = pumpY[p.id];
        const isDragging = dragPump === p.id;
        const isEditing = editingGyre === p.id;
        const isReorderTarget = reorderTarget === p.id && dragMode === "reorder";
        const ctrl = controllers.find((c) => c.id === p.controllerId);
        const model = PUMP_MODELS.find((m) => m.id === p.pumpModelId);
        const modelName =
          model && model.name.length > 16
            ? `${model.name.slice(0, 15).trimEnd()}…`
            : (model?.name ?? "");
        const canRemove = pumps.length > 1 && !!onRemoveGyre;
        return (
          <g
            key={p.id}
            onPointerDown={(e) => onPointerDownGyre(e, p.id)}
            style={{
              cursor: canDrag ? "grab" : "pointer",
              opacity: isDragging ? 0.25 : 1,
              transition: "opacity 0.15s ease",
            }}
          >
            <rect
              x={pumpX}
              y={y - pumpH / 2}
              width={pumpW}
              height={pumpH}
              rx={10}
              fill={`${color}1a`}
              stroke={color}
              strokeWidth={isReorderTarget ? 3 : isEditing ? 2.5 : 1.5}
              strokeDasharray={isReorderTarget ? "5 3" : undefined}
            />
            <circle cx={pumpX + 14} cy={y} r={5} fill={color} />
            {model && (
              <text x={pumpX + 26} y={y - 8} fill="#ffffff" fontSize={11} fontWeight={700}>
                {modelName}
              </text>
            )}
            {model && ctrl && (
              <text x={pumpX + 26} y={y + 5} fill="#ffffff" fontSize={8} fontWeight={600}>
                {Math.round(model.flow * (ctrl.speed / 100)).toLocaleString()} L/h
              </text>
            )}
            {ctrl && (
              <text x={pumpX + 26} y={y + 16} fill="#ffffff" fontSize={8} fontWeight={600}>
                {p.side} wall
              </text>
            )}
            {onRemoveGyre && (
              <g
                style={{ cursor: canRemove ? "pointer" : "not-allowed" }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  if (canRemove) onRemoveGyre(p.id);
                }}
              >
                <rect
                  x={pumpX + pumpW - 32}
                  y={y - pumpH / 2}
                  width={32}
                  height={26}
                  fill="transparent"
                />
                <circle
                  cx={pumpX + pumpW - 16}
                  cy={y - pumpH / 2 + 15}
                  r={9}
                  fill={canRemove ? "#1e293b" : "#0f172a"}
                  stroke={canRemove ? color : "#334155"}
                  strokeWidth={1}
                  strokeOpacity={0.25}
                  fillOpacity={canRemove ? 1 : 0.4}
                />
                <text
                  x={pumpX + pumpW - 16}
                  y={y - pumpH / 2 + 14}
                  fill={canRemove ? "#ffffff" : "#475569"}
                  fontSize={11}
                  fontWeight={700}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  ×
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* floating dragged gyre */}
      {dragPump &&
        pointer &&
        (() => {
          const p = pumps.find((pp) => pp.id === dragPump);
          if (!p) return null;
          const color = controllerColor(p.controllerId, controllers);
          const dmodel = PUMP_MODELS.find((m) => m.id === p.pumpModelId);
          const dmodelName =
            dmodel && dmodel.name.length > 16
              ? `${dmodel.name.slice(0, 15).trimEnd()}…`
              : (dmodel?.name ?? "");
          return (
            <g
              pointerEvents="none"
              transform={`translate(${pointer.x} ${pointer.y}) scale(1.12) translate(${-pointer.x} ${-pointer.y})`}
            >
              <rect
                x={pointer.x - pumpW / 2}
                y={pointer.y - 18}
                width={pumpW}
                height={36}
                rx={10}
                fill={`${color}40`}
                stroke={color}
                strokeWidth={2}
              />
              <circle cx={pointer.x - pumpW / 2 + 14} cy={pointer.y} r={5} fill={color} />
              <text
                x={pointer.x - pumpW / 2 + 26}
                y={pointer.y - 2}
                fill="#e2e8f0"
                fontSize={11}
                fontWeight={700}
              >
                {dmodelName || "Gyre"}
              </text>
            </g>
          );
        })()}

      {/* add-gyre side picker */}
      {addGyreCtrl &&
        (() => {
          const c = controllers.find((cc) => cc.id === addGyreCtrl);
          if (!c) return null;
          const y = ctrlY[c.id];
          const color = controllerColor(c.id, controllers);
          const dx = ctrlX + ctrlW + plusGap - 6;
          const dy = y + 18;
          const ddW = 94;
          const ddH = 48;
          const flipUp = dy + ddH > H - 6;
          const top = flipUp ? y - 18 - ddH : dy;
          return (
            <g onPointerDown={(e) => e.stopPropagation()}>
              <rect
                x={dx}
                y={top}
                width={ddW}
                height={ddH}
                rx={6}
                fill="#0f172a"
                stroke="#334155"
                strokeWidth={1}
              />
              {(["left", "right"] as const).map((s, idx2) => (
                <g
                  key={s}
                  style={{ cursor: "pointer" }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onAddGyre?.(s, c.id);
                    setAddGyreCtrl(null);
                  }}
                >
                  <rect
                    x={dx + 4}
                    y={top + 4 + idx2 * 20}
                    width={ddW - 8}
                    height={18}
                    rx={4}
                    fill="transparent"
                  />
                  <circle
                    cx={dx + 14}
                    cy={top + 4 + idx2 * 20 + 9}
                    r={3}
                    fill="#34d399"
                    fillOpacity={s === "left" ? 0.6 : 0.35}
                  />
                  <text
                    x={dx + 24}
                    y={top + 4 + idx2 * 20 + 9}
                    fill="#e2e8f0"
                    fontSize={9}
                    fontWeight={600}
                    dominantBaseline="central"
                    style={{ textTransform: "capitalize" }}
                  >
                    {s} wall
                  </text>
                </g>
              ))}
            </g>
          );
        })()}
    </>
  );
}
