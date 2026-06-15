/* Native (Tauri desktop) bridge. In the browser build IS_TAURI is false and
 * none of these run — the web app is unchanged. In the desktop app these give
 * real filesystem access: open a raw from anywhere, batch a folder, write files
 * to disk — beyond the browser sandbox. */

import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'

export const IS_TAURI = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

const RAW_EXTS = ['nef', 'dng', 'cr2', 'cr3', 'arw', 'raf', 'rw2', 'orf', 'tif', 'tiff']

const nameOf = (p) => p.split(/[\\/]/).pop()

/* Native open dialog → a File the existing decode() understands. null if cancelled. */
export async function openRawNative() {
  const path = await open({ multiple: false, filters: [{ name: 'Raw', extensions: RAW_EXTS }] })
  if (!path) return null
  const buf = await invoke('read_file_bytes', { path }) // ArrayBuffer
  return new File([buf], nameOf(path))
}

/* Read a known path → File (used during folder batch). */
export async function readRawPath(path) {
  const buf = await invoke('read_file_bytes', { path })
  return new File([buf], nameOf(path))
}

/* Native folder picker → { dir, files: [raw paths] } for batch. null if cancelled. */
export async function pickRawFolder() {
  const dir = await open({ directory: true, multiple: false })
  if (!dir) return null
  const files = await invoke('list_raws', { dir })
  return { dir, files }
}

/* Write bytes to disk (native export). */
export async function writeFileNative(path, bytes) {
  await invoke('write_file_bytes', { path, bytes: Array.from(bytes) })
}
