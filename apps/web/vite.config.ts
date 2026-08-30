import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
