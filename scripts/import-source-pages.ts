// Interpret every maxspect.com catalogue page into the UK template and store it.
// Skips gyre-300-cloud-edition, which is maintained by hand.
//
//   set -a; source .env.local; set +a
//   npx --yes tsx scripts/import-source-pages.ts

import { readFileSync } from "node:fs";
import { DEFAULT_CATEGORIES } from "../src/lib/catalog-data";
import { listImportJobs } from "../src/lib/catalog-tree";
import { parseMaxspectHtmlCheerio } from "../src/lib/catalog-scraper.server";
import { repoGetProductBySlug, repoUpsertProduct } from "../src/lib/catalog-repo.server";
import { getSupabase } from "../src/lib/supabase.server";
import { ProductPage } from "../src/lib/catalog.types";

function loadEnvFile() {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of text.split("\n")) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

const CATEGORY_ID: Record<string, string> = {
  "innovate-series": "cat-1",
  "jump-series": "cat-2",
  "nano-tech-bio-media": "cat-3",
  "coral-tools": "cat-4",
  "smart-aquarium": "cat-6",
  accessories: "cat-7",
};

async function main() {
  loadEnvFile();
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase is not configured");

  const { error: categoryError } = await sb
    .from("product_categories")
    .upsert(DEFAULT_CATEGORIES.map((category) => ({ ...category })));
  if (categoryError) throw new Error(categoryError.message);

  const jobs = listImportJobs();
  console.log(`Importing ${jobs.length} pages`);

  for (const job of jobs) {
    const response = await fetch(job.source_url, {
      headers: { "User-Agent": "MaxspectUKCatalog/1.0" },
    });
    if (!response.ok) {
      console.log(`FAIL ${response.status} ${job.slug}`);
      continue;
    }
    const html = await response.text();
    const parsed = parseMaxspectHtmlCheerio(html, job.source_url, job.title, job.slug);
    const sections = (parsed.sections || []).map((section, index) => ({
      ...section,
      source_order: index,
      sync_status: "approved" as const,
    }));
    const existing = await repoGetProductBySlug(job.slug);
    const now = new Date().toISOString();
    const product: ProductPage = {
      id: existing?.id || `prod-${job.slug}`,
      category_id: CATEGORY_ID[job.categorySlug] || "cat-1",
      slug: job.slug,
      title: job.title,
      subtitle: sections.find((section) => section.subheading)?.subheading?.slice(0, 220),
      hero_image: parsed.hero_image || null,
      gallery_images: parsed.gallery_images || [],
      sections,
      features: [],
      specs: parsed.specs || {},
      downloads: existing?.downloads || [],
      status: "published",
      source_url: job.source_url,
      last_scraped_at: now,
      created_at: existing?.created_at || now,
      updated_at: now,
    };
    await repoUpsertProduct(product);
    console.log(
      `OK ${job.slug} sections=${sections.length} images=${product.gallery_images.length} range=${job.isRangePage}`,
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
