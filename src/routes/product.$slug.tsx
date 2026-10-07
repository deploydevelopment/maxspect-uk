import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getProductBySlug, getSpareParts } from "@/lib/catalog.functions";
import { findHeroSection, findLeadingVideo, bodySections } from "@/lib/product-section-helpers";
import { findProductCrumb } from "@/lib/catalog-tree";
import { HeaderNavbar } from "@/components/HeaderNavbar";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductHero, ProductStageHero } from "@/components/ProductHero";
import { ProductSections } from "@/components/ProductSections";
import { AutoPlayVideo } from "@/components/AutoPlayVideo";
import {
  MapPin,
  FileDown,
  Wrench,
  Layers,
  Lightbulb,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

const VIDEO_RE = /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i;

export const Route = createFileRoute("/product/$slug")({
  head: ({ loaderData }) => {
    if (!loaderData?.product) {
      return {
        meta: [
          { title: "Product Not Found | Maxspect UK" },
          {
            name: "description",
            content: "The requested Maxspect aquarium product could not be found.",
          },
        ],
      };
    }
    const { product } = loaderData;
    const heroSec = findHeroSection(product.sections);
    const heroImg = heroSec?.image_url || product.hero_image;
    const overlayImgs = heroSec?.overlay_images || [];

    return {
      links: [
        ...(heroImg
          ? [{ rel: "preload", as: "image", href: heroImg, fetchPriority: "high" as const }]
          : []),
        ...overlayImgs.slice(0, 2).map((src) => ({
          rel: "preload" as const,
          as: "image" as const,
          href: src,
        })),
      ],
      meta: [
        { title: `${product.title} | Maxspect UK Distributor` },
        { name: "description", content: product.subtitle || product.title },
        { property: "og:title", content: `${product.title} | Maxspect UK` },
        { property: "og:description", content: product.subtitle || product.title },
        { property: "og:type", content: "website" },
        ...(heroImg ? [{ property: "og:image", content: heroImg }] : []),
        { name: "twitter:card", content: "summary_large_image" },
        ...(heroImg ? [{ name: "twitter:image", content: heroImg }] : []),
      ],
    };
  },
  loader: async ({ params }) => {
    const product = await getProductBySlug({ data: params.slug });
    if (!product) {
      throw notFound();
    }
    const spares = await getSpareParts();

    const relevantSpares = spares.filter(
      (s) =>
        s.product_page_id === product.id ||
        s.compatibility.some((c) => product.title.toLowerCase().includes(c.toLowerCase())),
    );

    return { product, spares: relevantSpares };
  },
  component: ProductPageDetail,
});

function ProductPageDetail() {
  const { product, spares } = Route.useLoaderData();

  const heroSec = findHeroSection(product.sections);
  const crumb = findProductCrumb(product.slug);
  const heroImage = heroSec?.image_url || product.hero_image;
  const heroHeading = heroSec?.heading;
  const heroSubheading = heroSec?.subheading;
  const heroOverlays = heroSec?.overlay_images || [];
  const stageProduct = heroSec?.items?.find((item) => item.image_url)?.image_url;
  const leadingVideo = findLeadingVideo(product.sections);
  const visibleBody = bodySections(product.sections);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-cyan-500 selection:text-white flex flex-col pb-20 sm:pb-24">
      <HeaderNavbar />

      <main className="flex-1">
        {/* Breadcrumb Header */}
        <div className="border-b border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <Link to="/" className="hover:text-cyan-600 transition-colors">
              Home
            </Link>
            {crumb && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <Link
                  to="/range/$slug"
                  params={{ slug: crumb.range.slug }}
                  className="hover:text-cyan-600 transition-colors"
                >
                  {crumb.range.name}
                </Link>
              </>
            )}
            {crumb?.sub && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <Link
                  to="/range/$slug"
                  params={{ slug: crumb.sub.slug }}
                  className="hover:text-cyan-600 transition-colors"
                >
                  {crumb.sub.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-800 font-medium">{product.title}</span>
            {product.status === "draft" && (
              <span className="ml-auto px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                Draft Preview Mode
              </span>
            )}
          </div>
        </div>

        {/* 1. Hero — mirrors the source page's first media element.
             Only renders when the hero section has been pulled (pending/approved)
             via the section pipeline or full sync. Not-synced sections stay hidden
             so the page builds up one section at a time. */}
        {leadingVideo ? (
          <div className={`w-full bg-black ${leadingVideo.overlay_images?.length ? "" : "py-12"}`}>
            {(leadingVideo.heading || leadingVideo.subheading) && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2 text-center">
                {leadingVideo.heading && (
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                    {leadingVideo.heading}
                  </h2>
                )}
                {leadingVideo.subheading && (
                  <p className="text-sm text-slate-300">{leadingVideo.subheading}</p>
                )}
              </div>
            )}
            <div className={`relative w-full aspect-video bg-black ${leadingVideo.heading ? "mt-6" : ""}`}>
              {VIDEO_RE.test(leadingVideo.video_url!) ? (
                <AutoPlayVideo
                  src={leadingVideo.video_url!}
                  title={leadingVideo.video_title || leadingVideo.heading || "Product Video"}
                  className="absolute inset-0 w-full h-full object-contain bg-black"
                />
              ) : (
                <iframe
                  src={leadingVideo.video_url}
                  title={leadingVideo.video_title || leadingVideo.heading || "Product Video"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              )}
              {(leadingVideo.overlay_images?.length ?? 0) >= 2 && (
                <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-4 px-4 sm:px-8 lg:px-12 pt-4 sm:pt-8 pointer-events-none">
                  {leadingVideo.overlay_images!.slice(0, 2).map((src) => (
                    <img
                      key={src}
                      src={src}
                      alt=""
                      className="h-10 sm:h-14 md:h-16 w-auto max-w-[44%] object-contain"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : heroImage && (heroSec?.items?.filter((item) => item.image_url).length || 0) >= 2 ? (
          <section
            className="flex min-h-[28rem] items-center bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url("${heroImage}")` }}
          >
            <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-6 px-4 py-12 sm:px-8 lg:grid-cols-5">
              {heroSec!.items!.filter((item) => item.image_url).slice(0, 2).map((item, index) => (
                <img
                  key={item.image_url}
                  src={item.image_url}
                  alt={index === 0 ? product.title : ""}
                  className={`w-full h-auto object-contain ${index === 0 ? "lg:col-span-4" : ""}`}
                />
              ))}
            </div>
          </section>
        ) : stageProduct && heroImage ? (
          <ProductStageHero
            background={heroImage}
            productImage={stageProduct}
            overlays={heroOverlays}
            alt={product.title}
          />
        ) : heroImage ? (
          <ProductHero
            heading={heroHeading}
            subheading={heroSubheading}
            image={heroImage}
            alt={heroHeading || product.title}
            overlayImages={heroOverlays}
          />
        ) : null}

        {/* 2. Rich Scraped Sections — rendered in exact source document order.
            Only pulled (pending) or approved sections appear; not-synced and
            rejected sections are hidden so the page builds up one at a time. */}
        <ProductSections
          sections={visibleBody}
          className={
            visibleBody[0]?.layout === "poster"
              ? undefined
              : stageProduct && heroImage
                ? "pt-16"
                : !leadingVideo && !heroImage
                  ? "pt-12"
                  : undefined
          }
        />

        {/* Fallback only when the scrape did not produce rich sections.
            A synced page already contains its own feature rows and spec table;
            repeating them here flattens multi-column specs into a single value. */}
        {visibleBody.length === 0 && (
        <section className="py-12 bg-slate-50 border-t border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            {product.features && product.features.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-cyan-600" />
                  <h2 className="text-xl font-bold text-slate-900">Key Features & Innovation</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {product.features.map((feat, idx) => (
                    <div key={idx} className="space-y-2">
                      <h3 className="text-sm font-bold text-slate-900">{feat.title}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">{feat.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {product.specs && Object.keys(product.specs).length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyan-600" />
                  <h2 className="text-xl font-bold text-slate-900">Technical Specifications</h2>
                </div>
                <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden divide-y divide-slate-200">
                  {Object.entries(product.specs).map(([key, value]) => (
                    <div
                      key={key}
                      className="grid grid-cols-1 sm:grid-cols-2 p-4 text-xs hover:bg-slate-50 transition-colors"
                    >
                      <span className="font-semibold text-slate-500">{key}</span>
                      <span className="font-bold text-slate-900 font-mono mt-1 sm:mt-0">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {product.downloads && product.downloads.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileDown className="w-4 h-4 text-cyan-600" />
                  Documentation & Manuals
                </h3>
                <div className="flex flex-wrap gap-3">
                  {product.downloads.map((doc, idx) => (
                    <a
                      key={idx}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-xs font-semibold text-slate-700 transition-colors"
                    >
                      <FileDown className="w-4 h-4 text-cyan-600" />
                      {doc.name}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
        )}

        {/* Compatible Parts & Spares Section */}
        {spares.length > 0 && (
          <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-cyan-600" />
                <h2 className="text-xl font-bold text-slate-900">
                  Official Replacement Parts & Accessories
                </h2>
              </div>
              <Link
                to="/spares"
                className="text-xs font-bold text-cyan-600 hover:underline flex items-center gap-1"
              >
                View all parts <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {spares.map((spare) => (
                <div
                  key={spare.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 flex flex-col justify-between"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={spare.image_url}
                      alt={spare.name}
                      className="w-16 h-16 object-contain rounded-xl bg-slate-50 border border-slate-200 p-2 shrink-0"
                    />
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-cyan-600">{spare.sku}</span>
                      <h3 className="text-xs font-bold text-slate-900 leading-snug">
                        {spare.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{spare.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                    <span className="text-sm font-extrabold text-slate-900 font-mono">
                      £{spare.price_gbp.toFixed(2)}
                    </span>
                    <Link
                      to="/spares"
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-extrabold transition-colors"
                    >
                      Buy Spare Part
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />

      {/* Fixed product action bar — always visible at bottom of viewport */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-white truncate">
              {product.title}
            </h2>
            {product.subtitle && !product.subtitle.startsWith("Latest content pulled") && (
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">{product.subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              to="/stockists"
              className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs sm:text-sm transition-all"
            >
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">Find a Local UK Stockist</span>
              <span className="sm:hidden">Stockists</span>
            </Link>

            <Link
              to="/spares"
              className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 transition-colors"
            >
              <Wrench className="w-4 h-4" />
              <span className="hidden sm:inline">Parts & Spares</span>
              <span className="sm:hidden">Parts</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
