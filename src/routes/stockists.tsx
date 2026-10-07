import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { getMapsEmbedKey, getStockists } from "@/lib/catalog.functions";
import type { LiveStockist } from "@/lib/supply-engine.types";
import { HeaderNavbar } from "@/components/HeaderNavbar";
import { SiteFooter } from "@/components/SiteFooter";
import {
  MapPin,
  Search,
  Phone,
  Globe,
  Navigation,
  Clock,
  ExternalLink,
  Store,
  Compass,
} from "lucide-react";

export const Route = createFileRoute("/stockists")({
  head: () => ({
    meta: [
      { title: "Find a Stockist | Maxspect UK Authorised Dealers & Stores" },
      {
        name: "description",
        content:
          "Locate authorised Maxspect UK aquatic retailers and marine aquarium specialist stores.",
      },
      { property: "og:title", content: "Find a Maxspect UK Stockist" },
      {
        property: "og:description",
        content: "Store locator for Maxspect marine equipment in the UK.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async () => {
    const [feed, mapKey] = await Promise.all([getStockists(), getMapsEmbedKey()]);
    return { ...feed, mapKey };
  },
  component: StockistPage,
});

function placeLine(stockist: LiveStockist) {
  return [stockist.town, stockist.county, stockist.postcode].filter(Boolean).join(", ");
}

function websiteLabel(website: string) {
  return website.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

function mapQuery(stockist: LiveStockist) {
  return [stockist.name, stockist.address, placeLine(stockist)].filter(Boolean).join(", ");
}

function mapEmbedSrc(stockist: LiveStockist, mapKey: string) {
  const params = new URLSearchParams({
    key: mapKey,
    q: mapQuery(stockist),
    zoom: "15",
  });
  return `https://www.google.com/maps/embed/v1/place?${params.toString()}`;
}

function StockistPage() {
  const { stockists, error, mapKey } = Route.useLoaderData();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(stockists[0]?.id ?? null);

  const filteredStockists = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return stockists;
    return stockists.filter((stockist) =>
      [stockist.name, stockist.town, stockist.county, stockist.postcode, stockist.address]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [stockists, searchQuery]);

  const selectedStockist =
    filteredStockists.find((stockist) => stockist.id === selectedId) ??
    filteredStockists[0] ??
    null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      <HeaderNavbar />

      <main className="flex-1 flex flex-col">
        {/* Banner Section */}
        <section className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-b border-slate-800 py-10 lg:py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-center">
            <p className="text-sm font-semibold tracking-wide text-cyan-400">Official UK Network</p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              Find an Authorised Maxspect UK Stockist
            </h1>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300">
              Locate aquatic centres and marine specialists who stock Maxspect across the UK.
            </p>
          </div>
        </section>

        {/* Filter & Map Workspace */}
        <section className="flex-1 bg-white text-slate-900 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Search Controls */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white border border-slate-200">
              <Search className="w-4 h-4 text-cyan-600 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by store name, town, or postcode..."
                className="bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none w-full"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {error}
            </p>
          )}

          {/* Interactive Split View: List + Google Maps Visualizer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Stockists List */}
            <div className="lg:col-span-5 space-y-3 max-h-[680px] overflow-y-auto pr-1">
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono px-1">
                <span>Showing {filteredStockists.length} stores</span>
                <span>Alphabetical</span>
              </div>

              {filteredStockists.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-white border border-slate-200 space-y-2">
                  <Store className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-800">
                    {error ? "Stockist list unavailable" : "No matching stockists found"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {error
                      ? "The list will appear here once the stockist feed responds."
                      : "Try a different store name, town, or postcode."}
                  </p>
                </div>
              ) : (
                filteredStockists.map((stk) => {
                  const isSelected = selectedStockist?.id === stk.id;
                  return (
                    <div
                      key={stk.id}
                      onClick={() => setSelectedId(stk.id)}
                      className={`p-5 rounded-2xl transition-all cursor-pointer border bg-white ${
                        isSelected
                          ? "border-cyan-400"
                          : "border-slate-200 hover:border-cyan-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900">{stk.name}</h3>
                          {stk.address && (
                            <p className="text-xs text-slate-500 mt-1">{stk.address}</p>
                          )}
                          <p className="text-xs text-slate-600 font-medium">{placeLine(stk)}</p>
                        </div>

                        <div className="p-2 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-700 shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                      </div>

                      {isSelected && (
                        <div className="mt-4 pt-3 border-t border-slate-200 space-y-2 text-xs text-slate-600">
                          {stk.phone && (
                            <a
                              href={`tel:${stk.phone}`}
                              className="flex items-center gap-2 text-cyan-700 hover:underline"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              {stk.phone}
                            </a>
                          )}
                          {stk.website && (
                            <a
                              href={stk.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
                            >
                              <Globe className="w-3.5 h-3.5 text-slate-400" />
                              {websiteLabel(stk.website)}
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Google Map Mock/Embed Container */}
            <div className="lg:col-span-7 h-[680px] rounded-2xl bg-white border border-slate-200 relative overflow-hidden flex flex-col">
              {/* Top Map Action Bar */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between z-10">
                <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
                  <Compass className="w-4 h-4 text-cyan-600" />
                  <span>
                    {selectedStockist
                      ? `Viewing: ${selectedStockist.name}`
                      : "Interactive Store Locator"}
                  </span>
                </div>
                {selectedStockist && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      [selectedStockist.name, selectedStockist.address, placeLine(selectedStockist)]
                        .filter(Boolean)
                        .join(", "),
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 text-white text-xs font-bold hover:bg-cyan-400 transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    Get Directions
                  </a>
                )}
              </div>

              <div className="flex-1 relative bg-slate-50 min-h-[420px]">
                {selectedStockist && mapKey ? (
                  <iframe
                    key={selectedStockist.id}
                    title={`Map of ${selectedStockist.name}`}
                    src={mapEmbedSrc(selectedStockist, mapKey)}
                    className="absolute inset-0 h-full w-full border-0"
                    loading="eager"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                    <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]" />
                    <div className="relative space-y-2">
                      <MapPin className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-sm font-bold text-slate-500">
                        {selectedStockist
                          ? selectedStockist.name
                          : "Select a stockist from the left to view it on the map."}
                      </p>
                    </div>
                  </div>
                )}

                {selectedStockist && selectedStockist.openingTimes.length > 0 && (
                  <div className="absolute bottom-10 left-3 z-10 rounded-xl border border-slate-200 bg-white/95 p-3 text-left text-xs">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Opening hours
                    </span>
                    <div className="mt-1.5 space-y-0.5 text-slate-800">
                      {selectedStockist.openingTimes.map((slot) => (
                        <p key={slot.day} className="flex">
                          <span className="w-8 shrink-0">{slot.day}</span>
                          <span>{slot.hours}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
