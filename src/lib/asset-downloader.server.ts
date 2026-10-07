// Server-only: downloads media assets from maxspect.com into Supabase Storage.
// - 15s timeout per fetch
// - Skips truly broken links (non-2xx / network error)
// - Keeps slow ones (they still succeed within timeout)
// - Returns a rewritten public URL pointing to our bucket
// - Caches by source_url in the media_assets table

import { getSupabase } from "./supabase.server";
import { ensureSchema } from "./supabase-schema.server";

const FETCH_TIMEOUT_MS = 15000;
const MAX_ASSET_BYTES = 50 * 1024 * 1024; // 50MB

const VIDEO_EXT = /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i;
const IMAGE_EXT = /\.(png|jpe?g|webp|gif|svg|avif)(\?|#|$)/i;

function contentTypeFor(url: string, fallback?: string): string {
  if (VIDEO_EXT.test(url)) {
    if (/\.mp4/i.test(url)) return "video/mp4";
    if (/\.webm/i.test(url)) return "video/webm";
    if (/\.ogg/i.test(url)) return "video/ogg";
    if (/\.mov/i.test(url)) return "video/quicktime";
    return "video/mp4";
  }
  if (IMAGE_EXT.test(url)) {
    if (/\.png/i.test(url)) return "image/png";
    if (/\.jpe?g/i.test(url)) return "image/jpeg";
    if (/\.webp/i.test(url)) return "image/webp";
    if (/\.gif/i.test(url)) return "image/gif";
    if (/\.svg/i.test(url)) return "image/svg+xml";
    if (/\.avif/i.test(url)) return "image/avif";
  }
  return fallback || "application/octet-stream";
}

function sanitizePath(url: string): string {
  try {
    const u = new URL(url);
    // flatten path + strip cache query noise
    const raw = (u.pathname + u.search).replace(/^\//, "");
    const cleaned = raw
      .replace(/[^a-zA-Z0-9._\-\/]/g, "_")
      .replace(/\/+/g, "/")
      .replace(/^_+|_+$/g, "");
    return cleaned || `asset_${Date.now()}`;
  } catch {
    return `asset_${Date.now()}`;
  }
}

export interface DownloadResult {
  ok: boolean;
  url: string; // rewritten public URL if ok, else original
  skipped?: "broken" | "too-large" | "non-media";
  reason?: string;
}

export async function downloadAsset(sourceUrl: string): Promise<DownloadResult> {
  if (!sourceUrl || !sourceUrl.startsWith("http")) {
    return { ok: false, url: sourceUrl, skipped: "broken", reason: "invalid url" };
  }
  // Only handle media we recognize; pass through everything else untouched.
  if (!VIDEO_EXT.test(sourceUrl) && !IMAGE_EXT.test(sourceUrl)) {
    return { ok: false, url: sourceUrl, skipped: "non-media", reason: "not a media asset" };
  }

  const sb = getSupabase();
  if (!sb) {
    // No Supabase configured — pass through original URL (slow but functional).
    return { ok: false, url: sourceUrl, skipped: "non-media", reason: "supabase unconfigured" };
  }
  await ensureSchema();

  // 1. Check cache table
  const { data: cached } = await sb
    .from("media_assets")
    .select("public_url")
    .eq("source_url", sourceUrl)
    .maybeSingle();
  if (cached?.public_url) {
    return { ok: true, url: cached.public_url };
  }

  // 2. Fetch with timeout
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let buf: ArrayBuffer;
  let respContentType: string | undefined;
  try {
    const res = await fetch(sourceUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "MaxspectUK-SyncBot/1.0" },
    });
    clearTimeout(timer);
    if (!res.ok) {
      return { ok: false, url: sourceUrl, skipped: "broken", reason: `HTTP ${res.status}` };
    }
    respContentType = res.headers.get("content-type") || undefined;
    const contentLength = Number(res.headers.get("content-length") || 0);
    if (contentLength > MAX_ASSET_BYTES) {
      return { ok: false, url: sourceUrl, skipped: "too-large", reason: `${contentLength} bytes` };
    }
    buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_ASSET_BYTES) {
      return { ok: false, url: sourceUrl, skipped: "too-large", reason: `${buf.byteLength} bytes` };
    }
  } catch (err: any) {
    clearTimeout(timer);
    const aborted = err?.name === "AbortError";
    // Broken (network error / DNS) vs slow (timeout) — we skip only hard failures.
    // A timeout is treated as "skip" to avoid blocking sync, but logged.
    return {
      ok: false,
      url: sourceUrl,
      skipped: "broken",
      reason: aborted ? "timeout" : String(err?.message || err),
    };
  }

  // 3. Upload to Storage
  const storagePath = sanitizePath(sourceUrl);
  const contentType = contentTypeFor(sourceUrl, respContentType);
  const fileBody = new Uint8Array(buf);

  const { error: upErr } = await sb.storage.from("media-assets").upload(storagePath, fileBody, {
    contentType,
    upsert: true,
  });
  if (upErr) {
    return { ok: false, url: sourceUrl, skipped: "broken", reason: `upload: ${upErr.message}` };
  }

  const { data: pub } = sb.storage.from("media-assets").getPublicUrl(storagePath);
  const publicUrl = pub?.publicUrl;
  if (!publicUrl) {
    return { ok: false, url: sourceUrl, skipped: "broken", reason: "no public url" };
  }

  // 4. Cache it
  await sb.from("media_assets").upsert({
    id: `asset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    source_url: sourceUrl,
    storage_path: storagePath,
    public_url: publicUrl,
    content_type: contentType,
    size_bytes: buf.byteLength,
  });

  return { ok: true, url: publicUrl };
}

/**
 * Walks a product's media fields, downloads every asset, and rewrites URLs
 * in-place to point at our cached copies. Returns the rewritten product plus
 * a summary of what was downloaded / skipped.
 */
export interface AssetSyncSummary {
  downloaded: number;
  skippedBroken: number;
  skippedOther: number;
  details: { source: string; status: string; reason?: string }[];
}

import { ProductPage, ProductContentSection } from "./catalog.types";

export async function downloadProductAssets(
  product: ProductPage,
): Promise<{ product: ProductPage; summary: AssetSyncSummary }> {
  const summary: AssetSyncSummary = {
    downloaded: 0,
    skippedBroken: 0,
    skippedOther: 0,
    details: [],
  };

  const track = async (url: string | undefined): Promise<string | undefined> => {
    if (!url) return url;
    const res = await downloadAsset(url);
    summary.details.push({
      source: url,
      status: res.ok ? "downloaded" : res.skipped || "skipped",
      reason: res.reason,
    });
    if (res.ok) summary.downloaded++;
    else if (res.skipped === "broken") summary.skippedBroken++;
    else summary.skippedOther++;
    return res.url;
  };

  // Hero + gallery
  const hero_image = await track(product.hero_image);
  const gallery_images = await Promise.all((product.gallery_images || []).map(track));

  // Sections
  const sections: ProductContentSection[] = [];
  for (const sec of product.sections || []) {
    const image_url = await track(sec.image_url);
    const secondary_images = sec.secondary_images
      ? await Promise.all(sec.secondary_images.map(track))
      : sec.secondary_images;
    const video_url = await track(sec.video_url);
    const items = sec.items
      ? await Promise.all(
          sec.items.map(async (it) => ({ ...it, image_url: await track(it.image_url) })),
        )
      : sec.items;
    sections.push({ ...sec, image_url, secondary_images, video_url, items });
  }

  return {
    product: { ...product, hero_image, gallery_images, sections },
    summary,
  };
}
