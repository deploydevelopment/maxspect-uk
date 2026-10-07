// Server-only repository for review flags.
// Uses Supabase when configured AND tables are present; otherwise falls back
// to a shared in-memory store (per worker isolate).

import { getSupabase } from "./supabase.server";
import { ReviewFlag } from "./review-notes.types";

// Shared in-memory fallback store.
const memStore: ReviewFlag[] = [];

let schemaChecked = false;
let useSupabase = false;

async function checkSchema(): Promise<boolean> {
  if (schemaChecked) return useSupabase;
  schemaChecked = true;
  const sb = getSupabase();
  if (!sb) {
    useSupabase = false;
    return false;
  }
  // Probe the review_flags table.
  const { error } = await sb.from("review_flags").select("id").limit(1);
  if (error && error.code === "PGRST205") {
    // Table missing — fall back to memory.
    useSupabase = false;
    return false;
  }
  useSupabase = true;
  return true;
}

function toFlag(row: Record<string, unknown>): ReviewFlag {
  return {
    id: String(row.id),
    slug: String(row.slug),
    pane: row.pane === "source" ? "source" : "local",
    category: String(row.category),
    note: String(row.note),
    resolved: Boolean(row.resolved),
    created_at: String(row.created_at),
    resolved_at: row.resolved_at ? String(row.resolved_at) : null,
  };
}

export async function getReviewFlags(slug: string): Promise<ReviewFlag[]> {
  if (!(await checkSchema())) {
    return memStore.filter((f) => f.slug === slug);
  }
  const sb = getSupabase()!;
  const { data, error } = await sb
    .from("review_flags")
    .select("*")
    .eq("slug", slug)
    .order("created_at", { ascending: false });
  if (error || !data) return memStore.filter((f) => f.slug === slug);
  return data.map(toFlag);
}

export async function addReviewFlag(
  slug: string,
  pane: "source" | "local",
  category: string,
  note: string,
): Promise<ReviewFlag> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const flag: ReviewFlag = {
    id,
    slug,
    pane,
    category,
    note,
    resolved: false,
    created_at: now,
    resolved_at: null,
  };

  if (!(await checkSchema())) {
    memStore.unshift(flag);
    return flag;
  }
  const sb = getSupabase()!;
  const { error } = await sb.from("review_flags").insert({
    id,
    slug,
    pane,
    category,
    note,
    resolved: false,
    created_at: now,
    resolved_at: null,
  });
  if (error) {
    // Fall back to memory so the user still sees it this session.
    memStore.unshift(flag);
  }
  return flag;
}

export async function removeReviewFlag(id: string): Promise<boolean> {
  if (!(await checkSchema())) {
    const idx = memStore.findIndex((f) => f.id === id);
    if (idx === -1) return false;
    memStore.splice(idx, 1);
    return true;
  }
  const sb = getSupabase()!;
  const { error } = await sb.from("review_flags").delete().eq("id", id);
  if (error) {
    const idx = memStore.findIndex((f) => f.id === id);
    if (idx >= 0) memStore.splice(idx, 1);
  }
  return true;
}

export async function resolveReviewFlag(id: string): Promise<boolean> {
  const now = new Date().toISOString();
  if (!(await checkSchema())) {
    const f = memStore.find((f) => f.id === id);
    if (!f) return false;
    f.resolved = true;
    f.resolved_at = now;
    return true;
  }
  const sb = getSupabase()!;
  const { error } = await sb
    .from("review_flags")
    .update({ resolved: true, resolved_at: now })
    .eq("id", id);
  if (error) {
    const f = memStore.find((f) => f.id === id);
    if (f) {
      f.resolved = true;
      f.resolved_at = now;
    }
  }
  return true;
}

/** Returns a map of slug -> open (unresolved) flag count. */
export async function getOpenFlagCounts(slugs: string[]): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  for (const s of slugs) result[s] = 0;
  if (slugs.length === 0) return result;

  if (!(await checkSchema())) {
    for (const f of memStore) {
      if (!f.resolved && slugs.includes(f.slug)) result[f.slug]++;
    }
    return result;
  }
  const sb = getSupabase()!;
  const { data, error } = await sb
    .from("review_flags")
    .select("slug")
    .eq("resolved", false)
    .in("slug", slugs);
  if (error || !data) {
    for (const f of memStore) {
      if (!f.resolved && slugs.includes(f.slug)) result[f.slug]++;
    }
    return result;
  }
  for (const row of data) {
    const slug = String((row as Record<string, unknown>).slug);
    if (result[slug] !== undefined) result[slug]++;
  }
  return result;
}
