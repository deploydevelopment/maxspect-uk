import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { getPublishedProducts } from "@/lib/catalog.functions";
import { SOURCE_TREE } from "@/lib/catalog-tree";
import { HeaderNavbar } from "@/components/HeaderNavbar";
import { SiteFooter } from "@/components/SiteFooter";
import { CatalogCardGrid, cardsForRange } from "@/components/CatalogBrowse";

export const Route = createFileRoute("/ranges")({
  head: () => ({
    meta: [
      { title: "Product Ranges | Maxspect UK" },
      {
        name: "description",
        content:
          "The Maxspect UK catalogue: Innovate, Jump, Professional, Smart Aquarium, Nano-Tech, and Accessories.",
      },
    ],
  }),
  loader: async () => {
    const products = await getPublishedProducts();
    return { products };
  },
  component: RangesPage,
});

function RangesPage() {
  const { products } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      <HeaderNavbar />
      <main className="flex-1">
        <div className="border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-xs text-slate-500">
            <Link to="/" className="hover:text-cyan-700">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-800 font-medium">Ranges</span>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
          <div className="max-w-2xl space-y-3">
            <h1 className="text-4xl font-black tracking-tight text-slate-950">Product ranges</h1>
            <p className="text-slate-600 leading-relaxed">
              The same grouping as maxspect.com: a range, then the models and specification
              pages that sit underneath it.
            </p>
          </div>
          {SOURCE_TREE.map((range) => (
            <section key={range.slug} className="space-y-6">
              <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-950">{range.name}</h2>
                  {range.description && (
                    <p className="text-sm text-slate-600 mt-1">{range.description}</p>
                  )}
                </div>
                <Link
                  to="/range/$slug"
                  params={{ slug: range.slug }}
                  className="text-sm font-semibold text-cyan-700 shrink-0"
                >
                  Open range
                </Link>
              </div>
              <CatalogCardGrid cards={cardsForRange(range, products)} />
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
