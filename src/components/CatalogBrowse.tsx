import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { CatalogRange, CatalogSubRange, ProductPage } from "@/lib/catalog.types";
import { subRangeIsPage } from "@/lib/catalog-tree";

export interface CatalogCard {
  to: "/product/$slug" | "/range/$slug";
  slug: string;
  title: string;
  description?: string;
  image?: string;
  meta?: string;
}

function pictureFor(slug: string, fallback: string | undefined, products: ProductPage[]): string | undefined {
  if (fallback) return fallback;
  const live = products.find((product) => product.slug === slug);
  return live?.hero_image || live?.gallery_images?.[0];
}

function productCard(
  product: { slug: string; title: string; hero_image?: string; summary?: string },
  products: ProductPage[],
): CatalogCard {
  return {
    to: "/product/$slug",
    slug: product.slug,
    title: product.title,
    description: product.summary,
    image: pictureFor(product.slug, product.hero_image, products),
  };
}

/** Products shown on the Innovate Series landing, in the manufacturer's order. */
const INNOVATE_LANDING = [
  "gyre-300-cloud-edition",
  "aeraqua-duo-protein-skimmer",
  "turbine-duo",
  "ethereal-infinite",
  "rsx",
  "gyre-300-series",
];

export function cardsForRange(range: CatalogRange, products: ProductPage[]): CatalogCard[] {
  if (range.slug === "innovate-series") {
    const nodes = range.sub_ranges.flatMap((sub) => sub.products);
    return INNOVATE_LANDING.flatMap((slug) => {
      const product = nodes.find((item) => item.slug === slug);
      return product ? [productCard(product, products)] : [];
    });
  }
  return range.sub_ranges.map((sub) => cardForSub(sub, products));
}

export function cardsForSub(sub: CatalogSubRange, products: ProductPage[]): CatalogCard[] {
  return sub.products.map((product) => productCard(product, products));
}

function cardForSub(sub: CatalogSubRange, products: ProductPage[]): CatalogCard {
  if (subRangeIsPage(sub)) {
    const image =
      sub.image_url ||
      sub.products
        .map((product) => pictureFor(product.slug, product.hero_image, products))
        .find(Boolean);
    return {
      to: "/range/$slug" as const,
      slug: sub.slug,
      title: sub.name,
      description: sub.description,
      image,
      meta: sub.products.length > 1 ? `${sub.products.length} models` : undefined,
    };
  }
  const product = sub.products[0];
  return {
    to: "/product/$slug" as const,
    slug: product.slug,
    title: product.title,
    description: sub.description,
    image: pictureFor(product.slug, product.hero_image || sub.image_url, products),
  };
}

export function CatalogCardGrid({ cards }: { cards: CatalogCard[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {cards.map((card) => (
        <Link
          key={`${card.to}-${card.slug}`}
          to={card.to}
          params={{ slug: card.slug }}
          className="group flex items-stretch rounded-2xl border border-slate-200 bg-white overflow-hidden hover:border-cyan-400 transition-colors"
        >
          <div className="relative w-36 sm:w-44 shrink-0 self-stretch min-h-36 sm:min-h-44 bg-slate-100">
            {card.image ? (
              <img
                src={card.image}
                alt={card.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-3xl font-black text-slate-300">
                {card.title.slice(0, 1)}
              </span>
            )}
          </div>
          <div className="p-4 sm:p-5 flex flex-col gap-2 flex-1 min-w-0">
            {card.meta && (
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-700">
                {card.meta}
              </span>
            )}
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-cyan-700">
              {card.title}
            </h3>
            {card.description && (
              <p className="text-sm text-slate-600 leading-relaxed">{card.description}</p>
            )}
            <span className="mt-auto pt-3 text-sm font-semibold text-cyan-700 inline-flex items-center gap-1">
              View <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
