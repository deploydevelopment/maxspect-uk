import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { getProductBySlug, getPublishedProducts } from "@/lib/catalog.functions";
import { findCatalogLocation } from "@/lib/catalog-tree";
import { bodySections, findHeroSection } from "@/lib/product-section-helpers";
import { HeaderNavbar } from "@/components/HeaderNavbar";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductHero } from "@/components/ProductHero";
import { ProductSections } from "@/components/ProductSections";
import { CatalogCardGrid, cardsForRange, cardsForSub } from "@/components/CatalogBrowse";
import type { CatalogProductNode } from "@/lib/catalog.types";

function modelKey(value: string) {
  return (value.match(/\d+/g) || []).join("-");
}

function compact(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function matchChildProduct(title: string, products: CatalogProductNode[]) {
  const key = compact(title);
  const exact = products.find((product) => compact(product.title) === key);
  if (exact) return exact;
  const models = modelKey(title);
  if (!models) return undefined;
  const hits = products.filter(
    (product) => modelKey(product.title) === models || modelKey(product.slug) === models,
  );
  return hits.length === 1 ? hits[0] : undefined;
}

export const Route = createFileRoute("/range/$slug")({
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `${loaderData.title} | Maxspect UK`
          : "Range | Maxspect UK",
      },
      {
        name: "description",
        content: loaderData?.description || "Maxspect UK product range.",
      },
    ],
  }),
  loader: async ({ params }) => {
    const location = findCatalogLocation(params.slug);
    if (!location) throw notFound();
    const title = location.sub?.name || location.range.name;
    const description = location.sub?.description || location.range.description || title;
    const [products, own] = await Promise.all([
      getPublishedProducts(),
      getProductBySlug({ data: params.slug }),
    ]);
    return { slug: params.slug, title, description, products, own };
  },
  component: RangePage,
});

function RangePage() {
  const { slug, title, description, products, own } = Route.useLoaderData();
  const location = findCatalogLocation(slug);
  if (!location) return null;

  const cards = location.sub
    ? cardsForSub(location.sub, products)
    : cardsForRange(location.range, products);
  const hero = own ? findHeroSection(own.sections) : undefined;
  const body = own ? bodySections(own.sections) : [];
  const children = location.sub?.products ?? [];
  const linkForItem = (item: { title: string }) => {
    const match = matchChildProduct(item.title, children);
    return match ? { to: "/product/$slug" as const, slug: match.slug } : undefined;
  };
  const bodyListsChildren =
    children.length > 0 &&
    children.every((product) =>
      body.some((section) => section.items?.some((item) => linkForItem(item)?.slug === product.slug)),
    );

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      <HeaderNavbar />
      <main className="flex-1">
        <div className="border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-xs text-slate-500">
            <Link to="/" className="hover:text-cyan-700">
              Home
            </Link>
            {location.sub && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link
                  to="/range/$slug"
                  params={{ slug: location.range.slug }}
                  className="hover:text-cyan-700"
                >
                  {location.range.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-800 font-medium">{title}</span>
          </div>
        </div>

        {hero?.image_url ? (
          <ProductHero
            heading={hero.heading || title}
            subheading={hero.subheading}
            image={hero.image_url}
            alt={title}
            overlayImages={hero.overlay_images || []}
          />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
            <h1 className="text-4xl font-black tracking-tight text-slate-950">{title}</h1>
            <p className="mt-3 max-w-2xl text-slate-600 leading-relaxed">{description}</p>
          </div>
        )}

        {body.length > 0 && own?.sections && (
          <ProductSections
            sections={body}
            resolveItemLink={children.length > 0 ? linkForItem : undefined}
          />
        )}

        {!bodyListsChildren && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
            {!location.sub && (
              <h2 className="text-2xl font-black text-slate-950">Browse</h2>
            )}
            <CatalogCardGrid cards={cards} />
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
