// When a /media file is not on disk, send the browser to the public Storage copy.

import { existsSync } from "node:fs";
import { join } from "node:path";
import { storagePublicUrl } from "./media-storage";

export function redirectMissingMedia(pathname: string, baseUrl?: string): string | null {
  if (!pathname.startsWith("/media/")) return null;
  let relative = pathname.slice("/media/".length);
  try {
    relative = decodeURIComponent(relative);
  } catch {
    return null;
  }
  if (!relative || relative.split("/").includes("..")) return null;
  if (existsSync(join(process.cwd(), "public", "media", relative))) return null;
  return storagePublicUrl(relative, baseUrl);
}
