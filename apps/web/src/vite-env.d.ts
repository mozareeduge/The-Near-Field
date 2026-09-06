/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Deployed Cloudflare Worker origin the app calls for all data ops. */
  readonly VITE_API_BASE?: string;
  /** MapTiler key — when set, basemap tiles load from MapTiler's CDN
   *  instead of the slower keyless OpenFreeMap origin. */
  readonly VITE_MAPTILER_KEY?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
