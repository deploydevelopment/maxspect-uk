import React from "react";
import type { PumpConfig, ControllerConfig, FlowMode, GyrePatch } from "@/lib/tank-flow-helpers";
import { GyreEditor, ControllerEditor } from "./TankFlowControllerEditor";

export interface FlowDialogsProps {
  editingPump: PumpConfig | null;
  editingController: ControllerConfig | null;
  controllers: ControllerConfig[];
  pumps: PumpConfig[];
  modes: { id: FlowMode; label: string; icon: React.ReactNode; desc: string }[];
  onUpdateGyre?: (id: string, patch: GyrePatch) => void;
  onUpdateController?: (id: string, patch: Partial<ControllerConfig>) => void;
  onCloseGyre: () => void;
  onCloseController: () => void;
}

export function FlowDialogs({
  editingPump,
  editingController,
  controllers,
  pumps,
  modes,
  onUpdateGyre,
  onUpdateController,
  onCloseGyre,
  onCloseController,
}: FlowDialogsProps) {
  return (
    <>
      <GyreEditor
        open={!!editingPump}
        editingPump={editingPump}
        controllers={controllers}
        onUpdateGyre={onUpdateGyre}
        onClose={onCloseGyre}
      />
      <ControllerEditor
        open={!!editingController}
        editingController={editingController}
        controllers={controllers}
        pumps={pumps}
        modes={modes}
        onUpdateController={onUpdateController}
        onClose={onCloseController}
      />
    </>
  );
}
