import type { StyleSpecification } from 'maplibre-gl';
import raw from '../basemap/nf-dark-style.json';

// One basemap for the whole flow — the hand-recoloured "Near Field Dark"
// (authority palette baked in). Earlier the app swapped to a second, remote
// style ('.../styles/fiord') when the field appeared; that `setStyle` was a
// full teardown + refetch of every tile from a slow origin, right when the
// user started engaging. Gone. Phase differences are paint-only now
// (see applyPhasePaint).
//
// Tiles: MapTiler's OpenMapTiles-schema vector tiles when VITE_MAPTILER_KEY is
// set (global CDN — the fix for slow/partial loads), otherwise the keyless
// OpenFreeMap origin so the map still works with no key configured. The
// recoloured layers are schema-identical between the two, so only the source
// URL changes. Glyphs/sprite stay on OpenFreeMap (keyless, light traffic).

const MAPTILER_KEY = (import.meta.env.VITE_MAPTILER_KEY || '').trim();

const OPENFREEMAP_TILES = 'https://tiles.openfreemap.org/planet';
const MAPTILER_TILES = (key: string) =>
  `https://api.maptiler.com/tiles/v3/tiles.json?key=${encodeURIComponent(key)}`;

export const usingCdnTiles = MAPTILER_KEY.length > 0;

export function buildBaseStyle(): StyleSpecification {
  // structuredClone so we never mutate the imported JSON module across HMR
  const style = structuredClone(raw) as unknown as StyleSpecification;

  // Drop the orphan raster hillshade source (declared, no layer referenced it —
  // dead weight in the JSON).
  if (style.sources && 'ne2_shaded' in style.sources) delete (style.sources as Record<string, unknown>).ne2_shaded;

  const omt = style.sources?.openmaptiles as { type: 'vector'; url?: string; tiles?: string[] } | undefined;
  if (omt) {
    if (MAPTILER_KEY) { omt.url = MAPTILER_TILES(MAPTILER_KEY); delete omt.tiles; }
    else omt.url = OPENFREEMAP_TILES;
  }
  return style;
}

// Phase look without reloading the style: field/reading phases sit a touch
// dimmer and lower-contrast so the overlay marks and prose carry the eye.
// Applied with setPaintProperty on layers that already exist.
export function applyPhasePaint(map: import('maplibre-gl').Map, mode: 'orientation' | 'field') {
  if (!map.isStyleLoaded()) return;
  const dim = mode === 'field';
  for (const layer of map.getStyle().layers ?? []) {
    if (layer.type === 'symbol') {
      try { map.setPaintProperty(layer.id, 'text-opacity', dim ? 0.55 : 0.9); } catch { /* layer has no text */ }
    }
  }
}
