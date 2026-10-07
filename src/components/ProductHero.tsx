import { useEffect, useRef, useState } from "react";

interface ProductStageHeroProps {
  background: string;
  productImage: string;
  overlays?: string[];
  alt: string;
}

/**
 * Full-bleed manufacturer hero: a background plate, wordmarks at the edges,
 * and the product photo floating in the middle.
 */
export function ProductStageHero({
  background,
  productImage,
  overlays = [],
  alt,
}: ProductStageHeroProps) {
  const [topLeft, topRight, ...below] = overlays;
  return (
    <section
      className="relative w-full overflow-hidden bg-slate-950 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${background})` }}
    >
      <div className="relative z-10 mx-auto flex w-full max-w-7xl items-end justify-between gap-4 px-4 pt-6 sm:px-8 sm:pt-10">
        {topLeft ? (
          <img src={topLeft} alt="" className="h-10 w-auto max-w-[42%] object-contain sm:h-14 md:h-16" />
        ) : (
          <span />
        )}
        {topRight ? (
          <img src={topRight} alt="" className="h-8 w-auto max-w-[46%] object-contain sm:h-12 md:h-14" />
        ) : null}
      </div>
      <div className="relative z-10 flex min-h-[62vh] items-center justify-center px-4 sm:min-h-[78vh] sm:px-8">
        <img
          src={productImage}
          alt={alt}
          className="w-full max-w-5xl object-contain"
        />
      </div>
      {below.length > 0 && (
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-8 sm:px-8 sm:pb-10">
          {below.map((src) => (
            <img key={src} src={src} alt="" className="h-7 w-auto object-contain sm:h-9" />
          ))}
        </div>
      )}
    </section>
  );
}

interface ProductHeroProps {
  heading: string;
  subheading?: string;
  image?: string;
  alt?: string;
  overlayImages?: string[];
}

/**
 * ProductHero — renders an edge-to-edge product banner with smooth
 * scroll parallax, immediate image preloading, and optional bottom-right logo overlays.
 */
export function ProductHero({
  heading,
  subheading,
  image,
  alt = heading,
  overlayImages = [],
}: ProductHeroProps) {
  const [loaded, setLoaded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const layerRef = useRef<HTMLDivElement>(null);
  const imgWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fade in text/overlays quickly on mount
    const t = setTimeout(() => setLoaded(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const img = imgWrapRef.current?.querySelector("img");
    if (img && img.complete && img.naturalWidth > 0) setImageLoaded(true);
  }, [image]);

  // Parallax scroll on the hero image
  useEffect(() => {
    const layer = layerRef.current;
    const wrap = imgWrapRef.current;
    if (!layer || !wrap) return;

    let rafId: number | null = null;
    let ticking = false;

    const updateTransform = () => {
      ticking = false;
      const rect = wrap.getBoundingClientRect();
      const wrapHeight = rect.height || 400;
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;

      const scrolled = -rect.top;
      const maxOffset = wrapHeight * 0.08;
      const offset = Math.max(-maxOffset, Math.min(maxOffset, scrolled * 0.08));
      layer.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        rafId = window.requestAnimationFrame(updateTransform);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    updateTransform();

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
    };
  }, [imageLoaded]);

  return (
    <div className="relative w-full overflow-hidden bg-white text-slate-900 border-b border-slate-200">
      {image && (
        <div ref={imgWrapRef} className="relative w-full overflow-hidden">
          {/* Parallax layer: rendered immediately so the image is the FIRST thing to show */}
          <div ref={layerRef} className="will-change-transform">
            <img
              src={image}
              alt={alt}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className="block w-full h-auto max-h-[85vh] object-contain mx-auto select-none pointer-events-none"
              style={{
                opacity: imageLoaded ? 1 : 0,
                transition: "opacity 0.25s ease-out",
              }}
              onLoad={() => setImageLoaded(true)}
            />
          </div>

          {/* Floating overlay logos (e.g. 3_logos_hero, patented badge) */}
          {overlayImages && overlayImages.length > 0 && (
            <div
              className={`absolute bottom-4 right-4 sm:bottom-6 sm:right-8 z-10 flex flex-row items-end gap-2 sm:gap-4 pointer-events-none transition-all duration-700 delay-300 ${
                loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              {overlayImages.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt=""
                  className="h-10 sm:h-14 md:h-20 lg:h-24 w-auto max-w-[35vw] sm:max-w-[220px] object-contain drop-shadow-sm select-none"
                  loading="lazy"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
