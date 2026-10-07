import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { HeaderNavbar } from "@/components/HeaderNavbar";
import { SiteFooter } from "@/components/SiteFooter";
import { listRegisterableProducts } from "@/lib/catalog-tree";

export const Route = createFileRoute("/register/")({
  head: () => ({
    meta: [
      { title: "Register a Product | Maxspect UK" },
      {
        name: "description",
        content:
          "Register your Maxspect product for a 12 month extended warranty. Select your product to continue.",
      },
    ],
  }),
  component: RegisterIndexPage,
});

function RegisterIndexPage() {
  const products = listRegisterableProducts();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    const matched = term
      ? products.filter(
          (product) =>
            product.title.toLowerCase().includes(term) ||
            product.range.toLowerCase().includes(term),
        )
      : products;
    const ranges = [...new Set(matched.map((product) => product.range))];
    return ranges.map((range) => ({
      range,
      products: matched.filter((product) => product.range === range),
    }));
  }, [products, query]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      <HeaderNavbar />
      <main className="flex-1 flex flex-col">
        <section className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-b border-slate-800 py-10 lg:py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-center">
            <p className="text-sm font-semibold tracking-wide text-cyan-400">Support & Resources</p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              Register a Product
            </h1>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300">
              Select your product to continue to the registration form.
            </p>
          </div>
        </section>

        <section className="flex-1 bg-white text-slate-900 border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white border border-slate-200">
              <Search className="w-4 h-4 text-cyan-600 shrink-0" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products..."
                className="bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none w-full"
              />
            </div>

            {results.length === 0 ? (
              <p className="text-sm text-slate-500">No products match.</p>
            ) : (
              results.map(({ range, products: rangeProducts }) => (
                <div key={range} className="space-y-3">
                  <h2 className="text-lg font-bold text-slate-900">{range}</h2>
                  <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
                    {rangeProducts.map((product) => (
                      <li key={product.slug}>
                        <Link
                          to="/register/$slug"
                          params={{ slug: product.slug }}
                          className="block px-4 py-3 text-sm text-slate-800 hover:bg-slate-50 hover:text-cyan-700 transition-colors"
                        >
                          {product.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
