import React, { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Zap,
  ShieldCheck,
  ArrowRight,
  Building2,
  Award,
  Cpu,
  Radio,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

function scrollToProductRange(event: React.MouseEvent<HTMLAnchorElement>) {
  const target = document.getElementById("products");
  if (!target) return;
  event.preventDefault();

  const header = document.querySelector("header");
  const headerHeight = header?.getBoundingClientRect().height ?? 0;
  // The top bar and taller nav collapse once the page moves. Land under that compact bar.
  const collapsedHeader = 64;
  const shrink = Math.max(0, headerHeight - collapsedHeader);
  const top =
    target.getBoundingClientRect().top + window.scrollY - collapsedHeader - 16 - shrink;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: Math.max(0, top), behavior: reduced ? "auto" : "smooth" });
  history.pushState(null, "", "#products");
}

const SHOWCASE = {
  gyre: {
    slug: "gyre-300-cloud-edition",
    image: "/media/images/Products/Innovate/gyre-300-ce-newlayout/gyre-300-ce-hero.png",
    alt: "Gyre 300 Cloud Edition",
  },
  ethereal: {
    slug: "ethereal-infinite",
    image: "/media/images/Products/Innovate/ethereal%20infinite/rgb_ethereal3.webp",
    alt: "Ethereal Infinite LED",
  },
  skimmer: {
    slug: "aeraqua-duo-protein-skimmer",
    image: "/media/images/Products/Innovate/innovate-aeraqua-skimmer/360/3.jpg",
    alt: "Aeraqua Duo Protein Skimmer",
  },
} as const;

type Speck = { key: string; style: React.CSSProperties };

function speck(
  key: string,
  size: number,
  left: string,
  top: string,
  opacity: number,
  seconds: number,
  delay: string,
  alt: boolean,
): Speck {
  return {
    key,
    style: {
      width: size,
      height: size,
      left,
      top,
      opacity,
      animationDuration: `${seconds}s`,
      animationDelay: delay,
      animationName: alt ? "hero-bokeh-drift-alt" : "hero-bokeh-drift",
    },
  };
}

const FLARES: Speck[] = [
  speck("f1", 110, "4%", "16%", 0.07, 13, "0s", false),
  speck("f2", 160, "18%", "64%", 0.045, 16, "-5s", true),
  speck("f3", 70, "34%", "24%", 0.11, 10, "-2s", false),
  speck("f4", 130, "58%", "74%", 0.05, 15, "-7s", true),
  speck("f5", 48, "72%", "10%", 0.14, 9, "-1s", false),
  speck("f6", 180, "78%", "42%", 0.035, 18, "-9s", true),
  speck("f7", 86, "90%", "20%", 0.08, 12, "-4s", false),
];

const DUST: Speck[] = [
  speck("d1", 2, "9%", "38%", 0.45, 7, "-1s", false),
  speck("d2", 3, "14%", "12%", 0.18, 11, "-3s", true),
  speck("d3", 2, "22%", "46%", 0.55, 6, "0s", false),
  speck("d4", 4, "27%", "28%", 0.12, 13, "-6s", true),
  speck("d5", 2, "31%", "72%", 0.32, 8, "-2s", false),
  speck("d6", 3, "38%", "8%", 0.22, 10, "-4s", true),
  speck("d7", 2, "41%", "54%", 0.6, 6, "-1s", false),
  speck("d8", 5, "47%", "34%", 0.1, 14, "-8s", true),
  speck("d9", 2, "52%", "18%", 0.38, 7, "-2s", false),
  speck("d10", 3, "56%", "62%", 0.16, 12, "-5s", true),
  speck("d11", 2, "63%", "40%", 0.5, 6, "0s", false),
  speck("d12", 4, "68%", "78%", 0.09, 15, "-7s", true),
  speck("d13", 2, "74%", "26%", 0.28, 8, "-3s", false),
  speck("d14", 3, "81%", "58%", 0.14, 11, "-4s", true),
  speck("d15", 2, "86%", "14%", 0.42, 7, "-1s", false),
  speck("d16", 2, "92%", "48%", 0.2, 9, "-6s", true),
  speck("d17", 3, "16%", "84%", 0.11, 12, "-2s", false),
  speck("d18", 2, "44%", "88%", 0.34, 8, "-5s", true),
];

const TABS = ["gyre", "ethereal", "skimmer"] as const;
type ShowcaseTab = (typeof TABS)[number];
const TAB_MS = 7000;

