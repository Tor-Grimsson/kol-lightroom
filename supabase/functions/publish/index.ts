// Edge Function: publish — the secure write path for the in-app "Publish" button.
//
// The browser sends the exported JPEG (base64) + metadata + the parametric edit.
// This function (server-side, holding the service-role key that Supabase injects
// automatically) uploads the bytes to Storage and writes the catalog row. The
// secret key never touches the browser, and no user logs in.
//
// Deployed with --no-verify-jwt so the browser can call it with the publishable
// key. It's an open write endpoint for now; gate it with Supabase Auth later.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ ok: false, error: 'POST only' }, 405)

  try {
    const { fileBase64, contentType = 'image/jpeg', filename, meta = {}, edit = {}, tags = [] } =
      await req.json()
    if (!fileBase64 || !filename) return json({ ok: false, error: 'fileBase64 and filename required' }, 400)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // 1 — bytes → Storage (service role bypasses bucket policies)
    const bytes = Uint8Array.from(atob(fileBase64), (c) => c.charCodeAt(0))
    const key = `lightroom/${Date.now()}-${filename}`
    const up = await supabase.storage.from('published').upload(key, bytes, { contentType, upsert: true })
    if (up.error) throw up.error
    const cdnUrl = supabase.storage.from('published').getPublicUrl(key).data.publicUrl

    // 2 — row → catalog
    const row = {
      filename,
      b2_key: key,
      cdn_url: cdnUrl,
      bytes: bytes.length,
      width: meta.width ?? null,
      height: meta.height ?? null,
      camera: meta.camera ?? null,
      lens: meta.lens ?? null,
      iso: meta.iso ?? null,
      shutter: meta.shutter ?? null,
      aperture: meta.aperture ?? null,
      focal_len: meta.focal_len ?? null,
      shot_at: meta.shot_at ?? null,
      edit,
      tags,
    }
    const { data, error } = await supabase
      .from('images')
      .upsert(row, { onConflict: 'b2_key' })
      .select()
      .single()
    if (error) throw error

    return json({ ok: true, image: data })
  } catch (e) {
    return json({ ok: false, error: String((e as Error)?.message ?? e) }, 400)
  }
})
