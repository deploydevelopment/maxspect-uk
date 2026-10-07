import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  FileText,
  Smartphone,
  CheckCircle,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { contact } from "@/lib/contact";

const UK_HUB_BACKGROUND =
  "/media/images/Products/Innovate/ethereal%20infinite/rgb_ethereal3.webp";

export function UkDistributorSection() {
  const [inquiryType, setInquiryType] = useState("trade");
  const [formSubmitted, setFormSubmitted] = useState(false);
  const hubRef = useRef<HTMLDivElement>(null);
  const hubBgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hub = hubRef.current;
    const bg = hubBgRef.current;
    if (!hub || !bg) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let rafId = 0;
    const update = () => {
      const rect = hub.getBoundingClientRect();
      const viewport = window.innerHeight;
      if (rect.bottom < 0 || rect.top > viewport) return;
      const centerOffset = rect.top + rect.height / 2 - viewport / 2;
      const travel = rect.height * 0.12;
      const y = Math.max(-travel, Math.min(travel, -centerOffset * 0.15));
      bg.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
    };
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    toast.success("Thank you! Your UK distributor inquiry has been sent to our team.");
  };

  return (
    <section
      id="uk-distributor"
      ref={hubRef}
      className="scroll-mt-24 bg-slate-900 text-white relative overflow-clip [overflow-anchor:none] border-b border-blue-950"
    >
      <div
        className="pointer-events-none absolute inset-0 overflow-clip [contain:paint]"
        aria-hidden="true"
      >
        <div
          ref={hubBgRef}
          className="absolute inset-x-0 -top-[15%] h-[130%] bg-cover bg-center grayscale brightness-[0.55] will-change-transform"
          style={{ backgroundImage: `url("${UK_HUB_BACKGROUND}")` }}
        />
        <div className="absolute inset-0 bg-[#071426]/85" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <p className="text-xs font-bold tracking-wide text-cyan-300">
                Official United Kingdom Representative
              </p>

              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Maxspect UK Distributor & <span className="text-cyan-400">Technical Hub</span>
              </h2>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-3xl">
                As the official UK importer and distributor of Maxspect marine products, we provide
                authorised aquatic retailers, aquascapers, and public aquariums across England,
                Scotland, Wales, and Northern Ireland with direct wholesale access, localized
                warranty servicing, and next-day spare parts dispatch.
              </p>

              <div className="flex flex-wrap gap-4 pt-2 text-xs">
                <div className="flex items-center gap-2 bg-slate-950/20 backdrop-blur-xl px-3.5 py-2 rounded-xl border border-slate-700/30 text-slate-200">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>Same-Day Dispatch for UK Retailers</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-950/20 backdrop-blur-xl px-3.5 py-2 rounded-xl border border-slate-700/30 text-slate-200">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Authorised UK Service & Repair Workshop</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 bg-slate-950/20 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/30 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Phone className="w-4 h-4 text-cyan-400" /> Direct UK Support Line
              </h3>
              <p className="text-xs text-slate-400">
                Speak directly with our dedicated UK technical support team for product advice or
                trade account setup.
              </p>
              <a
                href={`tel:${contact.phone.tel}`}
                className="text-xl font-mono font-bold text-cyan-300 hover:text-cyan-200 transition-colors"
              >
                {contact.phone.display}
              </a>
              <div className="text-[11px] text-slate-400">{contact.hours}</div>
            </div>
          </div>

        {/* Support Portal & Downloads Grid */}
        <div id="support" className="space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <p className="text-xs font-bold tracking-wide text-cyan-300">
              Support & Resources
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Product Manuals, Apps & Firmware
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Access official documentation, Syna-G Cloud app installation links, and latest
              firmware releases for your Maxspect devices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Manuals */}
            <div className="bg-slate-950/20 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/30 hover:border-cyan-500/40 transition-colors space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-950 border border-blue-800 flex items-center justify-center text-cyan-400">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Product Manuals</h3>
              <p className="text-xs text-slate-400">
                Download step-by-step user guides and wiring diagrams for Gyre 300 CE, Jump Series,
                and Aeraqua skimmers.
              </p>
              <Link
                to="/manuals"
                className="block w-full text-center py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
              >
                View product manuals
              </Link>
            </div>

            {/* Mobile Apps */}
            <div className="bg-slate-950/20 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/30 hover:border-cyan-500/40 transition-colors space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-950 border border-blue-800 flex items-center justify-center text-cyan-400">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Syna-G Cloud Mobile App</h3>
              <p className="text-xs text-slate-400">
                Control your aquarium flow schedules, light spectrums, and pump modes remotely
                anywhere in the world.
              </p>
              <div className="flex gap-2 pt-1">
                <a
                  href="https://apps.apple.com/us/app/syna-g-cloud/id1472134425?l=en&ls=1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center py-2 rounded-xl bg-slate-900 text-xs font-semibold text-slate-200 border border-slate-800 hover:bg-slate-800"
                >
                  iOS
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=com.maxspect.synag.cloud.cn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center py-2 rounded-xl bg-slate-900 text-xs font-semibold text-slate-200 border border-slate-800 hover:bg-slate-800"
                >
                  Android
                </a>
              </div>
            </div>

            {/* Warranty & Registration */}
            <div className="bg-slate-950/20 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/30 hover:border-cyan-500/40 transition-colors space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-950 border border-blue-800 flex items-center justify-center text-cyan-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">UK Warranty Registration</h3>
              <p className="text-xs text-slate-400">
                Register within 30 days of purchase from an authorised stockist to activate your manufacturer warranty.
              </p>
              <Link
                to="/register"
                className="block w-full text-center py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
              >
                Register Product Serial Number
              </Link>
            </div>
          </div>
        </div>

        {/* UK Inquiry / Dealer Contact Form */}
        <div className="space-y-8">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h3 className="text-2xl font-bold text-white">Get in Touch with Maxspect UK</h3>
            <p className="text-xs text-slate-400">
              Whether you are a retailer looking to become an authorised stockist or an end-user
              needing technical help.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-4">
            <div className="flex gap-4 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setInquiryType("trade")}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  inquiryType === "trade" ? "bg-cyan-500 text-slate-950" : "text-slate-400"
                }`}
              >
                UK Retailer / Trade Account
              </button>
              <button
                type="button"
                onClick={() => setInquiryType("support")}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  inquiryType === "support" ? "bg-cyan-500 text-slate-950" : "text-slate-400"
                }`}
              >
                End-User / Customer Support
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Smith"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="john@example.co.uk"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Company / Store Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Reef Aquatics UK"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+44 7123 456789"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Message / Product Inquiry *
              </label>
              <textarea
                rows={4}
                required
                placeholder="How can our UK team help you?"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 transition-all"
            >
              <Send className="w-4 h-4" /> Send Inquiry to UK Team
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
