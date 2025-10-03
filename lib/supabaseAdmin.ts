// app/lib/supabaseAdmin.ts (server-only)
import { createClient } from "@supabase/supabase-js";

// These must be set in your env (Vercel: Project Settings → Environment Variables)
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // server-only!

if (!url || !serviceRoleKey) {
  throw new Error(
    "Missing Supabase env vars: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
  );
}

export const supabaseAdmin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
});
