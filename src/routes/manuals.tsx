import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Search } from "lucide-react";
import { HeaderNavbar } from "@/components/HeaderNavbar";
import { SiteFooter } from "@/components/SiteFooter";
import { manualSeries } from "@/lib/product-manuals";

export const Route = createFileRoute("/manuals")({
  head: () => ({
    meta: [
      { title: "Product Manuals | Maxspect UK" },
      {
        name: "description",
        content:
          "English product manuals for Maxspect Professional, Jump, Innovate, Smart Aquarium, Nano-Tech, and Coral Tools equipment.",
      },
      { property: "og:title", content: "Maxspect UK Product Manuals" },
      {
        property: "og:description",
        content: "Download English user manuals for Maxspect aquarium equipment.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ManualsPage,
});

function ManualsPage() {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return manualSeries;
    return manualSeries
      .map((series) => ({
        ...series,
        manuals: series.manuals.filter(
          (manual) =>
            manual.title.toLowerCase().includes(term) ||
            series.title.toLowerCase().includes(term),
        ),
      }))
      .filter((series) => series.manuals.length > 0);
  }, [query]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      <HeaderNavbar />
      <main className="flex-1 flex flex-col">
        <section className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-b border-slate-800 py-10 lg:py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-center">
            <p className="text-sm font-semibold tracking-wide text-cyan-400">Support & Resources</p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              Product Manuals
            </h1>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300">
              English user guides for Maxspect lighting, Gyre pumps, skimmers, and aquarium systems.
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
                placeholder="Search manuals by product or series..."
                className="bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none w-full"
              />
            </div>

            {results.length === 0 ? (
              <p className="text-sm text-slate-500">No manuals match.</p>
            ) : (
              results.map((series) => (
                <div key={series.title} className="space-y-4">
                  <h2 className="text-xl font-bold text-slate-900">{series.title}</h2>
                  <ul className="space-y-3">
                    {series.manuals.map((manual) => (
                      <li
                        key={manual.title}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:px-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <h3 className="text-sm font-semibold text-slate-900">{manual.title}</h3>
                        <div className="flex flex-wrap gap-2">
                          {manual.files.map((file) => (
                            <a
                              key={file.href}
                              href={file.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-3.5 py-2 text-xs font-bold text-white hover:bg-cyan-400 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              {file.label}
                            </a>
                          ))}
                        </div>
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
