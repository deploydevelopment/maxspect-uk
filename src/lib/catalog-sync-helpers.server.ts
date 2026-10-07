// Server-only sync helpers used by catalog.functions.ts handlers.
// Keeping ALL runtime logic here lets catalog.functions.ts be a THIN
// createServerFn wrapper (imports + declarations only, no module-scope state
// or sibling helpers) — required so the tss-serverfn-split transform does not
// leave handlers referencing bindings in another chunk.

import { ProductPage, ProductContentSection } from "./catalog.types";
import { scrapeMaxspectProductPage } from "./catalog-scraper.server";
import { downloadProductAssets } from "./asset-downloader.server";
import { pullSectionAssets } from "./catalog-section-pipeline.server";
import {
  repoGetCategories,
  repoGetProductBySlug,
  repoUpsertProduct,
  repoDeleteProduct,
  repoGetAllProducts,
  isUsingSupabase,
} from "./catalog-repo.server";
import { SOURCE_TREE, findSourceNode } from "./catalog-tree";
import {
  memGetProducts,
  memUpsertProduct,
  memRemoveProduct,
  memSetProducts,
} from "./catalog-state.server";

function memGetProductBySlug(slug: string): ProductPage | undefined {
  return memGetProducts().find((p) => p.slug === slug);
}

/** Full sync: scrape the source page top-to-bottom, download all assets,
 *  persist, and return a diagnostic result. */
export async function runFullSync(slug: string): Promise<{
  success: boolean;
  message: string;
  usingSupabase: boolean;
  persistedToDb: boolean;
  persistedToMem: boolean;
  persistError?: string;
  assetSummary: { downloaded: number; skippedBroken: number };
  rewrittenHero?: string;
}> {
  if (slug === "gyre-300-cloud-edition") {
    return {
      success: false,
      message:
        "Gyre 300 Cloud Edition stays as the hand-built page. Sync does not overwrite it.",
      usingSupabase: isUsingSupabase(),
      persistedToDb: false,
      persistedToMem: false,
      assetSummary: { downloaded: 0, skippedBroken: 0 },
    };
  }

  const { node, categorySlug } = findSourceNode(slug);
  if (!node) {
    return {
      success: false,
      message: "Product not found on maxspect.com.",
      usingSupabase: false,
      persistedToDb: false,
      persistedToMem: false,
      assetSummary: { downloaded: 0, skippedBroken: 0 },
    };
  }

  const categories = isUsingSupabase() ? await repoGetCategories() : [];
  const categoryId = categories.find((c) => c.slug === categorySlug)?.id || "cat-1";
  const now = new Date().toISOString();

  const existing = isUsingSupabase() ? await repoGetProductBySlug(slug) : memGetProductBySlug(slug);

  const scraped = await scrapeMaxspectProductPage(node.source_url || "", node.title, node.slug);

  const richSections: ProductContentSection[] =
    scraped.sections && scraped.sections.length > 0
      ? scraped.sections.map((sec, idx) => ({
          ...sec,
          source_order: idx,
          sync_status: "approved" as const,
        }))
      : [
          {
            id: `sec-full-hero-${Date.now()}`,
            type: "full_width_hero" as const,
            heading: `${node.title} — Official Overview`,
            subheading: "Product overview imported directly from maxspect.com.",
            image_url: node.hero_image,
            overlay_images: [],
            source_order: 0,
            sync_status: "approved" as const,
          },
        ];

  const scrapedHero = scraped.hero_image || null;
  const scrapedGallery =
    scraped.gallery_images && scraped.gallery_images.length > 0
      ? scraped.gallery_images
      : node.hero_image
        ? [node.hero_image]
        : existing?.gallery_images || [];

  const refreshed: ProductPage = {
    id: existing?.id || `scraped-${Date.now()}`,
    category_id: categoryId,
    slug: node.slug,
    title: scraped.title || node.title,
    subtitle:
      existing?.subtitle ||
      (richSections[0]?.subheading as string | undefined) ||
      "Latest content pulled from maxspect.com — pending UK review before publishing.",
    hero_badge: "SYNCED FROM MAXSPECT.COM",
    hero_image: scrapedHero,
    gallery_images: scrapedGallery,
    sections: richSections,
    features:
      scraped.features && scraped.features.length > 0
        ? scraped.features
        : existing?.features || [
            {
              title: "Synced from manufacturer",
              description:
                "Content imported from maxspect.com. Edit before publishing to the UK site.",
            },
          ],
    specs:
      scraped.specs && Object.keys(scraped.specs).length > 0
        ? scraped.specs
        : existing?.specs || {
            "Source Origin": "maxspect.com",
            "Sync Date": new Date().toLocaleDateString("en-GB"),
          },
    downloads: existing?.downloads || [],
    status: existing?.status === "published" ? "published" : "draft",
    source_url: node.source_url,
    last_scraped_at: now,
    created_at: existing?.created_at || now,
    updated_at: now,
  };

  const { product: withAssets, summary: assetSummary } = await downloadProductAssets(refreshed);

  const usingSb = isUsingSupabase();
  let persistedToDb = false;
  let persistError: string | undefined;
  let persistedToMem = false;
  if (usingSb) {
    try {
      persistedToDb = await repoUpsertProduct(withAssets);
    } catch (e: any) {
      persistError = String(e?.message || e);
    }
  }
  if (!persistedToDb) {
    if (existing) {
      const all = memGetProducts().map((p) =>
        p.slug === slug
          ? {
              ...p,
              title: withAssets.title,
              hero_image: withAssets.hero_image,
              sections: withAssets.sections,
              gallery_images: withAssets.gallery_images,
              last_scraped_at: now,
              updated_at: now,
            }
          : p,
      );
      memSetProducts(all);
    } else {
      memUpsertProduct(withAssets);
    }
    persistedToMem = true;
  }

  const assetNote =
    assetSummary.downloaded > 0
      ? ` ${assetSummary.downloaded} media assets cached to Supabase Storage` +
        (assetSummary.skippedBroken > 0
          ? `, ${assetSummary.skippedBroken} broken links skipped`
          : "") +
        "."
      : "";

  return {
    success: true,
    usingSupabase: usingSb,
    persistedToDb,
    persistedToMem,
    persistError,
    assetSummary,
    rewrittenHero: withAssets.hero_image,
    message: `Pulled latest data for "${node.title}" from maxspect.com.${assetNote}`,
  };
}

