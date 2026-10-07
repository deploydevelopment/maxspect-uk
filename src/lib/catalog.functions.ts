// THIN server-function wrappers for the catalog.
// Per the tss-serverfn-split rule: this file contains ONLY imports,
// erased types, and createServerFn declarations. Every runtime helper,
// mutable state value, and config constant lives in an imported module so
// the split transform cannot leave a handler referencing a sibling binding
// in another chunk (which causes `ReferenceError: X is not defined`).

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ProductContentSection } from "./catalog.types";
import {
  repoGetCategories,
  repoGetPublishedProducts,
  repoGetAllProducts,
  repoGetProductBySlug,
  repoUpdateProductStatus,
  repoGetSpareParts,
  isUsingSupabase,
} from "./catalog-repo.server";
import {
  memGetProducts,
  memGetCategories,
  memGetSpares,
  memSetProducts,
} from "./catalog-state.server";
import { scanProductSections } from "./catalog-section-pipeline.server";
import { loadSupplyStockists, mapsEmbedKey } from "./supply-engine.server";
import { findSourceNode } from "./catalog-tree";
import {
  runFullSync,
  runPullSection,
  runSetSectionStatus,
  runDumpProduct,
  buildCatalogTree,
  runTriggerScrape,
} from "./catalog-sync-helpers.server";

export const getCatalogCategories = createServerFn({ method: "GET" }).handler(async () => {
  if (isUsingSupabase()) return repoGetCategories();
  return memGetCategories();
});

export const getPublishedProducts = createServerFn({ method: "GET" }).handler(async () => {
  if (isUsingSupabase()) return repoGetPublishedProducts();
  return memGetProducts().filter((p) => p.status === "published");
});

export const getAllProductsForAdmin = createServerFn({ method: "GET" }).handler(async () => {
  if (isUsingSupabase()) return repoGetAllProducts();
  return memGetProducts();
});

export const getProductBySlug = createServerFn({ method: "GET" })
  .validator((slug: string) => z.string().parse(slug))
  .handler(async ({ data: slug }) => {
    if (isUsingSupabase()) return repoGetProductBySlug(slug);
    return memGetProducts().find((p) => p.slug === slug) || null;
  });

export const getStockists = createServerFn({ method: "GET" }).handler(async () => {
  return loadSupplyStockists();
});

export const getMapsEmbedKey = createServerFn({ method: "GET" }).handler(async () => {
  return mapsEmbedKey();
});

export const getSpareParts = createServerFn({ method: "GET" }).handler(async () => {
  if (isUsingSupabase()) return repoGetSpareParts();
  return memGetSpares();
});

export const updateProductStatus = createServerFn({ method: "POST" })
  .validator((input: { id: string; status: "draft" | "published" | "archived" }) =>
    z.object({ id: z.string(), status: z.enum(["draft", "published", "archived"]) }).parse(input),
  )
  .handler(async ({ data }) => {
    if (isUsingSupabase()) {
      const ok = await repoUpdateProductStatus(data.id, data.status);
      if (ok) return { success: true };
    }
    const next = memGetProducts().map((p) =>
      p.id === data.id ? { ...p, status: data.status, updated_at: new Date().toISOString() } : p,
    );
    memSetProducts(next);
    return { success: true };
  });

export const dumpProduct = createServerFn({ method: "POST" })
  .validator((input: { slug: string }) => z.object({ slug: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => runDumpProduct(data.slug));

export const getCatalogTree = createServerFn({ method: "GET" }).handler(async () =>
  buildCatalogTree(),
);

export const syncProductFromSource = createServerFn({ method: "POST" })
  .validator((input: { slug: string }) => z.object({ slug: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => runFullSync(data.slug));

export const triggerMaxspectScrape = createServerFn({ method: "POST" })
  .validator((input: { targetUrl?: string }) =>
    z.object({ targetUrl: z.string().optional() }).parse(input),
  )
  .handler(async ({ data }) => runTriggerScrape(data.targetUrl));

export const scanProductFromSource = createServerFn({ method: "POST" })
  .validator((input: { slug: string }) => z.object({ slug: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const { node } = findSourceNode(data.slug);
    if (!node || !node.source_url) {
      return { success: false, message: "Source URL not found for this product." };
    }
    try {
      const scanned = await scanProductSections(node.source_url, node.title, node.slug);
      const existing = isUsingSupabase()
        ? await repoGetProductBySlug(data.slug)
        : memGetProducts().find((p) => p.slug === data.slug);
      const existingByOrder = new Map(
        (existing?.sections || []).map((s) => [s.source_order ?? -1, s]),
      );
      const merged = scanned.map((sc) => {
        const live = existingByOrder.get(sc.source_order);
        return {
          ...sc,
          section: {
            ...sc.section,
            source_order: sc.source_order,
            sync_status: live?.sync_status || ("not-synced" as const),
          },
        };
      });
      return {
        success: true,
        scanned: merged,
        productTitle: node.title,
        sourceUrl: node.source_url,
        message: `Found ${merged.length} sections on the source page (top to bottom).`,
      };
    } catch (err: any) {
      return { success: false, message: `Scan failed: ${err?.message || err}` };
    }
  });

export const pullProductSection = createServerFn({ method: "POST" })
  .validator((input: { slug: string; section: ProductContentSection }) =>
    z.object({ slug: z.string().min(1), section: z.record(z.any()) }).parse(input),
  )
  .handler(async ({ data }) => runPullSection(data.slug, data.section as ProductContentSection));

export const setSectionStatus = createServerFn({ method: "POST" })
  .validator(
    (input: {
      slug: string;
      source_order: number;
      status: "approved" | "rejected" | "pending" | "not-synced";
    }) =>
      z
        .object({
          slug: z.string().min(1),
          source_order: z.number(),
          status: z.enum(["approved", "rejected", "pending", "not-synced"]),
        })
        .parse(input),
  )
  .handler(async ({ data }) => runSetSectionStatus(data.slug, data.source_order, data.status));
