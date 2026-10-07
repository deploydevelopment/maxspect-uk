/* ------------------------------------------------------------------ */
/*  Share a setup, and send buyers to a local stockist                 */
/* ------------------------------------------------------------------ */

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Share2, X, Check, Store, Facebook, Twitter, Link2, MessageCircle } from "lucide-react";
import type { ControllerConfig, PumpConfig } from "@/lib/tank-flow-helpers";

interface PurchaseShareProps {
  controllers: ControllerConfig[];
  pumps: PumpConfig[];
  length: number;
  width: number;
  height: number;
  livestock: string;
  rockwork: string;
  substrate: string;
  glass: string;
}

export function TankPurchaseShare(props: PurchaseShareProps) {
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap justify-end">
        <Link
          to="/stockists"
          title="Find a local store for this setup. If there isn't one nearby, contact us and we can help."
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-cyan-300 bg-cyan-500/10 border border-cyan-400/30 hover:bg-cyan-500/20 hover:text-cyan-200 transition-colors shrink-0"
        >
          <Store className="w-3.5 h-3.5" /> Find a stockist
        </Link>
        <button
          onClick={() => setShareOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-violet-300 bg-violet-500/10 border border-violet-400/30 hover:bg-violet-500/20 hover:text-violet-200 transition-colors shrink-0"
        >
          <Share2 className="w-3.5 h-3.5" /> Share
        </button>
      </div>

      {shareOpen && <ShareModal {...props} onClose={() => setShareOpen(false)} />}
    </>
  );
}

function ShareModal({
  controllers,
  pumps,
  length,
  width,
  height,
  livestock,
  rockwork,
  substrate,
  glass,
  onClose,
}: PurchaseShareProps & { onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const shareUrl = "https://maxspect-uk.vibepreview.app/flow-simulator";

  const socials = [
    {
      label: "Facebook",
      icon: <Facebook className="w-5 h-5" />,
      colour: "bg-[#1877F2]/15 border-[#1877F2]/40 text-[#1877F2] hover:bg-[#1877F2]/25",
    },
    {
      label: "X / Twitter",
      icon: <Twitter className="w-5 h-5" />,
      colour: "bg-slate-700/30 border-slate-600/40 text-slate-300 hover:bg-slate-700/50",
    },
    {
      label: "WhatsApp",
      icon: <MessageCircle className="w-5 h-5" />,
      colour: "bg-[#25D366]/15 border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/25",
    },
  ];

  const copyLink = () => {
    navigator.clipboard?.writeText(shareUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ModalShell
      onClose={onClose}
      icon={<Share2 className="w-5 h-5 text-violet-400" />}
      title="Share My Setup"
    >
      <div className="space-y-4">
        <div className="rounded-xl bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-400/20 p-4 space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-violet-300 font-bold">
            Maxspect UK · Tank Flow Simulator
          </div>
          <div className="text-sm font-bold text-white">My Gyre Tank Setup</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-400">
            <span>
              Tank: {length}×{width}×{height} cm
            </span>
            <span>Livestock: {livestock}</span>
            <span>Controllers: {controllers.length}</span>
            <span>Rockwork: {rockwork}</span>
            <span>Gyre pumps: {pumps.length}</span>
            <span>Glass: {glass}</span>
            <span>Substrate: {substrate}</span>
          </div>
        </div>

        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Share to</div>
          <div className="grid grid-cols-3 gap-2">
            {socials.map((s) => (
              <button
                key={s.label}
                onClick={() => {}}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-[10px] font-semibold transition-colors ${s.colour}`}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
            Or copy the link
          </div>
          <div className="flex gap-2">
            <div className="flex-1 px-3 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400 truncate font-mono">
              {shareUrl}
            </div>
            <button
              onClick={copyLink}
              className={`px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                copied
                  ? "bg-emerald-500/20 border border-emerald-400/40 text-emerald-300"
                  : "bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Copied
                </>
              ) : (
                <>
                  <Link2 className="w-3.5 h-3.5" /> Copy
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-[10px] text-slate-600 text-center">
          Sharing is for demonstration purposes only — no data is posted in this demo.
        </p>
      </div>
    </ModalShell>
  );
}

function ModalShell({
  onClose,
  icon,
  title,
  children,
}: {
  onClose: () => void;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-md max-h-[88vh] overflow-y-auto bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between gap-2 p-4 border-b border-slate-800 sticky top-0 bg-slate-950/95 backdrop-blur z-10">
          <div className="flex items-center gap-2.5">
            {icon}
            <h3 className="text-sm font-bold text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
