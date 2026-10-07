import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, ArrowRight } from "lucide-react";
import { SOURCE_TREE } from "@/lib/catalog-tree";

interface RangeProduct {
  id: string;
  name: string;
  range: string;
  rangeSlug: string;
  summary?: string;
  image?: string;
  to: "/product/$slug" | "/range/$slug";
  slug: string;
}

function isSpecPage(slug: string, title: string) {
  return /spec/i.test(slug) || /specification|technical specs|stand specs/i.test(title);
}

const CATALOG_RANGES = SOURCE_TREE.filter((range) => range.slug !== "accessories");

const PRODUCTS: RangeProduct[] = CATALOG_RANGES.flatMap((range) =>
  range.sub_ranges.flatMap((sub) => {
    const products = sub.products.filter((product) => !isSpecPage(product.slug, product.title));
    if (products.length === 0) {
      return [
        {
          id: sub.slug,
          name: sub.name,
          range: range.name,
          rangeSlug: range.slug,
          summary: sub.description,
          image: sub.image_url || range.image_url,
          to: "/range/$slug" as const,
          slug: sub.slug,
        },
      ];
    }
    return products.map((product) => ({
      id: product.slug,
      name: product.title,
      range: range.name,
      rangeSlug: range.slug,
      summary: product.summary || sub.description,
      image: product.hero_image || sub.image_url || range.image_url,
      to: "/product/$slug" as const,
      slug: product.slug,
    }));
  }),
);

const RANGES = ["All", ...CATALOG_RANGES.map((range) => range.name)];

export function ProductCatalog() {
  const [selectedRange, setSelectedRange] = useState("All");
  const [searchFilter, setSearchFilter] = useState("");

  const filteredProducts = useMemo(() => {
    const query = searchFilter.trim().toLowerCase();
    return PRODUCTS.filter((product) => {
      const matchesRange = selectedRange === "All" || product.range === selectedRange;
      const matchesSearch =
        !query ||
        [product.name, product.summary, product.range].join(" ").toLowerCase().includes(query);
      return matchesRange && matchesSearch;
    });
  }, [selectedRange, searchFilter]);

  return (
    <section id="products" className="scroll-mt-20 py-20 bg-white text-slate-900 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold tracking-wide text-cyan-600">
              Official 2026 Maxspect Product Range
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Innovate, Jump & Smart <span className="text-cyan-600">Aquarium Tech</span>
            </h2>
            <p className="text-slate-500 text-sm max-w-2xl">
              Browse our complete catalog of high-efficiency wavemakers, precision skimmers, full
              spectrum LED lights, and biological media distributed across the UK.
            </p>
          </div>

          <label className="flex w-72 max-w-full shrink-0 items-center gap-2.5 rounded-xl border border-slate-300 bg-slate-100 px-3.5 py-3">
            <Search className="h-5 w-5 shrink-0 text-slate-700" />
            <input
              type="text"
              placeholder="Filter by keyword..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-transparent text-base font-bold text-slate-900 placeholder:font-bold placeholder:text-slate-600 focus:outline-none"
            />
          </label>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {RANGES.map((range) => (
            <button
              key={range}
              onClick={() => setSelectedRange(range)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedRange === range
                  ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
                  : "bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 border border-slate-200"
              }`}
            >
              {range}
              {range === "All" ? ` (${PRODUCTS.length})` : ""}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="group relative rounded-2xl bg-white border border-slate-200 hover:border-cyan-400 p-5 flex flex-col justify-between transition-colors"
            >
              <div className="space-y-4">
                <div className="relative h-52 rounded-xl bg-slate-100 overflow-hidden">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-4xl font-black text-slate-300">
                      {product.name.slice(0, 1)}
                    </span>
                  )}
                </div>

                <div>
                  <div className="text-[11px] font-bold text-cyan-600 uppercase tracking-wider mb-1">
                    {product.range}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">
                    {product.name}
                  </h3>
                  {product.summary && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{product.summary}</p>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 mt-6">
                <Link
                  to={product.to}
                  params={{ slug: product.slug }}
                  className="w-full py-2.5 rounded-xl bg-cyan-50 hover:bg-cyan-500 hover:text-white text-cyan-700 text-xs font-bold border border-cyan-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  View product page
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
