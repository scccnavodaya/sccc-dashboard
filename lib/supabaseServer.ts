// lib/supabaseAdmin.ts
import "server-only";
import { createClient } from "@supabase/supabase-js";

// IMPORTANT: These must ONLY exist on the server.
// Never import this file in a Client Component or the browser.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}
if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY (server env)");
}

// If you have generated types, import and pass them like:
// import type { Database } from "@/types/supabase";
// export const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey, { ... });
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    // Optional: helps identify server calls in Supabase logs
    headers: { "X-Client-Info": "sccc-admin-server" },
  },
});
