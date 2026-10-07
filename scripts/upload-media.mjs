// Upload public/media into the public media-assets bucket, keeping the same paths.
//
//   node scripts/upload-media.mjs

import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative, sep } from "node:path";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const ROOT = join(process.cwd(), "public", "media");
const BUCKET = "media-assets";
const CONCURRENCY = 4;

function storageObjectPath(relativePath) {
  return relativePath
    .replace(/^\/+/, "")
    .split("/")
    .map((segment) =>
      [...segment]
        .map((char) => {
          const code = char.codePointAt(0);
          return code < 128 ? char : `_x${code.toString(16)}_`;
        })
        .join(""),
    )
    .join("/");
}

const TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ogg": "video/ogg",
  ".mov": "video/quicktime",
  ".m4v": "video/mp4",
  ".pdf": "application/pdf",
};

function loadEnv() {
  return readFile(new URL("../.env.local", import.meta.url), "utf8").then((text) => {
    for (const line of text.split("\n")) {
      const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  });
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === ".DS_Store") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

async function main() {
  await loadEnv();
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase is not configured");

  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: ws },
  });

  const { error: bucketError } = await sb.storage.createBucket(BUCKET, { public: true });
  if (bucketError && !/already exists|duplicate/i.test(bucketError.message)) {
    throw new Error(bucketError.message);
  }

  const files = [];
  for await (const file of walk(ROOT)) files.push(file);
  console.log(`Uploading ${files.length} files`);

  let done = 0;
  let failed = 0;
  let cursor = 0;

  async function worker() {
    while (cursor < files.length) {
      const file = files[cursor];
      cursor += 1;
      const rawPath = relative(ROOT, file).split(sep).join("/");
      const storagePath = storageObjectPath(rawPath);
      if (storagePath === rawPath) {
        done += 1;
        continue;
      }
      const body = await readFile(file);
      const contentType = TYPES[extname(file).toLowerCase()] || "application/octet-stream";
      const { error } = await sb.storage.from(BUCKET).upload(storagePath, body, {
        contentType,
        upsert: true,
      });
      done += 1;
      if (error) {
        failed += 1;
        console.log(`FAIL ${storagePath}: ${error.message}`);
      } else if (done % 25 === 0 || done === files.length) {
        console.log(`${done}/${files.length}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  console.log(failed ? `Finished with ${failed} failures` : "Finished");
  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
