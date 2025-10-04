// lib/supabaseAdmin.ts
import { createClient } from "@supabase/supabase-js";

// Use **server-only** keys here. Do NOT expose the service key to the browser.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Provide the names your routes are importing:
export function getSupabaseAdmin() {
  return supabaseAdmin;
}

export function publicURL(bucket: string, path: string) {
  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl ?? null;
}
