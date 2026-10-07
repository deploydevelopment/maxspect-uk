import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  getAllProductsForAdmin,
  triggerMaxspectScrape,
  updateProductStatus,
} from "@/lib/catalog.functions";
import { ProductPage } from "@/lib/catalog.types";
import {
  Globe,
  RefreshCw,
  CheckCircle2,
  Clock,
  Eye,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  Layers,
  Lightbulb,
  ArrowRight,
  ShieldCheck,
  FileCheck,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export function ScraperSyncModal({
  open,
  onClose,
  onProductsUpdated,
}: {
  open: boolean;
  onClose: () => void;
  onProductsUpdated: () => void;
}) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [items, setItems] = useState<ProductPage[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState("https://www.maxspect.com/en/");

  const fetchAllFn = useServerFn(getAllProductsForAdmin);
  const triggerScrapeFn = useServerFn(triggerMaxspectScrape);
  const updateStatusFn = useServerFn(updateProductStatus);

  const loadAll = async () => {
    setLoadingItems(true);
    try {
      const data = await fetchAllFn();
      setItems(data);
    } catch (e) {
      toast.error("Failed to load catalog products.");
    } finally {
      setLoadingItems(false);
    }
  };

  const handleOpenModal = () => {
    if (open) {
      loadAll();
    }
  };

  // Run initial load when component mounts or opens
  if (open && items.length === 0 && !loadingItems) {
    loadAll();
  }

  const handleRunScrape = async () => {
    setIsSyncing(true);
    toast.info("Scanning maxspect.com for product updates...");
    try {
      const res = await triggerScrapeFn({ data: { targetUrl: selectedUrl } });
      toast.success(res.message);
      await loadAll();
      onProductsUpdated();
    } catch (err) {
      toast.error("Error connecting to maxspect.com scraper service.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleApprove = async (id: string, title: string) => {
    try {
      await updateStatusFn({ data: { id, status: "published" } });
      toast.success(`"${title}" published to live site!`);
      await loadAll();
      onProductsUpdated();
    } catch (e) {
      toast.error("Failed to publish draft.");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateStatusFn({ data: { id, status: "archived" } });
      toast.info("Draft archived.");
      await loadAll();
      onProductsUpdated();
    } catch (e) {
      toast.error("Failed to archive draft.");
    }
  };

  if (!open) return null;

  const drafts = items.filter((i) => i.status === "draft");
  const published = items.filter((i) => i.status === "published");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden text-slate-100 z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Manufacturer Content Sync
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  maxspect.com
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Scan maxspect.com, import new product ranges, and review before going live in the
                UK.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Controls Bar */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs">
                <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
                <input
                  type="text"
                  value={selectedUrl}
                  onChange={(e) => setSelectedUrl(e.target.value)}
                  className="bg-transparent text-slate-200 outline-none w-full font-mono"
                  placeholder="https://www.maxspect.com/en/"
                />
              </div>

              <button
                onClick={handleRunScrape}
                disabled={isSyncing}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Scanning Manufacturer Website..." : "Scan & Pull Updates"}
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Clock className="w-3.5 h-3.5" />
                {drafts.length} pending draft approval{drafts.length !== 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {published.length} live product ranges
              </span>
            </div>
          </div>

          {/* Pending Drafts Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Pending Approvals (Draft Mode)</h3>
              </div>
              <span className="text-xs text-slate-400">
                New products are held as drafts until approved
              </span>
            </div>

            {drafts.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-950/40 border border-dashed border-slate-800 space-y-2">
                <FileCheck className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm text-slate-400">No pending drafts to review.</p>
                <p className="text-xs text-slate-500">
                  Click "Scan & Pull Updates" above to check maxspect.com for new equipment
                  releases.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {drafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 hover:border-amber-500/50 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      {draft.hero_image ? (
                        <img
                          src={draft.hero_image}
                          alt={draft.title}
                          className="w-14 h-14 object-contain rounded-lg bg-slate-900 border border-slate-800 p-1 shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                          <Layers className="w-6 h-6 text-slate-600" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{draft.title}</h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            Draft
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                          {draft.subtitle}
                        </p>
                        {draft.source_url && (
                          <a
                            href={draft.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:underline mt-1"
                          >
                            Source: {draft.source_url}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
                      <Link
                        to="/product/$slug"
                        params={{ slug: draft.slug }}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        Preview Page
                      </Link>

                      <button
                        onClick={() => handleReject(draft.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-xs font-medium text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </button>

                      <button
                        onClick={() => handleApprove(draft.id, draft.title)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-slate-950 transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve & Publish UK
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Published Catalog Reference */}
          <div className="space-y-3 border-t border-slate-800 pt-5">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Currently Published UK Products ({published.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {published.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={p.hero_image}
                      alt={p.title}
                      className="w-10 h-10 object-contain rounded bg-slate-900 border border-slate-800 p-0.5"
                    />
                    <div>
                      <p className="text-xs font-bold text-white leading-tight">{p.title}</p>
                      <p className="text-[11px] text-slate-400 font-mono">/product/{p.slug}</p>
                    </div>
                  </div>
                  <Link
                    to="/product/$slug"
                    params={{ slug: p.slug }}
                    className="p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-cyan-400" />
            <span>
              Updates run safely without overwriting local custom UK descriptions or pricing.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}
