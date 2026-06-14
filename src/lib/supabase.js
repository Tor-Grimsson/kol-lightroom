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
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && anonKey ? createClient(url, anonKey) : null
export const supabaseConfigured = Boolean(supabase)
