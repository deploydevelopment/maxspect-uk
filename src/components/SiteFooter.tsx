import React from "react";
import { Link } from "@tanstack/react-router";
import { Phone, ExternalLink } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <img
              src="/media/images/logo/logomaxspect-web-sm.png"
              alt="Maxspect"
              className="h-14 w-auto object-contain brightness-0 invert"
            />

            <address className="not-italic text-slate-300 text-xs leading-relaxed space-y-0.5">
              <p className="font-semibold text-white">BCUK Aquatics Limited</p>
              <p>Unit 2-3, Warwick Road</p>
              <p>Fairfield Ind. Est.</p>
              <p>Louth, Lincolnshire</p>
              <p>LN11 0YB</p>
            </address>

            <a
              href="tel:+441507600477"
              className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              +44(0)1507 600477
            </a>
          </div>

          {/* Product Series */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Product Series
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <Link
                  to="/range/$slug"
                  params={{ slug: "innovate-series" }}
                  className="hover:text-cyan-300 transition-colors"
                >
                  Innovate Series
                </Link>
              </li>
              <li>
                <Link
                  to="/range/$slug"
                  params={{ slug: "jump-series" }}
                  className="hover:text-cyan-300 transition-colors"
                >
                  Jump Series
                </Link>
              </li>
              <li>
                <Link
                  to="/range/$slug"
                  params={{ slug: "professional-series" }}
                  className="hover:text-cyan-300 transition-colors"
                >
                  Professional Series
                </Link>
              </li>
              <li>
                <Link
                  to="/range/$slug"
                  params={{ slug: "smart-aquarium" }}
                  className="hover:text-cyan-300 transition-colors"
                >
                  Smart Aquarium
                </Link>
              </li>
              <li>
                <Link
                  to="/range/$slug"
                  params={{ slug: "nano-tech-bio-media" }}
                  className="hover:text-cyan-300 transition-colors"
                >
                  Nano-Tech Bio-Media
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">UK Support</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <Link to="/manuals" className="hover:text-cyan-300 transition-colors">
                  Product Manuals (PDF)
                </Link>
              </li>
              <li>
                <Link to="/" hash="support" className="hover:text-cyan-300 transition-colors">
                  Syna-G Mobile Apps
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-cyan-300 transition-colors">
                  Warranty Registration
                </Link>
              </li>
              <li>
                <Link to="/stockists" className="hover:text-cyan-300 transition-colors">
                  Find UK Stockists
                </Link>
              </li>
            </ul>
          </div>

          {/* Global Languages & Patents */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Patents & Legal
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <a
                  href="https://maxspect.com/en/press-releases-patents/us-patents-footer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-300 transition-colors flex items-center gap-1"
                >
                  US Patents <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://maxspect.com/en/press-releases-patents/european-patents-footer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-300 transition-colors flex items-center gap-1"
                >
                  European Patents <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-cyan-300 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="hover:text-cyan-300 transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-cyan-300 transition-colors">
                  Terms of Use
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Sub-footer Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 text-center text-[11px] text-slate-500">
          © {new Date().getFullYear()} BCUK Aquatics Limited.
        </div>
      </div>
    </footer>
  );
}