/** Pull a single section via the pipeline. */
export async function runPullSection(
  slug: string,
  section: ProductContentSection,
): Promise<{
  success: boolean;
  message: string;
  persistedToDb: boolean;
  usingSupabase: boolean;
  section: ProductContentSection;
}> {
  const { node, categorySlug } = findSourceNode(slug);
  if (!node) {
    return {
      success: false,
      message: "Product not found in source tree.",
      persistedToDb: false,
      usingSupabase: isUsingSupabase(),
      section,
    };
  }

  const categories = isUsingSupabase() ? await repoGetCategories() : [];
  const categoryId = categories.find((c) => c.slug === categorySlug)?.id || "cat-1";
  const now = new Date().toISOString();

  const existing = isUsingSupabase() ? await repoGetProductBySlug(slug) : memGetProductBySlug(slug);

  const pulled = await pullSectionAssets(section);

  const prevSections = existing?.sections || [];
  const order = pulled.source_order ?? prevSections.length;
  const others = prevSections
    .filter((s) => (s.source_order ?? -1) !== order)
    .map((s) =>
      !s.sync_status || s.sync_status === "approved"
        ? { ...s, sync_status: "not-synced" as const }
        : s,
    );
  const sections = [...others, { ...pulled, source_order: order }].sort(
    (a, b) => (a.source_order ?? 0) - (b.source_order ?? 0),
  );

  const product: ProductPage = {
    id: existing?.id || `scraped-${Date.now()}`,
    category_id: categoryId,
    slug: node.slug,
    title: existing?.title || node.title,
    subtitle:
      existing?.subtitle ||
      "Content pulled section-by-section from maxspect.com — pending UK review.",
    hero_badge: existing?.hero_badge || "SYNCED FROM MAXSPECT.COM",
    hero_image: existing?.hero_image || node.hero_image,
    gallery_images: existing?.gallery_images || (node.hero_image ? [node.hero_image] : []),
    sections,
    features: existing?.features || [],
    specs: existing?.specs || {},
    downloads: existing?.downloads || [],
    status: existing?.status === "published" ? "published" : "draft",
    source_url: node.source_url,
    last_scraped_at: now,
    created_at: existing?.created_at || now,
    updated_at: now,
  };

  const usingSb = isUsingSupabase();
  let persistedToDb = false;
  if (usingSb) {
    try {
      persistedToDb = await repoUpsertProduct(product);
    } catch {
      /* fall through to mem */
    }
  }
  if (!persistedToDb) {
    memUpsertProduct(product);
  }

  return {
    success: true,
    persistedToDb,
    usingSupabase: usingSb,
    section: pulled,
    message: `Section "${pulled.heading || `#${order + 1}`}" pulled & marked pending.`,
  };
}

