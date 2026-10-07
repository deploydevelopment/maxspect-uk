import { createFileRoute } from "@tanstack/react-router";
import { HeaderNavbar } from "../components/HeaderNavbar";
import { HeroBanner } from "../components/HeroBanner";
import { GyreSimulatorBand } from "../components/GyreSimulatorBand";
import { ProductCatalog } from "../components/ProductCatalog";
import { UkDistributorSection } from "../components/UkDistributorSection";
import { SiteFooter } from "../components/SiteFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Maxspect UK | Premium Aquarium Lighting, Gyre Flow & Equipment" },
      {
        name: "description",
        content:
          "Official UK Distributor for Maxspect Marine Aquarium Technology. Premium LED lighting, Gyre water flow pumps, protein skimmers, and nano-tech bio-media.",
      },
      { property: "og:title", content: "Maxspect UK | Premium Aquarium Technology" },
      {
        property: "og:description",
        content:
          "Innovative marine aquarium lighting, Gyre pumps, skimmers, and smart reef equipment from the official UK distributor.",
      },
      { property: "og:type", content: "website" },
      {
        property: "og:image",
        content:
          "https://vibe.filesafe.space/1789478205437100025/assets/0c43d19f-5cc3-4e2f-98c8-d46edd6eb376.png",
      },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:image",
        content:
          "https://vibe.filesafe.space/1789478205437100025/assets/0c43d19f-5cc3-4e2f-98c8-d46edd6eb376.png",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
      <HeaderNavbar />
      <main>
        <HeroBanner />
        <GyreSimulatorBand />
        <ProductCatalog />
        <UkDistributorSection />
      </main>
      <SiteFooter />
    </div>
  );
}
