import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Columns2,
  X,
  ExternalLink,
  DownloadCloud,
  Flag,
  Trash2,
  Plus,
  Check,
  Wrench,
} from "lucide-react";
import { getFlags, saveFlag, deleteFlag, resolveFlag } from "@/lib/review-notes.functions";
import { ReviewFlag, FLAG_CATEGORIES } from "@/lib/review-notes.types";
import { toast } from "sonner";

export interface DiffTarget {
  slug: string;
  title: string;
  sourceUrl?: string;
}

export function ReviewDiffModal({
  target,
  onClose,
  onResync,
}: {
  target: DiffTarget;
  onClose: () => void;
  onResync: (slug: string, title: string) => void;
}) {
  const getFlagsFn = useServerFn(getFlags);
  const saveFlagFn = useServerFn(saveFlag);
  const deleteFlagFn = useServerFn(deleteFlag);
  const resolveFlagFn = useServerFn(resolveFlag);

  const [flags, setFlags] = useState<ReviewFlag[]>([]);
  const [loadingFlags, setLoadingFlags] = useState(true);
  const [showFlagForm, setShowFlagForm] = useState<"source" | "local" | null>(null);
  const [flagPane, setFlagPane] = useState<"source" | "local">("local");
  const [flagCategory, setFlagCategory] = useState<string>(FLAG_CATEGORIES[0]);
  const [flagNote, setFlagNote] = useState("");
  const [savingFlag, setSavingFlag] = useState(false);

  const loadFlags = async () => {
    setLoadingFlags(true);
    try {
      const res = await getFlagsFn({ data: target.slug });
      setFlags(res);
    } catch {
      setFlags([]);
    } finally {
      setLoadingFlags(false);
    }
  };

  useEffect(() => {
    loadFlags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.slug]);

  const openFlagForm = (pane: "source" | "local") => {
    setFlagPane(pane);
    setFlagCategory(FLAG_CATEGORIES[0]);
    setFlagNote("");
    setShowFlagForm(pane);
  };

  const submitFlag = async () => {
    if (!flagNote.trim()) {
      toast.error("Please add a note describing the issue.");
      return;
    }
    setSavingFlag(true);
    try {
      await saveFlagFn({
        data: {
          slug: target.slug,
          pane: flagPane,
          category: flagCategory,
          note: flagNote.trim(),
        },
      });
      toast.success("Review note saved.");
      setShowFlagForm(null);
      await loadFlags();
    } catch {
      toast.error("Failed to save review note.");
    } finally {
      setSavingFlag(false);
    }
  };

  const removeFlag = async (id: string) => {
    try {
      await deleteFlagFn({ data: { id } });
      setFlags((prev) => prev.filter((f) => f.id !== id));
    } catch {
      toast.error("Failed to remove note.");
    }
  };

  const toggleResolveFlag = async (flag: ReviewFlag) => {
    try {
      if (flag.resolved) {
        // Re-open: delete + re-add is overkill; just flip via delete (no reopen endpoint).
        // Simplest: remove resolved flag. Admin can re-flag if needed.
        await deleteFlagFn({ data: { id: flag.id } });
        setFlags((prev) => prev.filter((f) => f.id !== flag.id));
        toast.info("Resolved note removed.");
      } else {
        await resolveFlagFn({ data: { id: flag.id } });
        setFlags((prev) =>
          prev.map((f) =>
            f.id === flag.id ? { ...f, resolved: true, resolved_at: new Date().toISOString() } : f,
          ),
        );
        toast.success("Note marked as resolved.");
      }
    } catch {
      toast.error("Failed to update note.");
    }
  };

  /** Action a flagged issue: re-sync the product from source, then auto-resolve the note. */
  const actionFlag = async (flag: ReviewFlag) => {
    toast.info(`Re-syncing "${target.title}" from maxspect.com to fix this issue…`);
    try {
      // Mark the note as resolved first so it doesn't linger.
      await resolveFlagFn({ data: { id: flag.id } });
      setFlags((prev) =>
        prev.map((f) =>
          f.id === flag.id ? { ...f, resolved: true, resolved_at: new Date().toISOString() } : f,
        ),
      );
      // Trigger the re-sync (closes the modal and opens the sync confirm flow).
      onResync(target.slug, target.title);
      toast.success("Note actioned — re-sync started. Review the result and re-flag if needed.");
    } catch {
      toast.error("Failed to action this note.");
    }
  };

  const sourceFlags = flags.filter((f) => f.pane === "source");
  const localFlags = flags.filter((f) => f.pane === "local");
  const openCount = flags.filter((f) => !f.resolved).length;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-900/80 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Header */}
      <div
        className="w-full bg-white flex items-center justify-between px-4 py-3 border-b border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Columns2 className="w-4 h-4 text-violet-600 shrink-0" />
          <span className="text-sm font-semibold text-slate-900 truncate">{target.title}</span>
          <span className="text-[10px] font-mono text-slate-400 truncate hidden sm:inline">
            Source vs Local — visual diff
          </span>
          {openCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <Flag className="w-3 h-3" />
              {openCount} open
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Side-by-side panes */}
      <div
        className="flex-1 relative grid grid-cols-1 md:grid-cols-2 gap-0 min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Source pane */}
        <DiffPane
          label="maxspect.com"
          accent="blue"
          subUrl={target.sourceUrl}
          iframeSrc={target.sourceUrl}
          iframeTitle={`${target.title} — source`}
          emptyMessage="No source URL available"
          flags={sourceFlags}
          onAddFlag={() => openFlagForm("source")}
          onRemoveFlag={removeFlag}
          onResolveFlag={toggleResolveFlag}
          onActionFlag={actionFlag}
        />

        {/* Local pane */}
        <DiffPane
          label="maxspect.co.uk"
          accent="cyan"
          subUrl={`/product/${target.slug}`}
          iframeSrc={`/product/${target.slug}`}
          iframeTitle={`${target.title} — local`}
          link={
            <Link
              to="/product/$slug"
              params={{ slug: target.slug }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open local in tab
            </Link>
          }
          flags={localFlags}
          onAddFlag={() => openFlagForm("local")}
          onRemoveFlag={removeFlag}
          onResolveFlag={toggleResolveFlag}
          onActionFlag={actionFlag}
        />
      </div>

      {/* Flag form popover */}
      {showFlagForm && (
        <div
          className="w-full bg-amber-50 border-t border-amber-200 px-4 py-3"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="max-w-3xl mx-auto space-y-2">
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-xs font-semibold text-amber-800">
                Flag an issue on the{" "}
                <span className="underline">
                  {showFlagForm === "source" ? "maxspect.com" : "maxspect.co.uk"}
                </span>{" "}
                pane
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={flagCategory}
                onChange={(e) => setFlagCategory(e.target.value)}
                className="px-3 py-2 rounded-lg border border-amber-300 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {FLAG_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                value={flagNote}
                onChange={(e) => setFlagNote(e.target.value)}
                placeholder="e.g. The hero video is in the wrong position / this section is wrong…"
                className="flex-1 px-3 py-2 rounded-lg border border-amber-300 bg-white text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                onKeyDown={(e) => e.key === "Enter" && submitFlag()}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFlagForm(null)}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={submitFlag}
                  disabled={savingFlag}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {savingFlag ? "Saving…" : "Save note"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        className="w-full bg-white flex items-center justify-between px-4 py-3 border-t border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-xs text-slate-500 hidden sm:inline">
          Compare the manufacturer original (left) against the local UK draft (right) before
          publishing.
        </span>
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => {
              onResync(target.slug, target.title);
              onClose();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            <DownloadCloud className="w-4 h-4" />
            Re-sync from source
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DiffPane({
  label,
  accent,
  subUrl,
  iframeSrc,
  iframeTitle,
  emptyMessage,
  link,
  flags,
  onAddFlag,
  onRemoveFlag,
  onResolveFlag,
  onActionFlag,
}: {
  label: string;
  accent: "blue" | "cyan";
  subUrl?: string;
  iframeSrc?: string;
  iframeTitle: string;
  emptyMessage: string;
  link?: React.ReactNode;
  flags: ReviewFlag[];
  onAddFlag: () => void;
  onRemoveFlag: (id: string) => void;
  onResolveFlag: (flag: ReviewFlag) => void;
  onActionFlag: (flag: ReviewFlag) => void;
}) {
  const accentClasses =
    accent === "blue"
      ? "bg-blue-50 border-blue-200 text-blue-700"
      : "bg-cyan-50 border-cyan-200 text-cyan-700";

  return (
    <div className="flex flex-col bg-slate-50 min-h-0 relative border-r border-slate-200 last:border-r-0">
      <div
        className={`flex items-center gap-1.5 px-3 py-2 border-b ${accentClasses} text-xs font-semibold`}
      >
        <ExternalLink className="w-3.5 h-3.5" />
        {label}
        {subUrl && (
          <span className="font-normal opacity-60 truncate hidden sm:inline">· {subUrl}</span>
        )}
        <button
          onClick={onAddFlag}
          className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/70 hover:bg-white text-amber-700 border border-amber-200 transition-colors cursor-pointer"
          title="Flag an issue on this pane"
        >
          <Flag className="w-3 h-3" />
          Flag issue
        </button>
      </div>

      <div className="flex-1 relative min-h-0">
        {iframeSrc ? (
          <iframe
            src={iframeSrc}
            title={iframeTitle}
            className="absolute inset-0 w-full h-full bg-white"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
            {emptyMessage}
          </div>
        )}
      </div>

      {/* Flags for this pane */}
      {flags.length > 0 && (
        <div className="px-3 py-2 bg-amber-50/60 border-t border-amber-100 space-y-1.5 max-h-32 overflow-y-auto">
          {flags.map((f) => (
            <div
              key={f.id}
              className={`flex items-start gap-2 text-[11px] bg-white rounded-md border px-2 py-1.5 ${
                f.resolved ? "border-emerald-200 opacity-60" : "border-amber-200"
              }`}
            >
              <Flag
                className={`w-3 h-3 shrink-0 mt-0.5 ${
                  f.resolved ? "text-emerald-500" : "text-amber-500"
                }`}
              />
              <div className="min-w-0 flex-1">
                <span
                  className={`font-semibold ${f.resolved ? "text-emerald-700" : "text-amber-700"}`}
                >
                  {f.category}
                  {f.resolved && " · resolved"}
                </span>
                <span className={`text-slate-600 ${f.resolved ? "line-through" : ""}`}>
                  {" "}
                  — {f.note}
                </span>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                {!f.resolved && (
                  <button
                    onClick={() => onActionFlag(f)}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-cyan-700 hover:bg-cyan-50 transition-colors cursor-pointer"
                    title="Re-sync from source to fix this issue"
                  >
                    <Wrench className="w-3 h-3" />
                    Fix
                  </button>
                )}
                <button
                  onClick={() => onResolveFlag(f)}
                  className="p-0.5 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                  title={f.resolved ? "Remove resolved note" : "Mark as resolved"}
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onRemoveFlag(f.id)}
                  className="p-0.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Delete note"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 px-3 py-2 border-t border-slate-200">
        {link ? (
          link
        ) : iframeSrc && iframeSrc.startsWith("http") ? (
          <a
            href={iframeSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open source in tab
          </a>
        ) : null}
        <span className="text-[10px] text-slate-400 ml-auto">
          {accent === "blue" ? "Manufacturer original" : "UK distributor draft"}
        </span>
      </div>
    </div>
  );
}
