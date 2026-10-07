// Server-only: section-by-section sync pipeline.
//
// Phase 1 — SCAN:   fetch source HTML once, tokenize top-to-bottom, return an
//                   ordered list of ScannedSection (no asset downloads).
// Phase 2 — PULL:   download assets for ONE section, rewrite its URLs to
//                   Supabase Storage, mark sync_status = "pending".
// Phase 3 — APPROVE/REJECT: flip sync_status (no network).
//
// Reuses the tokenizer from catalog-scraper.server.ts so scan results match
// what a full sync would produce.

import { scrapeMaxspectProductPage } from "./catalog-scraper.server";
import { downloadAsset } from "./asset-downloader.server";
import { ProductContentSection, ScannedSection, SectionSyncStatus } from "./catalog.types";

/** Stable signature for a section so we can detect source changes on re-scan. */
export function sectionSignature(sec: ProductContentSection): string {
  const parts = [
    sec.type,
    sec.heading || "",
    sec.subheading || "",
    sec.image_url || "",
    sec.video_url || "",
    (sec.secondary_images || []).join(","),
    (sec.items || []).map((i) => `${i.title}|${i.image_url || ""}`).join(","),
  ];
  return parts.join("§").toLowerCase().slice(0, 500);
}

/**
 * Phase 1 — lightweight scan.
 * Fetches the source page, returns ordered section descriptors with the full
 * (original-URL) section payload attached. No assets are downloaded.
 */
export async function scanProductSections(
  sourceUrl: string,
  title: string,
  slug: string,
): Promise<ScannedSection[]> {
  const scraped = await scrapeMaxspectProductPage(sourceUrl, title, slug);
  const sections = scraped.sections || [];

  return sections.map((section, idx) => {
    const preview_url =
      section.video_url ||
      section.image_url ||
      section.secondary_images?.[0] ||
      section.items?.find((i) => i.image_url)?.image_url;

    return {
      source_order: idx,
      type: section.type,
      heading: section.heading,
      subheading: section.subheading,
      source_signature: sectionSignature(section),
      preview_url,
      has_video: Boolean(section.video_url),
      has_image: Boolean(
        section.image_url || (section.secondary_images && section.secondary_images.length > 0),
      ),
      item_count: section.items?.length || 0,
      section,
    };
  });
}

/**
 * Phase 2 — pull a single section.
 * Downloads only this section's media assets and rewrites URLs to Storage.
 * Returns the rewritten section with sync_status = "pending".
 */
export async function pullSectionAssets(
  section: ProductContentSection,
): Promise<ProductContentSection> {
  const track = async (url: string | undefined): Promise<string | undefined> => {
    if (!url) return url;
    const res = await downloadAsset(url);
    return res.url;
  };

  const image_url = await track(section.image_url);
  const secondary_images = section.secondary_images
    ? await Promise.all(section.secondary_images.map(track))
    : section.secondary_images;
  const video_url = await track(section.video_url);
  const overlay_images = section.overlay_images
    ? await Promise.all(section.overlay_images.map(track))
    : section.overlay_images;
  const items = section.items
    ? await Promise.all(
        section.items.map(async (it) => ({ ...it, image_url: await track(it.image_url) })),
      )
    : section.items;

  return {
    ...section,
    image_url,
    secondary_images,
    video_url,
    overlay_images,
    items,
    sync_status: "pending" as SectionSyncStatus,
  };
}
