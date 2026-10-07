import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { getSparesShop } from "@/lib/spares.functions";
import { HeaderNavbar } from "@/components/HeaderNavbar";
import { SiteFooter } from "@/components/SiteFooter";
import { useSparesBasket } from "@/components/SparesBasket";
import { ChevronDown, Search, ShoppingCart, Plus } from "lucide-react";

export const Route = createFileRoute("/spares/")({
  loader: () => getSparesShop(),
  head: () => ({
    meta: [
      { title: "Official Replacement Parts & Spares | Maxspect UK" },
      {
        name: "description",
        content:
          "Buy genuine Maxspect replacement rotors, power supplies, directional cages, and skimmer impellers direct from Maxspect UK.",
      },
      { property: "og:title", content: "Maxspect UK Replacement Parts & Spares E-Commerce" },
      {
        property: "og:description",
        content: "Genuine Maxspect spare parts store with Stripe & PayPal checkout support.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SparesStorePage,
});

function money(value: number) {
  return `£${value.toFixed(2)}`;
}

function SparesStorePage() {
  const { groups, products, error } = Route.useLoaderData();
  const basket = useSparesBasket();
  const [searchQuery, setSearchQuery] = useState("");
  const [rangeId, setRangeId] = useState("all");

  const filteredSpares = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((part) => {
      const inRange = rangeId === "all" || part.groupIds.includes(rangeId);
      if (!inRange) return false;
      if (!query) return true;
      return (
        part.name.toLowerCase().includes(query) ||
        part.sku.toLowerCase().includes(query) ||
        part.brand.toLowerCase().includes(query)
      );
    });
  }, [products, searchQuery, rangeId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col relative">
      <HeaderNavbar />

      <main className="flex-1 flex flex-col">
        {/* Banner */}
        <section className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-b border-slate-800 py-10 lg:py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-center">
            <p className="text-sm font-semibold text-cyan-400">Direct Official UK Spares</p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              Maxspect Spare Parts & Replacement Hardware
            </h1>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300">
              Factory rotors, impellers, directional cages, and power transformers shipped directly
              from Maxspect UK.
            </p>
          </div>
        </section>

        {/* Store Workspace */}
        <section className="flex-1 bg-white text-slate-900 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Controls Bar */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {groups.length > 0 && (
              <label className="relative sm:w-56 shrink-0">
                <span className="sr-only">Range</span>
                <select
                  value={rangeId}
                  onChange={(event) => setRangeId(event.target.value)}
                  className="w-full appearance-none pl-3.5 pr-10 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 outline-none"
                >
                  <option value="all">All ranges</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400/80" />
              </label>
            )}

            <div className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white border border-slate-200">
              <Search className="w-4 h-4 text-cyan-600 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search spare parts by name or SKU..."
                className="bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none w-full"
              />
            </div>

            <button
              onClick={() => basket.open()}
              className="relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold text-xs transition-colors cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Basket ({basket.count})</span>
              <span className="ml-1 font-mono">{money(basket.total)}</span>
            </button>
          </div>

          {error && <p className="text-sm text-slate-500">{error}</p>}

          {!error && filteredSpares.length === 0 && (
            <p className="text-sm text-slate-500">No parts match.</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {filteredSpares.map((part) => (
              <div
                key={part.id}
                className="rounded-2xl bg-white border border-slate-200 hover:border-cyan-400 transition-all flex flex-col justify-between overflow-hidden"
              >
                <div>
                  <Link to="/spares/$productId" params={{ productId: part.id }} className="block">
                    <div className="relative aspect-square w-full bg-white">
                      <img
                        src={part.thumbnail || "/holding.jpg"}
                        alt=""
                        className="absolute inset-0 w-full h-full object-contain"
                        onError={(event) => {
                          if (!event.currentTarget.src.endsWith("/holding.jpg")) {
                            event.currentTarget.src = "/holding.jpg";
                          }
                        }}
                      />
                    </div>
                    <div className="p-3 space-y-1">
                      {part.sku ? (
                        <span className="text-[10px] font-mono text-cyan-700 block">{part.sku}</span>
                      ) : null}
                      <h3 className="text-xs font-bold text-slate-900 line-clamp-2">{part.name}</h3>
                      {part.description ? (
                        <p className="text-xs text-slate-500 line-clamp-2">{part.description}</p>
                      ) : null}
                    </div>
                  </Link>
                </div>

                <div className="space-y-2 px-3 pb-3 pt-3 border-t border-slate-200">
                  <div>
                    <span className="text-sm font-extrabold text-slate-900 font-mono">
                      {money(part.price)}
                    </span>
                    {part.priceWas != null && part.priceWas > part.price && (
                      <span className="ml-2 text-xs text-slate-400 line-through font-mono">
                        {money(part.priceWas)}
                      </span>
                    )}
                    {part.stockLevel > 0 && (
                      <span className="block text-[10px] text-emerald-700 font-semibold">
                        {part.stockLevel} in stock
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => basket.add(part)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-extrabold text-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add to Basket
                  </button>
                </div>
              </div>
            ))}
          </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
