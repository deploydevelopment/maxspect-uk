import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { getSupplyProduct } from "@/lib/spares.functions";
import { HeaderNavbar } from "@/components/HeaderNavbar";
import { SiteFooter } from "@/components/SiteFooter";
import { useSparesBasket } from "@/components/SparesBasket";
import { ChevronLeft, Minus, Plus } from "lucide-react";

export const Route = createFileRoute("/spares/$productId")({
  loader: async ({ params }) => {
    const product = await getSupplyProduct({ data: params.productId });
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `${loaderData.product.name} | Maxspect UK Spares`
          : "Spare part | Maxspect UK",
      },
      {
        name: "description",
        content: loaderData?.product.description || "Genuine Maxspect replacement part.",
      },
    ],
  }),
  component: SpareProductPage,
});

function money(value: number) {
  return `£${value.toFixed(2)}`;
}

function showHolding(event: { currentTarget: HTMLImageElement }) {
  if (!event.currentTarget.src.endsWith("/holding.jpg")) {
    event.currentTarget.src = "/holding.jpg";
  }
}

function SpareGallery({
  images,
  thumbnails,
}: {
  images: string[];
  thumbnails: string[];
}) {
  const photos = images.length > 0 ? images : ["/holding.jpg"];
  const thumbs = thumbnails.length === photos.length ? thumbnails : photos;
  const [index, setIndex] = useState(0);
  const current = photos[Math.min(index, photos.length - 1)];

  return (
    <div>
      <div className="w-full rounded-2xl bg-white overflow-hidden">
        <img src={current} alt="" className="block w-full h-auto" onError={showHolding} />
      </div>
      {photos.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {photos.map((photo, photoIndex) => (
            <button
              key={`${photo}-${photoIndex}`}
              type="button"
              onClick={() => setIndex(photoIndex)}
              aria-label={`Image ${photoIndex + 1}`}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white border-2 ${
                photoIndex === index ? "border-cyan-500" : "border-transparent"
              }`}
            >
              <img
                src={thumbs[photoIndex] || photo}
                alt=""
                className="h-full w-full object-contain"
                onError={showHolding}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SpareProductPage() {
  const { product } = Route.useLoaderData();
  const basket = useSparesBasket();
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      <HeaderNavbar />
      <main className="flex-1 flex flex-col bg-white text-slate-900">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <Link
            to="/spares"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            All spare parts
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <SpareGallery images={product.images} thumbnails={product.thumbnails} />

            <div className="space-y-4">
              {product.sku ? (
                <p className="text-xs font-mono text-cyan-700">{product.sku}</p>
              ) : null}
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{product.name}</h1>
              <p className="text-2xl font-extrabold font-mono text-slate-900">
                {money(product.price)}
                <span className="ml-2 text-xs font-semibold text-slate-500">inc. VAT</span>
              </p>
              {product.priceWas != null && product.priceWas > product.price && (
                <p className="text-sm text-slate-400 line-through font-mono">
                  {money(product.priceWas)}
                </p>
              )}
              {product.stockLevel > 0 && (
                <p className="text-sm text-emerald-700 font-semibold">
                  {product.stockLevel} in stock
                </p>
              )}
              {product.description ? (
                <p className="text-sm text-slate-600 leading-relaxed">{product.description}</p>
              ) : null}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                    className="p-3 text-slate-500 hover:text-slate-900 cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-mono font-bold text-sm text-slate-900">{quantity}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => setQuantity((current) => current + 1)}
                    className="p-3 text-slate-500 hover:text-slate-900 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => basket.add(product, quantity)}
                  className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-sm transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add to Basket
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
