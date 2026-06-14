import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), svgr(), tailwindcss()],
  // Workspace hoisting can leave two physical React copies in the tree
  // (root vs app node_modules), which crashes at runtime with a null
  // dispatcher. Force a single react / react-dom copy.
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  // libraw-wasm spawns a module Worker via `new Worker(new URL('./worker.js',
  // import.meta.url))` and the worker resolves libraw.wasm the same way.
  // esbuild dep pre-bundling mangles that URL resolution, so exclude it and let
  // Vite emit the worker + wasm as real assets.
  optimizeDeps: {
    exclude: ['libraw-wasm'],
  },
  // libraw.wasm is a pthread build. Threads need SharedArrayBuffer, which the
  // browser only exposes under cross-origin isolation (COOP+COEP). Without these
  // headers the decode falls back to single-threaded. Mirror them on `preview`
  // so a prod-style serve behaves the same; the CDN host must send them too.
  server: {
    host: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
})
