// Server-only Supabase client.
// Reads env inside the function (env injection happens at call time on Workers).
// Never import this from client code — filename `.server.ts` blocks client bundles.

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import ws from "ws";

let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!cached) {
    cached = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      // Node 20 has no global WebSocket. Supabase realtime throws on createClient
      // unless a transport is supplied (Node 22+ provides one natively).
      realtime: { transport: ws },
    });
  }
  return cached;
}

export function isSupabaseConfigured(): boolean {
  return getSupabase() !== null;
}
