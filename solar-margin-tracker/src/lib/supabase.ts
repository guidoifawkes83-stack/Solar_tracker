import { createClient } from "@supabase/supabase-js";

// Server-only client using the service role key. This app is single-user
// (Harold), gated by the password middleware, so there's no need for
// per-request user sessions — every server component/action uses this one
// privileged client. NEVER import this file from a "use client" component.
export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars. See README.md."
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
