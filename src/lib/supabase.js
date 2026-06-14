import { createClient } from '@supabase/supabase-js'

/* Supabase client (the image catalog — ARCH §5 publish lane, metadata half).
 * Bytes live in B2; this DB holds the rows that point at them.
 *
 * Browser-safe: only the anon key is used here (public read; writes are gated
 * by RLS to authenticated users — the local ingest script uses the service
 * role). When the env isn't set the client is null and the Library page shows
 * an empty/“not configured” state instead of throwing, so the app still builds
 * and runs without secrets. Point VITE_SUPABASE_URL/ANON_KEY at the cloud
 * project (or the local `supabase start` stack) via .env.local. */

const url = import.meta.env.VITE_SUPABASE_URL
// Dashboard → Settings → API calls this the "Publishable key" (sb_publishable_…);
// Supabase renamed the old "anon key". VITE_SUPABASE_ANON_KEY still works as a fallback.
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && key ? createClient(url, key) : null
export const supabaseConfigured = Boolean(supabase)
