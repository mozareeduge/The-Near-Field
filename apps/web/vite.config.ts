import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { createRequire } from 'node:module';
import { copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(import.meta.url);

// MapLibre GL resolves its tile-decoding worker script at *runtime* via
// `new URL('./maplibre-gl-worker.mjs', import.meta.url)`, computed from a
// template literal Vite's static asset scanner can't trace -- so Vite
// never copies that file into the build on its own, and the app silently
// gets a 404 for it in production (masked in `vite preview`, which fakes a
// 200 via its SPA fallback for any missing path). That worker file itself
// has a plain `import ... from "./maplibre-gl-shared.mjs"` -- a real
// runtime module the browser resolves relative to the worker's own URL,
// so it needs to sit right next to it too. Copy both into dist/assets/
// under their exact expected filenames. Confirmed via a real headless-
// browser run against the actual built output (not `vite preview`, whose
// SPA fallback masks a missing file as a fake 200), not assumed from docs.
function copyMaplibreWorker(): Plugin {
  let outDir = 'dist';
  return {
    name: 'copy-maplibre-worker',
    apply: 'build',
    configResolved(config) { outDir = config.build.outDir; },
    closeBundle() {
      const assetsDir = join(outDir, 'assets');
      mkdirSync(assetsDir, { recursive: true });
      for (const file of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']) {
        copyFileSync(require.resolve(`maplibre-gl/dist/${file}`), join(assetsDir, file));
      }
      // @mapbox/mapbox-gl-rtl-text UMD bundle (self-contained, wasm inlined),
      // registered at runtime via maplibre's setRTLTextPlugin('./rtl-text.js').
      // MapLibre 6 loads it inside its workers by URL, so it must ship as a
      // real static file next to the app, not be bundled.
      // package.json maps '.' to src/index.js; the dist file lives one level up
      copyFileSync(
        join(require.resolve('@mapbox/mapbox-gl-rtl-text'), '..', '..', 'dist', 'mapbox-gl-rtl-text.js'),
        join(outDir, 'rtl-text.js')
      );
    }
  };
}

export default defineConfig({
  plugins: [react(), copyMaplibreWorker()],
  base: './',
  build: {
    rollupOptions: {
      output: {
        // maplibre-gl alone accounts for most of the ~1.2MB single-chunk
        // warning this build otherwise produces. Splitting it out lets the
        // browser cache it separately from app code that changes far more
        // often, and lets the two download in parallel on first load --
        // real load-time cost on a GitHub Pages deploy, not a cosmetic fix.
        manualChunks: {
          maplibre: ['maplibre-gl']
        }
      }
    }
  }
});