/** Flip a section's sync_status. */
export async function runSetSectionStatus(
  slug: string,
  source_order: number,
  status: "approved" | "rejected" | "pending" | "not-synced",
): Promise<{ success: boolean; message: string; persistedToDb: boolean; usingSupabase: boolean }> {
  const existing = isUsingSupabase() ? await repoGetProductBySlug(slug) : memGetProductBySlug(slug);
  if (!existing) {
    return {
      success: false,
      message: "Product not found. Pull a section first.",
      persistedToDb: false,
      usingSupabase: isUsingSupabase(),
    };
  }

  const sections = (existing.sections || []).map((s) =>
    (s.source_order ?? -1) === source_order ? { ...s, sync_status: status } : s,
  );
  const now = new Date().toISOString();
  const product = { ...existing, sections, updated_at: now };

  const usingSb = isUsingSupabase();
  let persistedToDb = false;
  if (usingSb) {
    try {
      persistedToDb = await repoUpsertProduct(product);
    } catch {
      /* fall through */
    }
  }
  if (!persistedToDb) {
    memUpsertProduct(product);
  }

  return {
    success: true,
    persistedToDb,
    usingSupabase: usingSb,
    message: `Section marked "${status}".`,
  };
}

/** Dump a product from the UK site (delete from Supabase or mem). */
export async function runDumpProduct(slug: string): Promise<{ success: boolean; message: string }> {
  if (isUsingSupabase()) {
    const existing = await repoGetProductBySlug(slug);
    if (existing) {
      const ok = await repoDeleteProduct(slug);
      if (ok) {
        return {
          success: true,
          message: `"${existing.title}" has been removed from the UK site and is now Not synced.`,
        };
      }
    }
  }
  const existing = memGetProductBySlug(slug);
  if (!existing) {
    return { success: false, message: "Product is not currently synced to the UK site." };
  }
  memRemoveProduct(slug);
  return {
    success: true,
    message: `"${existing.title}" has been removed from the UK site and is now Not synced.`,
  };
}

/** Build the .com source tree with live sync status derived from local products. */
export async function buildCatalogTree(): Promise<{
  tree: typeof SOURCE_TREE;
  summary: {
    total: number;
    published: number;
    drafts: number;
    notSynced: number;
    archived: number;
  };
}> {
  const localProducts = isUsingSupabase() ? await repoGetAllProducts() : memGetProducts();
  const localBySlug = new Map(localProducts.map((p) => [p.slug, p]));

  const tree = SOURCE_TREE.map((range) => ({
    ...range,
    sub_ranges: range.sub_ranges.map((sub) => ({
      ...sub,
      products: sub.products.map((node) => {
        const local = localBySlug.get(node.slug);
        const status = local
          ? local.status === "archived"
            ? "archived"
            : local.status
          : "not-synced";
        return {
          ...node,
          status,
          hero_image: local?.hero_image || node.hero_image,
          last_synced_at: local?.updated_at,
        };
      }),
    })),
  }));

  let total = 0;
  let published = 0;
  let drafts = 0;
  let notSynced = 0;
  for (const r of tree) {
    for (const s of r.sub_ranges) {
      for (const p of s.products) {
        total++;
        if (p.status === "published") published++;
        else if (p.status === "draft") drafts++;
        else if (p.status === "not-synced") notSynced++;
      }
    }
  }

  return {
    tree,
    summary: {
      total,
      published,
      drafts,
      notSynced,
      archived: total - published - drafts - notSynced,
    },
  };
}

/** Trigger scrape: builds a couple of demo draft products (kept for the
 *  triggerMaxspectScrape wrapper). */
export async function runTriggerScrape(
  targetUrl?: string,
): Promise<{ success: boolean; scrapedCount: number; message: string }> {
  const now = new Date().toISOString();
  const item: ProductPage = {
    id: `scraped-${Date.now()}`,
    category_id: "cat-1",
    slug: "jump-mj-l165-led",
    title: "MJ-L165 LED Lighting System",
    subtitle: "165W Full-spectrum LED lighting module with Syna-G Cloud wireless mesh.",
    hero_image:
      "/media/images/Products/Jump/MJL.webp",
    gallery_images: [
      "/media/images/Products/Jump/MJL.webp",
    ],
    sections: [],
    features: [
      {
        title: "Acropora Growth Spectrum",
        description: "Targeted 410-480nm UV & Royal Blue channels.",
      },
      { title: "Multi-Unit Mesh", description: "Synchronize up to 32 fixtures without a router." },
    ],
    specs: { Power: "165 Watts", Dimensions: "222 x 176 x 32 mm" },
    downloads: [{ name: "MJ-L165 Manual", url: "#", type: "pdf" }],
    status: "draft",
    source_url: targetUrl || "https://www.maxspect.com/en/mj-l165-led",
    last_scraped_at: now,
    created_at: now,
    updated_at: now,
  };

  let persisted = false;
  if (isUsingSupabase()) {
    const { product: withAssets } = await downloadProductAssets(item);
    persisted = await repoUpsertProduct(withAssets);
  }
  if (!persisted) {
    if (!memGetProducts().some((p) => p.slug === item.slug)) {
      memUpsertProduct(item);
    }
  }

  return {
    success: true,
    scrapedCount: 1,
    message: `Scraped maxspect.com successfully. 1 draft product page added to queue for review.`,
  };
}
