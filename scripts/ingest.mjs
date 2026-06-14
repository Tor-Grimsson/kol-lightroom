#!/usr/bin/env node
/* Ingest a web-master image into the catalog (publish pipeline, Phase 2).
 *
 * Pushes the JPEG to the kolkrabbi B2 bucket via the `bucket` CLI, then upserts
 * a row into the Supabase `images` table with the service-role key (bypasses
 * RLS). Bytes in B2, metadata + parametric edit in the DB.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/ingest.mjs --file out/photo-web.jpg [--meta out/photo.json] \
 *       [--tags forest,portrait] [--prefix asset-library/lightroom] [--no-upload]
 *
 * --meta is the editor sidecar JSON: { filename,width,height,camera,lens,iso,
 *   shutter,aperture,focal_len,shot_at,edit }. Missing fields are nullable.
 * --no-upload skips the B2 push (DB row only) — for local testing, so nothing
 *   lands in the public CDN.
 */
import { readFileSync, statSync } from 'node:fs'
import { basename } from 'node:path'
import { execFileSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'

const CDN_BASE = 'https://f005.backblazeb2.com/file/kolkrabbi/website/'

function parseArgs(argv) {
  const a = { tags: [], prefix: 'asset-library/lightroom', noUpload: false }
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i]
    if (v === '--file') a.file = argv[++i]
    else if (v === '--meta') a.meta = argv[++i]
    else if (v === '--tags') a.tags = argv[++i].split(',').map((s) => s.trim()).filter(Boolean)
    else if (v === '--prefix') a.prefix = argv[++i]
    else if (v === '--key') a.key = argv[++i] // override the B2 object key
    else if (v === '--cdn-url') a.cdnUrl = argv[++i] // catalog an existing object
    else if (v === '--no-upload' || v === '--dry-run') a.noUpload = true
  }
  return a
}

const args = parseArgs(process.argv.slice(2))
if (!args.file && !args.cdnUrl) {
  console.error('ingest: --file <path> is required (or --cdn-url to catalog an existing object)')
  process.exit(1)
}

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('ingest: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const meta = args.meta ? JSON.parse(readFileSync(args.meta, 'utf8')) : {}
const filename = meta.filename || (args.file ? basename(args.file) : basename(args.key || 'image'))
const bytes = args.file ? statSync(args.file).size : (meta.bytes ?? null)
const remoteKey = (args.key || `${args.prefix}/${filename}`).replace(/\/+/g, '/')

let cdnUrl = args.cdnUrl || `${CDN_BASE}${remoteKey}`
if (args.cdnUrl) {
  console.log(`[ingest] cataloging existing object → ${cdnUrl}`)
} else if (args.noUpload) {
  console.log(`[ingest] --no-upload: skipping B2 push for ${remoteKey}`)
  cdnUrl = `dryrun://${remoteKey}`
} else {
  console.log(`[ingest] uploading ${args.file} → ${remoteKey}`)
  execFileSync('bucket', ['up', args.file, remoteKey], { stdio: 'inherit' })
  cdnUrl = execFileSync('bucket', ['url', remoteKey], { encoding: 'utf8' }).trim() || cdnUrl
}

const row = {
  filename,
  b2_key: remoteKey,
  cdn_url: cdnUrl,
  width: meta.width ?? null,
  height: meta.height ?? null,
  bytes,
  camera: meta.camera ?? null,
  lens: meta.lens ?? null,
  iso: meta.iso ?? null,
  shutter: meta.shutter ?? null,
  aperture: meta.aperture ?? null,
  focal_len: meta.focal_len ?? null,
  shot_at: meta.shot_at ?? null,
  edit: meta.edit ?? {},
  tags: args.tags,
}

const supabase = createClient(url, key, { auth: { persistSession: false } })
const { data, error } = await supabase.from('images').upsert(row, { onConflict: 'b2_key' }).select().single()
if (error) {
  console.error('[ingest] insert failed:', error.message)
  process.exit(1)
}
console.log(`[ingest] cataloged ${data.id} — ${data.filename}`)
