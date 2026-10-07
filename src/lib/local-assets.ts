// Maps a maxspect.com image, video, or PDF onto public/media when that file
// has already been downloaded. Page reads use this so the browser does not
// wait on the manufacturer site.

import { existsSync } from "node:fs";
import { join } from "node:path";
import { ProductPage } from "./catalog.types";
import { storagePublicUrl } from "./media-storage";

const MEDIA_EXT = /\.(png|jpe?g|webp|gif|svg|avif|mp4|webm|ogg|mov|m4v|pdf)$/i;
const MEDIA_ROOT = () => join(process.cwd(), "public", "media");

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function decodePath(pathname: string): string {
  return pathname
    .split("/")
    .map((segment) => decodeSegment(segment))
    .join("/");
}

/** Original file URL, ignoring YOOtheme thumbnail/cache wrappers. */
export function canonicalAssetUrl(url: string): string | null {
  if (!/maxspect\.com/i.test(url) || /youtu\.?be|youtube/i.test(url)) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const src = parsed.searchParams.get("src");
  const target = src
    ? new URL(
        src.startsWith("http") ? src : src.startsWith("/") ? src : `/${src}`,
        "https://www.maxspect.com",
      )
    : parsed;
  const pathname = decodePath(target.pathname);
  if (!MEDIA_EXT.test(pathname) || pathname.includes("..")) return null;
  return `https://www.maxspect.com${pathname}`;
}

export function localAssetPaths(
  canonicalUrl: string,
): { disk: string; publicPath: string; relative: string } | null {
  let pathname: string;
  try {
    pathname = decodePath(new URL(canonicalUrl).pathname);
  } catch {
    return null;
  }
  const relative = pathname.replace(/^\/+/, "");
  if (!relative || relative.includes("..")) return null;
  const publicPath =
    "/media/" +
    relative
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");
  return { disk: join(MEDIA_ROOT(), relative), publicPath, relative };
}

export function rewriteAssetUrl(url: string): string {
  const canonical = canonicalAssetUrl(url);
  if (!canonical) return url;
  const paths = localAssetPaths(canonical);
  if (!paths) return url;
  if (existsSync(paths.disk)) return paths.publicPath;
  return storagePublicUrl(paths.relative) ?? url;
}

export function localizeProduct<T>(value: T): T {
  return walk(value, true) as T;
}

function walk(value: unknown, keepSource: boolean): unknown {
  if (typeof value === "string") return rewriteAssetUrl(value);
  if (Array.isArray(value)) return value.map((item) => walk(item, keepSource));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      out[key] = key === "source_url" && keepSource ? child : walk(child, keepSource);
    }
    return out;
  }
  return value;
}

export function localizeProductPage(product: ProductPage): ProductPage {
  return localizeProduct(product);
}
