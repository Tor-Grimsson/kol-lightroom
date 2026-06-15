import { useRef, useState } from 'react'
import JSZip from 'jszip'
import Button from '../components/atoms/Button.jsx'
import { runBatch } from './batch.js'
import { IS_TAURI, pickRawFolder, readRawPath, writeFileNative } from './native.js'

const RAW_ACCEPT = '.nef,.dng,.cr2,.cr3,.arw,.raf,.rw2,.orf,.tif,.tiff'

/* BatchButton — apply the current edit (`adj`) to many raws.
 *   Web:  pick multiple files → JPEGs zipped into one download.
 *   Desktop (Tauri): pick a folder → JPEGs written to <folder>/export/. */
export default function BatchButton({ adj }) {
  const inputRef = useRef(null)
  const [progress, setProgress] = useState(null) // null | { done, total, name }
  const [done, setDone] = useState(null) // null | { ok, fail }
  const busy = !!progress

  const zipDownload = async (results) => {
    const ok = results.filter((r) => r.blob)
    if (!ok.length) return
    const zip = new JSZip()
    ok.forEach((r) => zip.file(r.name, r.blob))
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'batch-export.zip'
    a.click()
    URL.revokeObjectURL(url)
  }

  const finish = (results) => {
    setProgress(null)
    setDone({ ok: results.filter((r) => r.blob).length, fail: results.filter((r) => r.error).length })
  }

  const onFiles = async (fileList) => {
    const files = [...(fileList || [])].filter(Boolean)
    if (!files.length) return
    setDone(null)
    const results = await runBatch(files, adj, { onProgress: setProgress })
    await zipDownload(results)
    finish(results)
  }

  const startNative = async () => {
    const picked = await pickRawFolder()
    if (!picked || !picked.files.length) return
    setDone(null)
    const files = []
    for (const p of picked.files) files.push(await readRawPath(p))
    const results = await runBatch(files, adj, { onProgress: setProgress })
    for (const r of results) {
      if (r.blob) {
        const bytes = new Uint8Array(await r.blob.arrayBuffer())
        await writeFileNative(`${picked.dir}/export/${r.name}`, bytes)
      }
    }
    finish(results)
  }

  const start = () => (IS_TAURI ? startNative() : inputRef.current?.click())

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={start} disabled={busy} title="Apply the current edit to many raws">
        {busy ? `Batch ${progress.done}/${progress.total}…` : 'Batch…'}
      </Button>
      {done && !busy && (
        <span className="kol-mono-12 text-meta">
          {done.ok} exported{done.fail ? ` · ${done.fail} failed` : ''}
        </span>
      )}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={RAW_ACCEPT}
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
    </div>
  )
}