export function HeroBanner() {
  const [activeTab, setActiveTab] = useState<ShowcaseTab>("gyre");
  const [motionOk, setMotionOk] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setMotionOk(!media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const showNext = () => {
    setActiveTab((current) => TABS[(TABS.indexOf(current) + 1) % TABS.length]);
  };

  return (
    <div className="relative overflow-hidden bg-slate-950 text-white pt-8 pb-16 lg:py-24 border-b border-blue-900/30">
      {/* Background glowing ocean imagery & gradient overlays */}
      <div className="absolute inset-0 z-0 opacity-40 mix-blend-screen pointer-events-none">
        <img
          src="https://vibe.filesafe.space/1789478205437100025/assets/0c43d19f-5cc3-4e2f-98c8-d46edd6eb376.png"
          alt="Aquarium background"
          className="w-full h-full object-cover object-center scale-105 filter blur-xs"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-blue-950/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
      </div>

      {/* Futuristic glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="hero-bokeh" aria-hidden>
        {FLARES.map((speck) => (
          <span key={speck.key} className="flare" style={speck.style} />
        ))}
        {DUST.map((speck) => (
          <span key={speck.key} className="dust" style={speck.style} />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Hero Copy */}
          <div className="lg:col-span-7 space-y-6">
            {/* UK Distributor Badge */}
            <p className="text-sm font-semibold tracking-wide text-cyan-300">
              Official UK Distributor & Technical Centre
            </p>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Take Your Aquarium to the{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(56,189,248,0.3)]">
                Next Level
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 font-normal max-w-2xl leading-relaxed">
              Experience the revolutionary patented{" "}
              <strong className="text-cyan-300">Gyre Cross-Flow technology</strong>, ultra-spectrum
              LED lighting, and smart cloud-connected reef controllers. Redesigned for maximum
              performance, whisper-quiet operation, and vivid aquatic life.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#products"
                onClick={scrollToProductRange}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-slate-950 font-bold text-sm hover:scale-[1.02] transition-all duration-200"
              >
                Latest product range
                <ArrowRight className="w-4 h-4" />
              </a>

              <Link
                to="/stockists"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900/80 text-cyan-300 font-semibold text-sm border border-cyan-500/30 hover:bg-slate-800/90 hover:border-cyan-400/60 transition-all duration-200"
              >
                <Building2 className="w-4 h-4 text-cyan-400" />
                Find a stockist
              </Link>
            </div>

            {/* Trust Highlights Grid */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/80">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-cyan-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">UK Warranty</div>
                  <div className="text-[11px] text-slate-400">Direct UK support</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Award className="w-8 h-8 text-cyan-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">Patented Tech</div>
                  <div className="text-[11px] text-slate-400">Gyre & Dual-Wheel</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Radio className="w-8 h-8 text-cyan-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">Syna-G Cloud</div>
                  <div className="text-[11px] text-slate-400">Smart App Control</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Product Showcase Interactive Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl p-0.5 bg-gradient-to-b from-cyan-500/40 via-blue-600/20 to-slate-800/60 shadow-2xl shadow-cyan-950/80 backdrop-blur-2xl">
              <div className="rounded-[22px] bg-slate-950/85 backdrop-blur-xl p-6 space-y-6">
                {/* Product Switcher Pills */}
                <div className="flex items-center justify-between p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <button
                    onClick={() => setActiveTab("gyre")}
                    className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all ${
                      activeTab === "gyre"
                        ? "bg-cyan-500 text-slate-950 shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Gyre 300 CE
                  </button>
                  <button
                    onClick={() => setActiveTab("ethereal")}
                    className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all ${
                      activeTab === "ethereal"
                        ? "bg-cyan-500 text-slate-950 shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Ethereal LED
                  </button>
                  <button
                    onClick={() => setActiveTab("skimmer")}
                    className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all ${
                      activeTab === "skimmer"
                        ? "bg-cyan-500 text-slate-950 shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Aeraqua Duo
                  </button>
                </div>

                {/* Active Tab Showcase Content */}
                {activeTab === "gyre" && (
                  <div key={activeTab} className="space-y-4">
                    <Link
                      to="/product/$slug"
                      params={{ slug: SHOWCASE.gyre.slug }}
                      className="relative block h-56 rounded-2xl bg-slate-950 overflow-hidden group"
                    >
                      <img
                        src={SHOWCASE.gyre.image}
                        alt={SHOWCASE.gyre.alt}
                        className="hero-photo-in w-full h-full object-contain"
                      />
                      <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 px-2.5 py-1 rounded-md border border-cyan-400/30">
                        Cloud Edition
                      </span>
                    </Link>

                    <div className="hero-copy-in">
                      <h3 className="text-xl font-bold text-white flex items-center justify-between">
                        <Link
                          to="/product/$slug"
                          params={{ slug: SHOWCASE.gyre.slug }}
                          className="hover:text-cyan-300 transition-colors"
                        >
                          Maxspect Gyre 300 Cloud Edition
                        </Link>
                        <span className="text-xs font-mono text-cyan-400">Gen 4 Tech</span>
                      </h3>
                      <p className="text-xs text-slate-300 mt-1">
                        Cross-flow water motion technology eliminates dead spots in reef aquariums
                        with multi-directional flow directors.
                      </p>
                    </div>

                    <div className="hero-copy-in space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-300" style={{ animationDelay: "140ms" }}>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>Cloud control via Syna-G Cloud Mobile App</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>Advanced flow cages with customizable directional vanes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>Ultra-quiet Sine Wave motor driver technology</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "ethereal" && (
                  <div key={activeTab} className="space-y-4">
                    <Link
                      to="/product/$slug"
                      params={{ slug: SHOWCASE.ethereal.slug }}
                      className="relative block h-56 rounded-2xl bg-slate-950 overflow-hidden group"
                    >
                      <img
                        src={SHOWCASE.ethereal.image}
                        alt={SHOWCASE.ethereal.alt}
                        className="hero-photo-in w-full h-full object-contain"
                      />
                      <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider bg-slate-950/85 text-blue-200 px-2.5 py-1 rounded-md border border-blue-400/40">
                        Full Spectrum
                      </span>
                    </Link>

                    <div className="hero-copy-in">
                      <h3 className="text-xl font-bold text-white flex items-center justify-between">
                        <Link
                          to="/product/$slug"
                          params={{ slug: SHOWCASE.ethereal.slug }}
                          className="hover:text-cyan-300 transition-colors"
                        >
                          Ethereal Infinite LED System
                        </Link>
                        <span className="text-xs font-mono text-cyan-400">RGB+UV Spectrum</span>
                      </h3>
                      <p className="text-xs text-slate-300 mt-1">
                        Ultra-slim profile marine LED lighting module engineered to maximize SPS/LPS
                        coral coloration & growth.
                      </p>
                    </div>

                    <div className="hero-copy-in space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-300" style={{ animationDelay: "140ms" }}>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>Smart temperature-controlled silent cooling fan</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>Integrated reflector matrix for deep tank light penetration</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>Pre-set photoperiod modes for realistic lunar cycles</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "skimmer" && (
                  <div key={activeTab} className="space-y-4">
                    <Link
                      to="/product/$slug"
                      params={{ slug: SHOWCASE.skimmer.slug }}
                      className="relative block h-56 rounded-2xl bg-white overflow-hidden group"
                    >
                      <img
                        src={SHOWCASE.skimmer.image}
                        alt={SHOWCASE.skimmer.alt}
                        className="hero-photo-in w-full h-full object-contain p-2"
                      />
                      <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider bg-slate-950/85 text-emerald-200 px-2.5 py-1 rounded-md border border-emerald-400/40">
                        Dual Needle Wheel
                      </span>
                    </Link>

                    <div className="hero-copy-in">
                      <h3 className="text-xl font-bold text-white flex items-center justify-between">
                        <Link
                          to="/product/$slug"
                          params={{ slug: SHOWCASE.skimmer.slug }}
                          className="hover:text-cyan-300 transition-colors"
                        >
                          Aeraqua Duo Protein Skimmer
                        </Link>
                        <span className="text-xs font-mono text-cyan-400">Patented Design</span>
                      </h3>
                      <p className="text-xs text-slate-300 mt-1">
                        World's first dual-intake dual-needle wheel protein skimmer powered by
                        Turbine Duo DC pump technology.
                      </p>
                    </div>

                    <div className="hero-copy-in space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-300" style={{ animationDelay: "140ms" }}>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>Space-saving internal footprint with zero overflow sensor</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>Precision water level dial control for ultra-fine tuning</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>Near silent operation with integrated air silencer</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <Link
                    to="/product/$slug"
                    params={{ slug: SHOWCASE[activeTab].slug }}
                    className="relative w-full flex items-center justify-center gap-2 overflow-hidden py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors"
                  >
                    <span
                      key={activeTab}
                      aria-hidden
                      className="absolute inset-0 origin-left bg-cyan-600"
                      style={
                        motionOk
                          ? {
                            animation: `hero-tab-progress ${TAB_MS}ms linear forwards`,
                            }
                          : { transform: "scaleX(0)" }
                      }
                      onAnimationEnd={(event) => {
                        if (event.animationName !== "hero-tab-progress" || !motionOk) return;
                        if (event.elapsedTime < TAB_MS / 1000 - 0.05) return;
                        showNext();
                      }}
                    />
                    <span className="relative">View Full Technical Specifications</span>
                    <ExternalLink className="relative w-3.5 h-3.5 text-cyan-300" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
