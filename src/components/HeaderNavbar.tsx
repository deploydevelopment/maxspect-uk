import React, { useEffect, useMemo, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, Search, Phone, Mail, Menu, X, ArrowRight, User, ShoppingBag } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { contact } from "@/lib/contact";
import { getSparesShop } from "@/lib/spares.functions";
import type { SupplyGroup, SupplySpare } from "@/lib/supply-engine.types";

export interface NavCategory {
  title: string;
  subtitle: string;
  id: string;
  rangeSlug: string;
  items: {
    name: string;
    desc: string;
    image: string;
    href: string;
  }[];
}

const CATEGORIES: NavCategory[] = [
  {
    title: "Innovate Series",
    subtitle: "Cutting-edge FLAGSHIP Technology",
    id: "innovate",
    rangeSlug: "innovate-series",
    items: [
      {
        name: "Gyre 300 Cloud Edition",
        desc: "Multi-directional water flow with Cloud control",
        href: "/product/gyre-300-cloud-edition",
        image:
          "/media/images/Products/Innovate/gyre-300-ce/Gyre_300_CE_mainpic.png",
      },
      {
        name: "Gyre 300 Series",
        desc: "XF330 and XF350 sine-wave gyre pumps",
        href: "/product/gyre-300-series",
        image:
          "/media/images/Products/Innovate/gyre-300-ce/Gyre_300_CE_mainpic.png",
      },
      {
        name: "Aeraqua Duo Skimmer",
        desc: "Dual-inlet patented dual-wheel protein skimmer",
        href: "/product/aeraqua-duo-protein-skimmer",
        image:
          "/media/images/Products/Innovate/innovate-aeraqua-skimmer/360/3.jpg",
      },
      {
        name: "Turbine Duo Pump",
        desc: "Dual output ultra-quiet DC return pump",
        href: "/product/turbine-duo",
        image:
          "/media/images/Products/Innovate/turbine-duo/TD.png",
      },
      {
        name: "Ethereal Infinite LED",
        desc: "Next-gen spectrum full matrix marine lighting",
        href: "/range/ethereal",
        image:
          "/media/images/Products/Innovate/ethereal%20infinite/frontpage111.jpg",
      },
      {
        name: "RSX Marine LED",
        desc: "Aerospace-grade aluminum body high-intensity fixture",
        href: "/product/rsx",
        image:
          "/media/images/Products/Innovate/rsx-marine/R5.png",
      },
    ],
  },
  {
    title: "Jump Series",
    subtitle: "High Performance for Every Hobbyist",
    id: "jump",
    rangeSlug: "jump-series",
    items: [
      {
        name: "MJ-L LED Lights",
        desc: "L260, L290, and L230 lighting systems",
        href: "/range/mj-l-led",
        image:
          "/media/images/Products/Jump/MJL.webp",
      },
      {
        name: "MJ-SK Gen 2 Skimmers",
        desc: "Fully adjustable precision water inlet skimmer",
        href: "/product/mj-sk-gen-2",
        image:
          "/media/images/Products/Jump/MJ-SKSeries/sk2000.jpg",
      },
      {
        name: "MJ-GF Gyre Pumps",
        desc: "Cross-flow technology with customizable modes",
        href: "/product/mj-gf",
        image:
          "/media/images/Products/Jump/MJGF308316/308thumb.png",
      },
      {
        name: "MJ-DC Return Pump",
        desc: "Compact, efficient variable speed DC flow pump",
        href: "/product/mj-dc",
        image:
          "/media/images/Products/Jump/MJ-DC/DC.png",
      },
    ],
  },
  {
    title: "Smart Aquarium",
    subtitle: "All-in-One Intelligent Systems",
    id: "smart",
    rangeSlug: "smart-aquarium",
    items: [
      {
        name: "DICE Pico 2 AIO",
        desc: "Integrated intelligent nano desktop reef tank",
        href: "/product/dice-pico-2",
        image:
          "/media/images/Products/Innovate/dice-pico-2-aio/Pico_Cube_2G-Ann-20230919-500-500_4_25.png",
      },
      {
        name: "Lagoon Series Aquarium",
        desc: "Lagoon systems, with specification pages for each size",
        href: "/range/lagoon-series",
        image:
          "/media/images/Products/SmartAquarium/Lagoon/lagoon150.jpg",
      },
      {
        name: "DICE Nano Cube AIO",
        desc: "Ultra-clear rimless glass with concealed filtration",
        href: "/product/dice-nano",
        image:
          "/media/images/Products/SmartAquarium/dice40/dice40-pearl.webp",
      },
      {
        name: "Reef Ready Series",
        desc: "Pre-drilled high clarity marine aquarium setup",
        href: "/product/reef-ready",
        image:
          "/media/images/Products/Innovate/reefready/reefreadyfront.jpg",
      },
    ],
  },
  {
    title: "Nano-Tech & Bio\u2011Media",
    subtitle: "Advanced Biological Filtration",
    id: "biomedia",
    rangeSlug: "nano-tech-bio-media",
    items: [
      {
        name: "Bio-Sphere / Block / Cubelet",
        desc: "Ultra-high surface area inert ceramic filtration matrix",
        href: "/product/bio-sphere-bio-block-bio-cubelet",
        image:
          "/media/images/Products/Nano-tech/cubelets/biomedia3in1.jpg",
      },
      {
        name: "Nano-Tech Phosphree",
        desc: "Rapid phosphate remover media for crystal clear water",
        href: "/product/nano-tech-phosphree",
        image:
          "/media/images/Products/Nano-tech/phosphree/p005.jpg",
      },
      {
        name: "Bio-Sand Substrate",
        desc: "Pre-inoculated live bacterial aragonite substrate",
        href: "/product/bio-sand",
        image:
          "/media/images/Products/Nano-tech/bio-sand/biosand6.webp",
      },
      {
        name: "Nano-Tech Clear Cube",
        desc: "Polishes water and breaks down dissolved organic waste",
        href: "/product/nano-tech-clear-cube",
        image:
          "/media/images/Products/Nano-tech/clearcube/Clear_Cube.png",
      },
    ],
  },
];

