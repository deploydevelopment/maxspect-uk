import { createFileRoute } from "@tanstack/react-router";
import { TankFlowSimulator } from "../components/TankFlowSimulator";

export const Route = createFileRoute("/flow-simulator")({
  head: () => ({
    meta: [
      { title: "Tank Flow Simulator | Maxspect UK" },
      {
        name: "description",
        content:
          "Interactive Maxspect Gyre tank flow simulator. Enter your aquarium dimensions, pick a pump model, and visualise cross-flow circulation in real time.",
      },
      { property: "og:title", content: "Tank Flow Simulator | Maxspect UK" },
      {
        property: "og:description",
        content:
          "Interactive Maxspect Gyre tank flow simulator — visualise cross-flow circulation for your exact aquarium dimensions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FlowSimulatorPage,
});

function FlowSimulatorPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
      <main>
        <TankFlowSimulator />
      </main>
    </div>
  );
}
