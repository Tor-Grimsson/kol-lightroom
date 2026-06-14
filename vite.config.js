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
  // NOTE: no COOP/COEP cross-origin-isolation headers. They would let
  // libraw.wasm use threads (~1s faster full decode), but cross-origin isolation
  // blocks/breaks cross-origin CDN <img> loads inconsistently across browsers —
  // and loading B2 images is core to the Library. The decode runs single-threaded
  // (the 2.6s preview path is unaffected); reliable images win. Don't re-add the
  // headers without also solving cross-origin image loading.
  server: {
    host: true,
  },
})
