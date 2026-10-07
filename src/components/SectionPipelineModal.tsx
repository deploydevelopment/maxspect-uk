import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  scanProductFromSource,
  pullProductSection,
  setSectionStatus,
} from "@/lib/catalog.functions";
import { ScannedSection, ProductContentSection, SectionSyncStatus } from "@/lib/catalog.types";
import {
  X,
  DownloadCloud,
  Check,
  Ban,
  RefreshCw,
  Loader2,
  Video,
  ImageIcon,
  ListTree,
  FileText,
  Table,
} from "lucide-react";
import { toast } from "sonner";

const STATUS_META: Record<SectionSyncStatus, { label: string; color: string; dot: string }> = {
  "not-synced": { label: "Not pulled", color: "text-slate-400", dot: "bg-slate-300" },
  pending: { label: "Pending", color: "text-amber-600", dot: "bg-amber-500" },
  approved: { label: "Approved", color: "text-emerald-600", dot: "bg-emerald-500" },
  rejected: { label: "Rejected", color: "text-rose-500", dot: "bg-rose-400" },
};

function typeIcon(type: string) {
  if (type === "video_embed") return Video;
  if (type === "tech_specs_table") return Table;
  if (type === "full_width_hero") return ImageIcon;
  if (type === "flow_examples" || type === "water_flow_improvement") return ListTree;
  return FileText;
}

export function SectionPipelineModal({
  slug,
  title,
  sourceUrl,
  onClose,
  onChanged,
}: {
  slug: string;
  title: string;
  sourceUrl?: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState<ScannedSection[] | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [busyOrder, setBusyOrder] = useState<number | null>(null);

  const scanFn = useServerFn(scanProductFromSource);
  const pullFn = useServerFn(pullProductSection);
  const setStatusFn = useServerFn(setSectionStatus);

  const runScan = async () => {
    setScanning(true);
    setScanError(null);
    try {
      const res = await scanFn({ data: { slug } });
      if (res.success) {
        setScanned(res.scanned);
        toast.success(res.message);
      } else {
        setScanError(res.message);
        toast.error(res.message);
      }
    } catch (err: any) {
      setScanError(err?.message || "Scan failed");
      toast.error("Scan failed");
    } finally {
      setScanning(false);
    }
  };

  const updateLocalStatus = (order: number, status: SectionSyncStatus) => {
    setScanned((prev) =>
      prev
        ? prev.map((s) =>
            s.source_order === order ? { ...s, section: { ...s.section, sync_status: status } } : s,
          )
        : prev,
    );
  };

  const handlePull = async (sc: ScannedSection) => {
    setBusyOrder(sc.source_order);
    try {
      const section: ProductContentSection = {
        ...sc.section,
        source_order: sc.source_order,
        source_signature: sc.source_signature,
      };
      const res = await pullFn({ data: { slug, section } });
      if (res.success) {
        updateLocalStatus(sc.source_order, "pending");
        toast.success(res.message);
        onChanged();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to pull section");
    } finally {
      setBusyOrder(null);
    }
  };

  const handleStatus = async (order: number, status: SectionSyncStatus) => {
    setBusyOrder(order);
    try {
      const res = await setStatusFn({ data: { slug, source_order: order, status } });
      if (res.success) {
        updateLocalStatus(order, status);
        toast.success(res.message);
        onChanged();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to update section status");
    } finally {
      setBusyOrder(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[88vh] rounded-2xl bg-white border border-slate-200 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900 truncate">Section Pipeline</h3>
            <p className="text-xs text-slate-500 truncate">
              {title}
              {sourceUrl && (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 text-cyan-600 hover:underline"
                >
                  source ↗
                </a>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={runScan}
              disabled={scanning}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              {scanning ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              {scanning ? "Scanning…" : "Scan source"}
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {scanError && (
            <div className="mb-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {scanError}
            </div>
          )}

          {!scanned && !scanning && (
            <div className="py-16 text-center">
              <ListTree className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">
                Click <span className="font-semibold text-slate-700">Scan source</span> to detect
                all sections on the maxspect.com page, top to bottom.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                No assets are downloaded during scan — pull sections one at a time.
              </p>
            </div>
          )}

          {scanning && !scanned && (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 text-cyan-500 mx-auto mb-3 animate-spin" />
              <p className="text-sm text-slate-500">Reading source page…</p>
            </div>
          )}

          {scanned && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700">
                  {scanned.length} sections detected (top → bottom)
                </span>
                <span className="text-[10px] text-slate-400">
                  {scanned.filter((s) => s.section.sync_status === "approved").length} approved ·{" "}
                  {scanned.filter((s) => s.section.sync_status === "pending").length} pending
                </span>
              </div>

              {scanned.map((sc) => {
                const status = sc.section.sync_status || "not-synced";
                const meta = STATUS_META[status];
                const Icon = typeIcon(sc.type);
                const busy = busyOrder === sc.source_order;

                return (
                  <div
                    key={sc.source_order}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
                  >
                    {/* Order + thumbnail */}
                    <div className="flex items-center gap-2 shrink-0 w-10 justify-center">
                      <span className="text-[10px] font-mono text-slate-400">
                        {sc.source_order + 1}
                      </span>
                    </div>

                    {/* Preview */}
                    <div className="w-16 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                      {sc.preview_url ? (
                        sc.has_video ? (
                          <Video className="w-5 h-5 text-slate-400" />
                        ) : (
                          <img
                            src={sc.preview_url}
                            alt=""
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        )
                      ) : (
                        <Icon className="w-5 h-5 text-slate-300" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-sm font-medium text-slate-800 truncate">
                          {sc.heading || `Section ${sc.source_order + 1}`}
                        </span>
                      </div>
                      {sc.subheading && (
                        <p className="text-xs text-slate-500 truncate mt-0.5">{sc.subheading}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`flex items-center gap-1 text-[10px] ${meta.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{sc.type}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {busy ? (
                        <Loader2 className="w-4 h-4 text-cyan-500 animate-spin" />
                      ) : (
                        <>
                          {(status === "not-synced" || status === "rejected") && (
                            <button
                              onClick={() => handlePull(sc)}
                              className="p-1.5 rounded text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition-colors cursor-pointer"
                              title="Pull this section (download assets)"
                            >
                              <DownloadCloud className="w-4 h-4" />
                            </button>
                          )}
                          {status === "pending" && (
                            <>
                              <button
                                onClick={() => handleStatus(sc.source_order, "approved")}
                                className="p-1.5 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                                title="Approve — show on live page"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleStatus(sc.source_order, "rejected")}
                                className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Reject"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {status === "approved" && (
                            <button
                              onClick={() => handleStatus(sc.source_order, "pending")}
                              className="p-1.5 rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                              title="Revert to pending"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
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

        {/* Footer */}
        {scanned && (
          <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <p className="text-[11px] text-slate-500">
              Approved sections appear on the live page; pending ones show with a Draft badge.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
