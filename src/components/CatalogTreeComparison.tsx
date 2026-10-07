import { useState, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Package,
  CheckCircle2,
  Clock,
  CircleDashed,
  Archive,
  ExternalLink,
  Eye,
  Check,
  X,
  Globe,
  DownloadCloud,
  AlertTriangle,
  Trash2,
  ListTree,
} from "lucide-react";
import { CatalogRange, SyncStatus } from "@/lib/catalog.types";

export interface TreeSummary {
  total: number;
  published: number;
  drafts: number;
  notSynced: number;
  archived: number;
}

const STATUS_META: Record<
  SyncStatus,
  { label: string; icon: typeof CheckCircle2; color: string; dot: string }
> = {
  published: {
    label: "Live",
    icon: CheckCircle2,
    color: "text-emerald-600",
    dot: "bg-emerald-500",
  },
  draft: {
    label: "Draft",
    icon: Clock,
    color: "text-amber-600",
    dot: "bg-amber-500",
  },
  "not-synced": {
    label: "Not synced",
    icon: CircleDashed,
    color: "text-slate-400",
    dot: "bg-slate-300",
  },
  archived: {
    label: "Archived",
    icon: Archive,
    color: "text-rose-500",
    dot: "bg-rose-400",
  },
};

export function CatalogTreeComparison({
  tree,
  summary,
  onApprove,
  onReject,
  onSyncProduct,
  onPreview,
  onDump,
  onSections,
}: {
  tree: CatalogRange[];
  summary: TreeSummary;
  onApprove?: (slug: string, title: string) => void;
  onReject?: (slug: string) => void;
  onSyncProduct?: (slug: string, title: string) => void;
  onPreview?: (slug: string, title: string) => void;
  onDump?: (slug: string, title: string) => void;
  onSections?: (slug: string, title: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <TreeColumn
        title="maxspect.com"
        subtitle="Manufacturer source — all ranges, sub-ranges & products"
        badge="Source"
        badgeClass="bg-blue-50 text-blue-700 border-blue-200"
        tree={tree}
        side="source"
        onSyncProduct={onSyncProduct}
        onSections={onSections}
      />
      <TreeColumn
        title="maxspect.co.uk"
        subtitle="UK distributor site — synced & published content"
        badge="UK"
        badgeClass="bg-cyan-50 text-cyan-700 border-cyan-200"
        tree={tree}
        side="uk"
        onApprove={onApprove}
        onReject={onReject}
        onSyncProduct={onSyncProduct}
        onPreview={onPreview}
        onDump={onDump}
        onSections={onSections}
      />

      {/* Summary bar spanning both columns */}
      <div className="lg:col-span-2 flex flex-wrap items-center gap-4 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium">
        <span className="text-slate-500">{summary.total} products total</span>
        <span className="flex items-center gap-1.5 text-emerald-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          {summary.published} live
        </span>
        <span className="flex items-center gap-1.5 text-amber-600">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          {summary.drafts} drafts
        </span>
        <span className="flex items-center gap-1.5 text-slate-400">
          <span className="w-2 h-2 rounded-full bg-slate-300" />
          {summary.notSynced} not synced
        </span>
        {summary.archived > 0 && (
          <span className="flex items-center gap-1.5 text-rose-500">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            {summary.archived} archived
          </span>
        )}
      </div>
    </div>
  );
}

function TreeColumn({
  title,
  subtitle,
  badge,
  badgeClass,
  tree,
  side,
  onApprove,
  onReject,
  onSyncProduct,
  onPreview,
  onDump,
  onSections,
}: {
  title: string;
  subtitle: string;
  badge: string;
  badgeClass: string;
  tree: CatalogRange[];
  side: "source" | "uk";
  onApprove?: (slug: string, title: string) => void;
  onReject?: (slug: string) => void;
  onSyncProduct?: (slug: string, title: string) => void;
  onPreview?: (slug: string, title: string) => void;
  onDump?: (slug: string, title: string) => void;
  onSections?: (slug: string, title: string) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  // Show a loading spinner for 5 seconds before falling back to "No ranges found".
  useEffect(() => {
    if (tree.length > 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 5000);
    return () => clearTimeout(timer);
  }, [tree.length]);

  const toggle = (key: string) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm flex flex-col">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <Globe className="w-4 h-4 text-cyan-600 shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 truncate">{title}</h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeClass}`}
              >
                {badge}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 max-h-[560px]">
        {tree.length === 0 && loading ? (
          <div className="p-8 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-7 h-7 rounded-full border-2 border-slate-200 border-t-cyan-500 animate-spin" />
            <span className="text-xs text-slate-400">Loading ranges…</span>
          </div>
        ) : tree.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No ranges found.</div>
        ) : (
          tree.map((range) => {
            const rangeKey = range.slug;
            const rangeOpen = expanded[rangeKey] ?? true;
            const rangeCounts = countRange(range);

            return (
              <div key={range.slug} className="mb-1">
                {/* Range */}
                <button
                  onClick={() => toggle(rangeKey)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left group"
                >
                  {rangeOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  {rangeOpen ? (
                    <FolderOpen className="w-4 h-4 text-cyan-600 shrink-0" />
                  ) : (
                    <Folder className="w-4 h-4 text-cyan-600 shrink-0" />
                  )}
                  <span className="text-sm font-semibold text-slate-800 truncate flex-1">
                    {range.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {rangeCounts.published}/{rangeCounts.total}
                  </span>
                </button>

                {/* Sub-ranges */}
                {rangeOpen && (
                  <div className="ml-3 border-l border-slate-200 pl-2">
                    {range.sub_ranges.map((sub) => {
                      const subKey = `${range.slug}/${sub.slug}`;
                      const subOpen = expanded[subKey] ?? true;
                      const subCounts = countSub(sub);

                      return (
                        <div key={sub.slug} className="mb-0.5">
                          <button
                            onClick={() => toggle(subKey)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors text-left"
                          >
                            {subOpen ? (
                              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                            )}
                            <span className="text-xs font-medium text-slate-600 truncate flex-1">
                              {sub.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">
                              {subCounts.published}/{subCounts.total}
                            </span>
                          </button>

                          {/* Products */}
                          {subOpen && (
                            <div className="ml-3 border-l border-slate-100 pl-2 py-0.5">
                              {sub.products.map((product) => {
                                const meta = STATUS_META[product.status];
                                const Icon = meta.icon;

                                // On the UK side, hide not-synced products (they don't exist yet)
                                if (side === "uk" && product.status === "not-synced") {
                                  return (
                                    <div
                                      key={product.slug}
                                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-left opacity-40"
                                    >
                                      <Package className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                                      <span className="text-xs text-slate-400 italic truncate flex-1">
                                        {product.title}
                                      </span>
                                      <span className="text-[10px] text-slate-300 shrink-0">
                                        Not synced
                                      </span>
                                    </div>
                                  );
                                }

                                return (
                                  <div
                                    key={product.slug}
                                    className="group flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                                  >
                                    <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="text-xs text-slate-700 truncate flex-1">
                                      {product.title}
                                    </span>

                                    {/* Status badge */}
                                    <span
                                      className={`flex items-center gap-1 text-[10px] font-medium ${meta.color} shrink-0`}
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                                      {meta.label}
                                    </span>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 shrink-0">
                                      {side === "uk" && product.status === "draft" && (
                                        <>
                                          {onPreview && (
                                            <button
                                              onClick={() => onPreview(product.slug, product.title)}
                                              className="p-1 rounded text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition-colors"
                                              title="Preview"
                                            >
                                              <Eye className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                          {onReject && (
                                            <button
                                              onClick={() => onReject(product.slug)}
                                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                              title="Reject"
                                            >
                                              <X className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                          {onApprove && (
                                            <button
                                              onClick={() => onApprove(product.slug, product.title)}
                                              className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                              title="Approve & Publish"
                                            >
                                              <Check className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                        </>
                                      )}
                                      {side === "uk" && product.status === "published" && (
                                        <>
                                          {onPreview && (
                                            <button
                                              onClick={() => onPreview(product.slug, product.title)}
                                              className="p-1 rounded text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition-colors"
                                              title="View live page"
                                            >
                                              <ExternalLink className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                          {onDump && (
                                            <button
                                              onClick={() => onDump(product.slug, product.title)}
                                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                              title="Remove from UK site (set to Not synced)"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                        </>
                                      )}
                                      {side === "source" && (
                                        <>
                                          {onSections && (
                                            <button
                                              onClick={() =>
                                                onSections(product.slug, product.title)
                                              }
                                              className="p-1 rounded text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition-colors"
                                              title="Section pipeline — scan & pull sections one at a time"
                                            >
                                              <ListTree className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                          {onSyncProduct && (
                                            <button
                                              onClick={() =>
                                                onSyncProduct(product.slug, product.title)
                                              }
                                              className="p-1 rounded text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition-colors"
                                              title="Sync this product from maxspect.com"
                                            >
                                              <DownloadCloud className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                          {product.source_url && (
                                            <a
                                              href={product.source_url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="p-1 rounded text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition-colors"
                                              title="View on maxspect.com"
                                            >
                                              <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function countRange(range: CatalogRange) {
  let total = 0;
  let published = 0;
  for (const sub of range.sub_ranges) {
    for (const p of sub.products) {
      total++;
      if (p.status === "published") published++;
    }
  }
  return { total, published };
}

function countSub(sub: CatalogRange["sub_ranges"][number]) {
  let total = sub.products.length;
  let published = sub.products.filter((p) => p.status === "published").length;
  return { total, published };
}
