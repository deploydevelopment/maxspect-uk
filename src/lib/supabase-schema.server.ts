// Server-only: ensures the Storage bucket exists and verifies table presence.
// NOTE: Table DDL cannot run via the Supabase REST client. Run supabase-schema.sql
// once in the Supabase SQL Editor. This module only ensures the bucket + probes tables.

import { getSupabase } from "./supabase.server";

let bucketReady = false;
let tablesVerified = false;

export async function ensureSchema(): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  // Ensure storage bucket exists (the JS client CAN do this)
  if (!bucketReady) {
    const { error } = await sb.storage.createBucket("media-assets", {
      public: true,
      allowedMimeTypes: [
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/gif",
        "image/svg+xml",
        "video/mp4",
        "video/webm",
        "video/ogg",
        "video/quicktime",
      ],
      fileSizeLimit: "50MB",
    });
    // 400 / 409 if bucket already exists — ignore those.
    if (error && !/already exists|Bucket already/i.test(error.message)) {
      // non-fatal; uploads will fail later and be skipped
    }
    bucketReady = true;
  }

  // Probe: verify the products table exists (user must have run the SQL migration)
  if (!tablesVerified) {
    const { error: probe } = await sb.from("products").select("id").limit(1);
    if (probe && probe.code === "PGRST205") {
      // Schema not created yet — tables missing. Signal caller to fall back.
      return false;
    }
    tablesVerified = true;
  }

  return true;
}

export function resetSchemaInitFlag() {
  bucketReady = false;
  tablesVerified = false;
}
