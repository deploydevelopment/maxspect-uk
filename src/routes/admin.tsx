import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Settings,
  ArrowLeft,
  DownloadCloud,
  AlertTriangle,
  X,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import {
  getAllProductsForAdmin,
  getCatalogTree,
  updateProductStatus,
  syncProductFromSource,
  dumpProduct,
} from "@/lib/catalog.functions";
import { ProductPage, CatalogRange, TreeSummary } from "@/lib/catalog.types";
import { CatalogTreeComparison } from "@/components/CatalogTreeComparison";
import { SectionPipelineModal } from "@/components/SectionPipelineModal";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin · Maxspect UK Content Sync" },
      {
        name: "description",
        content: "Internal admin panel for syncing product content from maxspect.com.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [items, setItems] = useState<ProductPage[]>([]);
  const [tree, setTree] = useState<CatalogRange[]>([]);
  const [summary, setSummary] = useState<TreeSummary>({
    total: 0,
    published: 0,
    drafts: 0,
    notSynced: 0,
    archived: 0,
  });
  const [loadingItems, setLoadingItems] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchAllFn = useServerFn(getAllProductsForAdmin);
  const fetchTreeFn = useServerFn(getCatalogTree);
  const updateStatusFn = useServerFn(updateProductStatus);
  const syncProductFn = useServerFn(syncProductFromSource);
  const dumpProductFn = useServerFn(dumpProduct);

  const [syncTarget, setSyncTarget] = useState<{
    slug: string;
    title: string;
  } | null>(null);
  const [syncingProduct, setSyncingProduct] = useState(false);
  const [syncComplete, setSyncComplete] = useState<string | null>(null);
  const [syncDiagnostic, setSyncDiagnostic] = useState<{
    usingSupabase?: boolean;
    persistedToDb?: boolean;
    persistError?: string;
    downloaded?: number;
    skippedBroken?: number;
    rewrittenHero?: string;
  } | null>(null);
  const [previewTarget, setPreviewTarget] = useState<{
    slug: string;
    title: string;
  } | null>(null);
  const [dumpTarget, setDumpTarget] = useState<{
    slug: string;
    title: string;
  } | null>(null);
  const [dumpingProduct, setDumpingProduct] = useState(false);
  const [pipelineTarget, setPipelineTarget] = useState<{
    slug: string;
    title: string;
    sourceUrl?: string;
  } | null>(null);

  const handleSections = (slug: string, title: string) => {
    let sourceUrl: string | undefined;
    for (const range of tree) {
      for (const sub of range.sub_ranges) {
        const found = sub.products.find((p) => p.slug === slug);
        if (found) {
          sourceUrl = found.source_url;
          break;
        }
      }
      if (sourceUrl) break;
    }
    setPipelineTarget({ slug, title, sourceUrl });
  };

  const loadAll = async () => {
    setLoadingItems(true);
    try {
      const [data, treeData] = await Promise.all([fetchAllFn(), fetchTreeFn()]);
      setItems(data);
      setTree(treeData.tree);
      setSummary(treeData.summary);
    } catch {
      toast.error("Failed to load catalog products.");
    } finally {
      setLoadingItems(false);
      setLoaded(true);
    }
  };

  // Initial load
  if (!loaded && !loadingItems) {
    loadAll();
  }

  const handleApprove = async (slug: string, title: string) => {
    const product = items.find((i) => i.slug === slug);
    if (!product) return;
    try {
      await updateStatusFn({ data: { id: product.id, status: "published" } });
      toast.success(`"${title}" published to live site!`);
      await loadAll();
    } catch {
      toast.error("Failed to publish draft.");
    }
  };

  const handleReject = async (slug: string) => {
    const product = items.find((i) => i.slug === slug);
    if (!product) return;
    try {
      await updateStatusFn({ data: { id: product.id, status: "archived" } });
      toast.info("Draft archived.");
      await loadAll();
    } catch {
      toast.error("Failed to archive draft.");
    }
  };
  const handleSyncProduct = async (slug: string, title: string) => {
    setSyncComplete(null);
    setSyncTarget({ slug, title });
  };

  const handlePreview = (slug: string, title: string) => {
    setPreviewTarget({ slug, title });
  };

  const handleDump = (slug: string, title: string) => {
    setDumpTarget({ slug, title });
  };

  const confirmDumpProduct = async () => {
    if (!dumpTarget) return;
    setDumpingProduct(true);
    try {
      const res = await dumpProductFn({ data: { slug: dumpTarget.slug } });
      if (res.success) {
        toast.success(res.message);
        await loadAll();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to remove product from UK site.");
    } finally {
      setDumpingProduct(false);
      setDumpTarget(null);
    }
  };

  const confirmSyncProduct = async () => {
    if (!syncTarget) return;
    setSyncingProduct(true);
    try {
      const res = await syncProductFn({ data: { slug: syncTarget.slug } });
      if (res.success) {
        setSyncComplete(res.message);
        setSyncDiagnostic({
          usingSupabase: res.usingSupabase,
          persistedToDb: res.persistedToDb,
          persistError: res.persistError,
          downloaded: res.assetSummary?.downloaded,
          skippedBroken: res.assetSummary?.skippedBroken,
          rewrittenHero: res.rewrittenHero,
        });
        await loadAll();
      } else {
        toast.error(res.message);
        setSyncTarget(null);
      }
    } catch {
      toast.error("Failed to sync product from maxspect.com.");
      setSyncTarget(null);
    } finally {
      setSyncingProduct(false);
    }
  };

  const drafts = items.filter((i) => i.status === "draft");
  const published = items.filter((i) => i.status === "published");

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-cyan-500 selection:text-white">
      {/* Admin Top Bar */}
      <div className="border-b border-slate-200 bg-slate-50/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-600">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Maxspect UK Admin
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
                  Internal
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Content sync · product approvals · catalog management
              </p>
            </div>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to site
          </Link>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Side-by-side tree comparison */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Catalog Tree Comparison</h3>
            <span className="text-xs text-slate-500">
              Left: manufacturer source · Right: UK site sync status
            </span>
          </div>

          <CatalogTreeComparison
            tree={tree}
            summary={summary}
            onApprove={handleApprove}
            onReject={handleReject}
            onSyncProduct={handleSyncProduct}
            onPreview={handlePreview}
            onDump={handleDump}
            onSections={handleSections}
          />
        </section>

        {/* Footer note */}
        <div className="flex items-center gap-2 text-xs text-slate-500 border-t border-slate-200 pt-4">
          <AlertCircle className="w-4 h-4 text-cyan-600" />
          <span>
            Updates run safely without overwriting local custom UK descriptions or pricing. Drafts
            must be approved before they appear on the public site.
          </span>
        </div>
      </main>

      {/* Per-product sync confirm modal */}
      {syncTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
          onClick={() => !syncingProduct && !syncComplete && setSyncTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {syncComplete ? (
              <>
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-slate-900">Sync complete</h3>
                    <p className="text-sm text-slate-600 mt-1">{syncComplete}</p>
                    <p className="text-xs text-slate-400 mt-2">
                      The product now appears on the right-hand UK tree as a draft. Review and
                      approve it to publish live.
                    </p>
                    {syncDiagnostic && (
                      <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-600 space-y-0.5">
                        <div>usingSupabase: {String(syncDiagnostic.usingSupabase)}</div>
                        <div>persistedToDb: {String(syncDiagnostic.persistedToDb)}</div>
                        {syncDiagnostic.persistError && (
                          <div className="text-red-600">
                            persistError: {syncDiagnostic.persistError}
                          </div>
                        )}
                        <div>
                          assets: downloaded={syncDiagnostic.downloaded ?? 0}, skippedBroken=
                          {syncDiagnostic.skippedBroken ?? 0}
                        </div>
                        <div className="break-all">
                          rewrittenHero: {syncDiagnostic.rewrittenHero || "(none)"}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-6">
                  <button
                    onClick={() => {
                      setSyncTarget(null);
                      setSyncComplete(null);
                      setSyncDiagnostic(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-600 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-slate-900">Pull product data?</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      You're about to pull the latest data for{" "}
                      <span className="font-semibold text-slate-900">{syncTarget.title}</span> from
                      the maxspect.com website. Are you sure?
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      The imported content will be saved as a draft for review before going live.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 mt-6">
                  <button
                    onClick={() => setSyncTarget(null)}
                    disabled={syncingProduct}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmSyncProduct}
                    disabled={syncingProduct}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <DownloadCloud className={`w-4 h-4 ${syncingProduct ? "animate-pulse" : ""}`} />
                    {syncingProduct ? "Pulling..." : "Pull latest data"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen product preview dialog */}
      {previewTarget && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-slate-900/80 backdrop-blur-sm"
          onClick={() => setPreviewTarget(null)}
        >
          <div
            className="w-full bg-white flex items-center justify-between px-4 py-3 border-b border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 min-w-0">
              <ExternalLink className="w-4 h-4 text-cyan-600 shrink-0" />
              <span className="text-sm font-semibold text-slate-900 truncate">
                {previewTarget.title}
              </span>
              <span className="text-[10px] font-mono text-slate-400 truncate">
                /product/{previewTarget.slug}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/product/$slug"
                params={{ slug: previewTarget.slug }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open in tab
              </Link>
              <button
                onClick={() => setPreviewTarget(null)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 relative" onClick={(e) => e.stopPropagation()}>
            <iframe
              src={`/product/${previewTarget.slug}`}
              title={previewTarget.title}
              className="absolute inset-0 w-full h-full bg-white"
            />
          </div>
        </div>
      )}

      {/* Dump (remove from UK site) confirm modal */}
      {dumpTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
          onClick={() => !dumpingProduct && setDumpTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900">Remove from UK site?</h3>
                <p className="text-sm text-slate-600 mt-1">
                  You're about to remove{" "}
                  <span className="font-semibold text-slate-900">{dumpTarget.title}</span> from the
                  UK site. It will revert to <span className="font-medium">Not synced</span>. Are
                  you sure?
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  The live product page will no longer be accessible. You can re-sync it from
                  maxspect.com at any time.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setDumpTarget(null)}
                disabled={dumpingProduct}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDumpProduct}
                disabled={dumpingProduct}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className={`w-4 h-4 ${dumpingProduct ? "animate-pulse" : ""}`} />
                {dumpingProduct ? "Removing..." : "Remove from site"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section-by-section sync pipeline */}
      {pipelineTarget && (
        <SectionPipelineModal
          slug={pipelineTarget.slug}
          title={pipelineTarget.title}
          sourceUrl={pipelineTarget.sourceUrl}
          onClose={() => setPipelineTarget(null)}
          onChanged={loadAll}
        />
      )}
    </div>
  );
}