export function HeaderNavbar() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const stockistsCurrent = pathname === "/stockists" || pathname.startsWith("/become-a-stockist");
  const sparesCurrent = pathname === "/spares" || pathname.startsWith("/spares/");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [spares, setSpares] = useState<SupplySpare[] | null>(null);
  const [spareGroups, setSpareGroups] = useState<SupplyGroup[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const basketCount = 0;

  useEffect(() => {
    // Shrinking the header moves the page. Without this, the browser pulls
    // scroll position back across the threshold and the bar flips again.
    const root = document.documentElement;
    const previousAnchor = root.style.overflowAnchor;
    root.style.overflowAnchor = "none";

    let collapsed = window.scrollY > 96;
    setScrolled(collapsed);
    const onScroll = () => {
      const y = window.scrollY;
      const next = collapsed ? y > 8 : y > 96;
      if (next === collapsed) return;
      collapsed = next;
      setScrolled(next);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      root.style.overflowAnchor = previousAnchor;
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!searchOpen || spares) return;
    let cancelled = false;
    getSparesShop()
      .then((shop) => {
        if (cancelled) return;
        setSpares(shop.products);
        setSpareGroups(shop.groups);
      })
      .catch(() => {
        if (!cancelled) setSpares([]);
      });
    return () => {
      cancelled = true;
    };
  }, [searchOpen, spares]);

  const allItems = useMemo(
    () => CATEGORIES.flatMap((c) => c.items.map((i) => ({ ...i, category: c.title }))),
    [],
  );
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const products = allItems.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.desc.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q),
    );
    const groupName = new Map(spareGroups.map((group) => [group.id, group.name]));
    const parts = (spares ?? [])
      .filter((part) => {
        const groups = part.groupIds.map((id) => groupName.get(id) ?? "").join(" ");
        return [part.name, part.sku, part.brand, part.description, groups]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .map((part) => ({
        name: part.name,
        desc: [part.sku, part.description].filter(Boolean).join(" · "),
        image: part.thumbnail || part.image || "/holding.jpg",
        href: `/spares/${part.id}`,
        category: "Spares",
      }));
    return [...products, ...parts];
  }, [searchQuery, allItems, spares, spareGroups]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/85 backdrop-blur-xl transition-all [overflow-anchor:none]">
      {/* Top bar — same links as maxspect.co.uk. Collapses once the page scrolls. */}
      <div
        className={`relative z-20 grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          scrolled ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
        }`}
      >
        <div className={scrolled ? "overflow-hidden" : "overflow-visible"}>
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-cyan-900 text-xs text-blue-100 py-1.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <ul className="flex items-center gap-4">
            <li>
              <a
                href={`tel:${contact.phone.tel}`}
                className="hover:text-white transition-colors flex items-center gap-1.5"
              >
                <Phone className="w-3 h-3 text-cyan-400" />
                {contact.phone.display}
              </a>
            </li>
            <li>
              <a
                href="https://maxspect.co.uk/contact/"
                className="hover:text-white transition-colors flex items-center gap-1.5"
              >
                <Mail className="w-3 h-3 text-cyan-400" />
                Send us an email
              </a>
            </li>
          </ul>

          <ul className="flex items-center gap-4">
            <li className="relative group">
              <a
                href="#"
                onClick={(event) => event.preventDefault()}
                className="hover:text-white transition-colors flex items-center gap-1.5"
                aria-haspopup="true"
              >
                <User className="w-3 h-3 text-cyan-400" />
                Account
              </a>
              <div className="absolute right-0 top-full pt-2 hidden group-hover:block group-focus-within:block z-50">
                <div className="w-max rounded-lg bg-slate-900 border border-slate-700 py-1 text-slate-200">
                  <a
                    href="#"
                    onClick={(event) => event.preventDefault()}
                    className="block px-3 py-1.5 hover:text-cyan-300 hover:bg-slate-800 whitespace-nowrap"
                  >
                    Log in
                  </a>
                  <a
                    href="#"
                    onClick={(event) => event.preventDefault()}
                    className="block px-3 py-1.5 hover:text-cyan-300 hover:bg-slate-800 whitespace-nowrap"
                  >
                    Create account
                  </a>
                </div>
              </div>
            </li>
            <li>
              <a
                href="#"
                onClick={(event) => event.preventDefault()}
                className="hover:text-white transition-colors flex items-center gap-1.5"
              >
                <ShoppingBag className="w-3 h-3 text-cyan-400" />
                Basket
                {basketCount > 0 && (
                  <span className="text-cyan-300 font-semibold">{basketCount}</span>
                )}
              </a>
            </li>
          </ul>
        </div>
      </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div
          className={`flex items-center justify-between transition-[height] duration-300 ${
            scrolled ? "h-16" : "h-20"
          }`}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <img
              src={
                scrolled
                  ? "/media/images/logo/logomaxspect-web-sm.png"
                  : "/media/images/logo/logomaxspect-web-thin.png"
              }
              alt="Maxspect Logo"
              className={`w-auto object-contain brightness-110 drop-shadow-[0_0_12px_rgba(56,189,248,0.4)] group-hover:drop-shadow-[0_0_18px_rgba(56,189,248,0.6)] transition-all duration-300 ${
                scrolled ? "h-10" : "h-[60px]"
              }`}
            />
          </Link>

          {/* Navigation Links - Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                className="relative"
                onMouseEnter={() => setActiveMenu(cat.id)}
                onMouseLeave={() => setActiveMenu(null)}
              >
                <Link
                  to="/range/$slug"
                  params={{ slug: cat.rangeSlug }}
                  onClick={() => setActiveMenu(null)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium transition-colors ${
                    activeMenu === cat.id || pathname === `/range/${cat.rangeSlug}`
                      ? "text-cyan-400"
                      : "text-slate-200 hover:text-cyan-400"
                  }`}
                >
                  {cat.title}
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 text-cyan-400/80 ${activeMenu === cat.id ? "rotate-180" : ""}`}
                  />
                </Link>

                {/* Dropdown / Mega Menu */}
                {activeMenu === cat.id && (
                  <div className="absolute top-full left-0 w-[540px] pt-2 z-50">
                    <div className="p-4 rounded-2xl bg-slate-900/95 border border-cyan-500/30 shadow-2xl shadow-cyan-950/80 backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                        <div>
                          <Link
                            to="/range/$slug"
                            params={{ slug: cat.rangeSlug }}
                            onClick={() => setActiveMenu(null)}
                            className="text-sm font-bold text-white hover:text-cyan-300"
                          >
                            {cat.title}
                          </Link>
                          <p className="text-xs text-slate-400">{cat.subtitle}</p>
                        </div>
                        <Link
                          to="/range/$slug"
                          params={{ slug: cat.rangeSlug }}
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                        >
                          View All <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {cat.items.map((item, idx) => (
                          <a
                            key={idx}
                            href={item.href}
                            className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-blue-950/50 border border-transparent hover:border-cyan-500/20 transition-all group/item"
                          >
                            <div className="relative w-8 h-8 rounded-md bg-white border border-slate-800 shrink-0 overflow-hidden group-hover/item:border-cyan-400/40 transition-colors">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="absolute inset-0 h-full w-full object-cover"
                                style={{ transform: "scale(2.2)" }}
                              />
                            </div>
                            <div>
                              <span className="text-xs font-semibold text-slate-100 group-hover/item:text-cyan-300 transition-colors line-clamp-1">
                                {item.name}
                              </span>
                              <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                                {item.desc}
                              </p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div
              className="relative"
              onMouseEnter={() => setActiveMenu("stockists")}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <button
                type="button"
                onClick={() => setActiveMenu(activeMenu === "stockists" ? null : "stockists")}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium transition-colors ${
                  activeMenu === "stockists" || stockistsCurrent
                    ? "text-cyan-400"
                    : "text-slate-200 hover:text-cyan-400"
                }`}
              >
                Stockists
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 text-cyan-400/80 ${activeMenu === "stockists" ? "rotate-180" : ""}`}
                />
              </button>
              {activeMenu === "stockists" && (
                <div className="absolute top-full left-0 w-56 pt-2 z-50">
                  <div className="p-2 rounded-2xl bg-slate-900/95 border border-cyan-500/30 shadow-2xl shadow-cyan-950/80 backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <Link
                      to="/stockists"
                      onClick={() => setActiveMenu(null)}
                      className={`block px-3 py-2 text-sm transition-colors ${
                        pathname === "/stockists"
                          ? "text-cyan-400"
                          : "text-slate-200 hover:text-cyan-400"
                      }`}
                    >
                      Find a stockist
                    </Link>
                    <Link
                      to="/become-a-stockist"
                      onClick={() => setActiveMenu(null)}
                      className={`block px-3 py-2 text-sm transition-colors ${
                        pathname.startsWith("/become-a-stockist")
                          ? "text-cyan-400"
                          : "text-slate-200 hover:text-cyan-400"
                      }`}
                    >
                      Become a stockist
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <Link
              to="/spares"
              className={`px-3.5 py-2 text-sm font-medium transition-colors ${
                sparesCurrent ? "text-cyan-400" : "text-slate-200 hover:text-cyan-400"
              }`}
            >
              Parts & Spares
            </Link>
          </nav>

          {/* Quick Actions */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden lg:flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 border border-slate-700/60 text-slate-200 hover:text-cyan-400 hover:border-cyan-400/50 hover:bg-blue-950/50 transition-all"
            aria-label="Search products and parts"
          >
            <Search className="w-4.5 h-4.5" />
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="md:hidden p-2 rounded-lg bg-slate-900 text-slate-200 hover:text-white border border-slate-800"
          >
            {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/98 p-4 space-y-4 animate-in slide-in-from-top-4 duration-200">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          <div className="space-y-3">
            {CATEGORIES.map((cat) => (
              <div key={cat.id} className="border-b border-slate-800/80 pb-3">
                <Link
                  to="/range/$slug"
                  params={{ slug: cat.rangeSlug }}
                  onClick={() => setIsMobileOpen(false)}
                  className="block font-bold text-cyan-400 text-sm mb-2 hover:text-cyan-300"
                >
                  {cat.title}
                </Link>
                <div className="grid grid-cols-1 gap-2 pl-2">
                  {cat.items.map((item, idx) => (
                    <a
                      key={idx}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className="flex items-center gap-2 text-xs text-slate-300 hover:text-white py-1"
                    >
                      <span className="relative w-6 h-6 shrink-0 overflow-hidden rounded bg-white">
                        <img
                          src={item.image}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover"
                          style={{ transform: "scale(2.2)" }}
                        />
                      </span>
                      <span>{item.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/stockists"
              onClick={() => setIsMobileOpen(false)}
              className="w-full text-center py-2 text-sm font-semibold rounded-lg bg-slate-900 text-cyan-300 border border-cyan-500/30"
            >
              Find a stockist
            </Link>
            <Link
              to="/become-a-stockist"
              onClick={() => setIsMobileOpen(false)}
              className="w-full text-center py-2 text-sm font-semibold rounded-lg bg-slate-900 text-slate-100 border border-slate-700"
            >
              Become a stockist
            </Link>
            <a
              href="#support"
              className="w-full text-center py-2 text-sm font-semibold rounded-lg bg-cyan-500 text-slate-950"
            >
              UK Support & Warranty Portal
            </a>
          </div>
        </div>
      )}

      {/* Search Sheet - slides in from the right */}
      <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
        <SheetContent
          side="right"
          className="flex h-full w-full flex-col gap-0 overflow-hidden sm:max-w-md bg-slate-950 border-l border-cyan-500/30 text-slate-100 p-0"
        >
          <SheetHeader className="shrink-0 px-6 pt-6 pb-4 border-b border-slate-800">
            <SheetTitle className="text-cyan-400 text-lg font-bold">
              Search Maxspect
            </SheetTitle>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col px-6 pt-5 w-full">
            <div className="relative">
              <input
                type="text"
                autoFocus
                placeholder="Search products, parts, and spares..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700/60 text-sm text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
              />
              <Search className="w-4.5 h-4.5 text-slate-400 absolute left-4 top-3.5" />
            </div>

            <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
              {searchQuery.trim() === "" ? (
                <img
                  src="/ethereal-lineart.png"
                  alt=""
                  className="mt-20 mx-auto w-[78%] h-auto object-contain opacity-15 pointer-events-none select-none"
                />
              ) : searchResults.length === 0 ? (
                <div className="text-center text-slate-500 text-sm py-8">
                  {spares === null
                    ? "Searching parts…"
                    : `No products or parts found for "${searchQuery}"`}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 pr-1 pb-5">
                  {searchResults.map((item, idx) => (
                    <a
                      key={idx}
                      href={item.href}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-stretch gap-3 overflow-hidden rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 hover:bg-blue-950/40 transition-all group/item"
                    >
                      <div className="relative w-20 shrink-0 self-stretch bg-white">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="absolute inset-0 w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 py-3 pr-3">
                        <span className="block text-sm font-semibold text-slate-100 group-hover/item:text-cyan-300 transition-colors line-clamp-1">
                          {item.name}
                        </span>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{item.desc}</p>
                        <span className="text-[10px] text-cyan-400/70 font-medium uppercase tracking-wide">
                          {item.category}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
