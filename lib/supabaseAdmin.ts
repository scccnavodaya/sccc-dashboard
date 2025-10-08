// lib/supabaseAdmin.ts
import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * SERVER-ONLY Supabase admin client.
 *
 * ⚠️ Never import this file in client components.
 * Use only in:
 *   - /app/api/** route handlers
 *   - server actions
 *   - server components
 */

// --- Environment variables ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// --- Safety checks ---
if (!SUPABASE_URL) {
  throw new Error(
    "❌ Missing NEXT_PUBLIC_SUPABASE_URL — add it to your .env.local or deployment environment."
  );
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "❌ Missing SUPABASE_SERVICE_ROLE_KEY — add it to your .env.local or deployment environment."
  );
}

// --- Admin client ---
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      "X-Client-Info": "sccc-admin-server", // helpful for logs in Supabase dashboard
    },
  },
});

/**
 * Helper getter — useful if you want to avoid direct import
 * of supabaseAdmin in every API file.
 */
export function getSupabaseAdmin() {
  return supabaseAdmin;
}

/**
 * Return a public URL for a file inside a storage bucket.
 * Example: publicURL("notices", "image123.jpg")
 */
export function publicURL(bucket: string, path?: string | null): string | null {
  if (!path) return null;
  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl ?? null;
}
