// Download manufacturer images, videos, and PDFs into public/media and
// point source files at those local copies.
//
//   npx --yes tsx scripts/mirror-assets.ts

import { createWriteStream, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { repoGetAllProducts, repoUpsertProduct } from "../src/lib/catalog-repo.server";
import { canonicalAssetUrl, localAssetPaths, localizeProductPage } from "../src/lib/local-assets";

function loadEnvFile() {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of text.split("\n")) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

function walkFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name === ".output") continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walkFiles(path, out);
    else if (/\.(tsx?|jsx?|css)$/.test(name)) out.push(path);
  }
  return out;
}

function collectStrings(value: unknown, into: Set<string>) {
  if (typeof value === "string") {
    if (/maxspect\.com/i.test(value)) into.add(value);
    return;
  }
  if (Array.isArray(value)) value.forEach((item) => collectStrings(item, into));
  else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (key === "source_url") continue;
      collectStrings(child, into);
    }
  }
}

async function downloadFile(url: string, disk: string): Promise<"saved" | "skipped" | "failed"> {
  if (existsSync(disk) && statSync(disk).size > 0) return "skipped";
  const video = /\.(mp4|webm|ogg|mov|m4v)$/i.test(url);
  const response = await fetch(url, {
    headers: { "User-Agent": "MaxspectUKCatalog/1.0" },
    signal: AbortSignal.timeout(video ? 180000 : 120000),
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const type = response.headers.get("content-type") || "";
  if (/text\/html|application\/json/i.test(type)) throw new Error(`not a file (${type})`);
  const length = Number(response.headers.get("content-length") || 0);
  if (length > 250 * 1024 * 1024) throw new Error(`too large (${length} bytes)`);
  mkdirSync(dirname(disk), { recursive: true });
  const partial = `${disk}.part`;
  if (!response.body) throw new Error("empty body");
  await pipeline(Readable.fromWeb(response.body as import("stream/web").ReadableStream), createWriteStream(partial));
  const size = statSync(partial).size;
  if (size === 0) throw new Error("empty file");
  renameSync(partial, disk);
  return "saved";
}

async function pool<T>(items: T[], size: number, worker: (item: T, index: number) => Promise<void>) {
  let next = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (next < items.length) {
        const index = next++;
        await worker(items[index], index);
      }
    }),
  );
}

async function main() {
  loadEnvFile();
  const products = await repoGetAllProducts();
  const raw = new Set<string>();
  for (const product of products) collectStrings(product, raw);
  const srcDir = join(process.cwd(), "src");
  const files = walkFiles(srcDir);
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(/https?:\/\/(?:www\.)?maxspect\.com[^"'`\s)]+/g)) {
      raw.add(match[0]);
    }
  }

  const jobs = new Map<string, { disk: string; publicPath: string }>();
  for (const url of raw) {
    const canonical = canonicalAssetUrl(url);
    if (!canonical || jobs.has(canonical)) continue;
    const paths = localAssetPaths(canonical);
    if (paths) jobs.set(canonical, paths);
  }

  console.log(`Downloading ${jobs.size} files into public/media`);
  let saved = 0;
  let skipped = 0;
  let failed = 0;
  const failures: string[] = [];
  const list = [...jobs.entries()];
  await pool(list, 6, async ([url, paths], index) => {
    try {
      const result = await downloadFile(url, paths.disk);
      if (result === "saved") saved++;
      else skipped++;
    } catch (error) {
      failed++;
      const reason = error instanceof Error ? error.message : String(error);
      failures.push(`${reason}  ${url}`);
    }
    if ((index + 1) % 40 === 0 || index + 1 === list.length) {
      console.log(`  ${index + 1}/${list.length}  saved ${saved}  existed ${skipped}  failed ${failed}`);
    }
  });

  let replacements = 0;
  for (const file of files) {
    let text = readFileSync(file, "utf8");
    const original = text;
    const urls = [...text.matchAll(/https?:\/\/(?:www\.)?maxspect\.com[^"'`\s)]+/g)].map((match) => match[0]);
    const unique = [...new Set(urls)].sort((a, b) => b.length - a.length);
    for (const url of unique) {
      const canonical = canonicalAssetUrl(url);
      const paths = canonical ? localAssetPaths(canonical) : null;
      if (!paths || !existsSync(paths.disk)) continue;
      if (text.includes(url)) {
        text = text.split(url).join(paths.publicPath);
        replacements++;
      }
    }
    // Directory prefixes used to build file URLs, such as the Ethereal image base.
    const bases = [
      ...text.matchAll(/https?:\/\/(?:www\.)?maxspect\.com\/images\/[^"'`\s)]+/g),
    ].map((match) => match[0]);
    for (const base of [...new Set(bases)].sort((a, b) => b.length - a.length)) {
      if (/\.(png|jpe?g|webp|gif|svg|avif|mp4|webm|ogg|mov|m4v|pdf)$/i.test(base)) continue;
      let pathname = "";
      try {
        pathname = decodeURIComponent(new URL(base).pathname);
      } catch {
        continue;
      }
      const prefix = "/media" + pathname.split("/").map((segment) => encodeURIComponent(segment)).join("/");
      const covered = [...jobs.values()].some(
        (paths) => existsSync(paths.disk) && (paths.publicPath.startsWith(prefix + "/") || paths.publicPath === prefix),
      );
      if (!covered || !text.includes(base)) continue;
      const quoted = new RegExp(`(["'\`])${base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\1`, "g");
      text = text.replace(quoted, `$1${prefix}$1`);
      replacements++;
    }
    if (text !== original) writeFileSync(file, text);
  }

  let updated = 0;
  for (const product of products) {
    const localized = localizeProductPage(product);
    if (JSON.stringify(localized) === JSON.stringify(product)) continue;
    await repoUpsertProduct(localized);
    updated++;
  }

  console.log(`saved ${saved}  already local ${skipped}  failed ${failed}  source replacements ${replacements}  products updated ${updated}`);
  if (failures.length) {
    writeFileSync("/tmp/mirror-asset-failures.txt", failures.join("\n"));
    console.log("failures written to /tmp/mirror-asset-failures.txt");
    console.log(failures.slice(0, 15).join("\n"));
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
