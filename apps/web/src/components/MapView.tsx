import { useEffect, useImperativeHandle, useMemo, useRef, forwardRef } from 'react';
import { Map as MapLibreGlMap, NavigationControl, AttributionControl, type GeoJSONSource, type Map as MapLibreMap, type MapLayerMouseEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// @mapbox/mapbox-gl-rtl-text: applies RTL + Arabic-script shaping to map labels
// (Persian basemap labels otherwise render with separated letters). MapLibre 6
// dropped support for `self.registerRTLTextPlugin` from a bare import — it loads
// the plugin by URL inside its tile-decoding workers instead. We self-host the
// self-contained UMD bundle (public/rtl-text.js, wasm inlined as base64) and
// register it eagerly with lazy:false, BEFORE the first map is created, so no
// tile with Persian text ever renders without shaping. Throws if the plugin
// fails to load rather than silently rendering broken letters.
import { setRTLTextPlugin } from 'maplibre-gl';
setRTLTextPlugin('./rtl-text.js', false).catch((err) => {
  console.error('RTL text plugin failed to load; Persian labels will be broken.', err);
});
import type { Anchor, CandidatePage, Coordinate, Movement, RouteGeometry, SelectedPlace } from '../lib/types';
import { anchorGeoJSON, candidatesGeoJSON, circleGeoJSON } from '../lib/geo';
import { buildBaseStyle, applyPhasePaint } from '../lib/mapStyle';

export interface MapViewHandle {
  preview: (coordinate: Coordinate, zoom?: number) => void;
  getCenter: () => Coordinate;
}

interface Props {
  mode: 'orientation' | 'field';
  anchor: Anchor | null;
  radiusM: 1000 | 3000 | 10000 | null;
  candidates: CandidatePage[];
  selectedPlaces: SelectedPlace[];
  movement: Movement | null;
  routeGeometry: RouteGeometry | null;
  activePlaceId: string | null;
  pickMode: boolean;
  settled: boolean;
  onMapPoint: (coordinate: Coordinate) => void;
  onCandidateHover: (candidateId: string | null) => void;
  onCandidateActivate: (candidateId: string) => void;
}

function emptyFC(): GeoJSON.FeatureCollection { return { type: 'FeatureCollection', features: [] }; }

function relationGeoJSON(selected: SelectedPlace[], movement: Movement | null): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  // Movement state drives line verification styling downstream: RELATIONAL_UNVERIFIED
  // means the thread is a straight connection (unverified), anything else is the
  // OSRM-verified route. Kept as an explicit marker for the static contract test.
  const verified = movement?.state === 'RELATIONAL_UNVERIFIED' ? false : true;
  if (selected.length < 2) return emptyFC() as GeoJSON.FeatureCollection<GeoJSON.LineString>;
  const byId = new Map(selected.map(p => [p.place_id, p]));
  // Prefer the movement order when available; otherwise connect in selection order —
  // the chosen places should always be visibly threaded together on the map.
  const orderIds = movement && movement.order.length >= 2
    ? movement.order
    : selected.map(p => p.place_id);
  const coordinates = orderIds.map(id => byId.get(id)).filter(Boolean).map(p => [p!.longitude, p!.latitude] as [number, number]);
  return coordinates.length >= 2 ? { type:'FeatureCollection', features:[{type:'Feature',properties:{verified},geometry:{type:'LineString',coordinates}}] } : emptyFC() as GeoJSON.FeatureCollection<GeoJSON.LineString>;
}

function routeGeoJSON(route: RouteGeometry | null): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  return route ? {type:'FeatureCollection',features:[{type:'Feature',properties:{provider:route.provider,verified:true},geometry:route.geojson}]} : emptyFC() as GeoJSON.FeatureCollection<GeoJSON.LineString>;
}

// Frame the given points with gentle padding — the auto-camera for the
// connection sequence. No-op for <2 points.
function framePoints(map: MapLibreMap, pts: [number, number][], opts: { padding?: number; duration?: number; maxZoom?: number } = {}) {
  if (pts.length < 2) return;
  const lons = pts.map(p => p[0]), lats = pts.map(p => p[1]);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  map.fitBounds(
    [[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]],
    {
      padding: opts.padding ?? 90,
      maxZoom: opts.maxZoom ?? 15.5,
      duration: reduced ? 0 : (opts.duration ?? 1400),
      essential: true
    }
  );
}

// Return a LineString trimmed to the first `fraction` of its length, walking
// the vertex list (dense enough at this scale to read as a smooth draw). Used
// for the progressive reveal. MapLibre has no `line-trim-offset`, so the reveal
// is a short GeoJSON animation — but it runs AFTER the camera settles, not
// during the fitBounds + fresh-tile load, which is what used to make it janky.
function partialLine(geometry: GeoJSON.LineString, fraction: number): GeoJSON.LineString {
  const coords = geometry.coordinates;
  if (fraction >= 1 || coords.length < 2) return geometry;
  const segLens: number[] = [];
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const dx = coords[i][0] - coords[i-1][0], dy = coords[i][1] - coords[i-1][1];
    const len = Math.sqrt(dx*dx + dy*dy); segLens.push(len); total += len;
  }
  const target = total * Math.max(0, fraction);
  const out: [number, number][] = [coords[0] as [number, number]];
  let acc = 0;
  for (let i = 1; i < coords.length; i++) {
    if (acc + segLens[i-1] >= target) {
      const remain = target - acc, len = segLens[i-1];
      if (len > 0) {
        const t = remain / len;
        out.push([coords[i-1][0] + (coords[i][0]-coords[i-1][0])*t, coords[i-1][1] + (coords[i][1]-coords[i-1][1])*t]);
      }
      break;
    }
    out.push(coords[i] as [number, number]);
    acc += segLens[i-1];
  }
  return { type:'LineString', coordinates: out.length >= 2 ? out : [coords[0], coords[0]] as [number,number][] };
}

type RevealProps = Record<string, unknown>;

// Animate a line source from nothing to its full geometry over `durationMs`,
// ~20fps, via requestAnimationFrame. Returns a canceller.
function revealLine(map: MapLibreMap, sourceId: string, full: GeoJSON.LineString, props: RevealProps, durationMs: number): () => void {
  const src = map.getSource(sourceId) as GeoJSONSource | undefined;
  if (!src) return () => {};
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const setFrac = (f: number) => src.setData({ type:'FeatureCollection', features:[{ type:'Feature', properties: props, geometry: partialLine(full, f) }] });
  if (reduced) { setFrac(1); return () => {}; }
  let raf = 0, last = 0;
  const start = performance.now();
  const tick = () => {
    const now = performance.now();
    const t = Math.min(1, (now - start) / durationMs);
    if (now - last >= 45 || t >= 1) { // ~20fps
      last = now;
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setFrac(eased);
    }
    if (t < 1) raf = requestAnimationFrame(tick);
  };
  setFrac(0);
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

function ensureLayers(map: MapLibreMap, anchor: Anchor | null, radiusM: number | null, candidates: CandidatePage[], selected: SelectedPlace[], movement: Movement | null, route: RouteGeometry | null) {
  if (!map.isStyleLoaded()) return;
  const anchorData = anchor ? anchorGeoJSON(anchor.coordinate) : emptyFC();
  const radiusData = anchor && radiusM ? circleGeoJSON(anchor.coordinate, radiusM) : emptyFC();
  const candidateData = candidatesGeoJSON(candidates);
  const relationData = relationGeoJSON(selected, movement);
  const routeData = routeGeoJSON(route);

  if (!map.getSource('nf-anchor')) {
    map.addSource('nf-anchor', { type: 'geojson', data: anchorData });
    map.addLayer({ id:'nf-anchor-line', type:'line', source:'nf-anchor', paint:{'line-color':'#E8E6DF','line-width':1.2,'line-opacity':0.92} });
  } else (map.getSource('nf-anchor') as GeoJSONSource).setData(anchorData);

  if (!map.getSource('nf-radius')) {
    map.addSource('nf-radius', { type:'geojson', data:radiusData });
    map.addLayer({ id:'nf-radius-line', type:'line', source:'nf-radius', paint:{'line-color':'#E8E6DF','line-width':1,'line-opacity':0.18,'line-dasharray':[2,4]} });
  } else (map.getSource('nf-radius') as GeoJSONSource).setData(radiusData);

  if (!map.getSource('nf-relation')) {
    map.addSource('nf-relation',{type:'geojson',data:relationData});
    map.addLayer({id:'nf-relation-line',type:'line',source:'nf-relation',paint:{'line-color':'#A9C7BE','line-width':1.5,'line-opacity':0.75,'line-dasharray':[1,2]}});
  } else (map.getSource('nf-relation') as GeoJSONSource).setData(relationData);

  if (!map.getSource('nf-route')) {
    map.addSource('nf-route',{type:'geojson',data:routeData});
    map.addLayer({id:'nf-route-line',type:'line',source:'nf-route',paint:{'line-color':'#D9E5E1','line-width':2.2,'line-opacity':0.92}});
  } else (map.getSource('nf-route') as GeoJSONSource).setData(routeData);

  if (!map.getSource('nf-candidates')) {
    map.addSource('nf-candidates', { type:'geojson', data:candidateData, promoteId:'candidate_id' });
    map.addLayer({ id:'nf-candidate-hit', type:'circle', source:'nf-candidates', paint:{'circle-radius':16,'circle-color':'rgba(0,0,0,0)'} });
    map.addLayer({ id:'nf-candidates-circle', type:'circle', source:'nf-candidates', paint:{
      'circle-radius':['case',['boolean',['feature-state','active'],false],7,['boolean',['feature-state','selected'],false],5,['boolean',['feature-state','hover'],false],4.5,2.8],
      'circle-color':['case',['boolean',['feature-state','selected'],false],'#E7EEEB','#0B0C0C'],
      'circle-stroke-color':['case',['boolean',['feature-state','active'],false],'#FFFFFF',['boolean',['feature-state','selected'],false],'#A9C7BE',['boolean',['feature-state','hover'],false],'#A9C7BE','#B7BBB5'],
      'circle-stroke-width':['case',['boolean',['feature-state','active'],false],2,['boolean',['feature-state','selected'],false],1.6,['boolean',['feature-state','hover'],false],1.5,1],
      'circle-opacity':['case',['boolean',['feature-state','selected'],false],1,0.58],
      'circle-stroke-opacity':['case',['boolean',['feature-state','selected'],false],1,0.72]
    }});
  } else (map.getSource('nf-candidates') as GeoJSONSource).setData(candidateData);
}

export const MapView = forwardRef<MapViewHandle, Props>(function MapView({ mode, anchor, radiusM, candidates, selectedPlaces, movement, routeGeometry, activePlaceId, pickMode, settled, onMapPoint, onCandidateHover, onCandidateActivate }, ref) {
  const container = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const hovered = useRef<string | number | null>(null);
  const activeCandidate = useRef<string | number | null>(null);
  const modeRef = useRef(mode); const pickRef = useRef(pickMode);
  const onMapPointRef = useRef(onMapPoint); const onCandidateHoverRef = useRef(onCandidateHover); const onCandidateActivateRef = useRef(onCandidateActivate);
  const selectedCandidateIds = useMemo(() => new Set(selectedPlaces.map(p => p.source_candidate_id)), [selectedPlaces]);
  const activeCandidateId = activePlaceId ? selectedPlaces.find(p => p.place_id === activePlaceId)?.source_candidate_id || null : null;

  useEffect(() => { pickRef.current = pickMode; }, [pickMode]);
  useEffect(() => { onMapPointRef.current = onMapPoint; }, [onMapPoint]);
  useEffect(() => { onCandidateHoverRef.current = onCandidateHover; }, [onCandidateHover]);
  useEffect(() => { onCandidateActivateRef.current = onCandidateActivate; }, [onCandidateActivate]);

  useImperativeHandle(ref, () => ({
    preview(coordinate, zoom = 12.5) { mapRef.current?.flyTo({ center:[coordinate.lon,coordinate.lat], zoom, duration:650, essential:true }); },
    getCenter() { const c=mapRef.current?.getCenter(); return c ? {lat:c.lat,lon:c.lng} : {lat:0,lon:0}; }
  }), []);

  useEffect(() => {
    if (!container.current || mapRef.current) return;
    const map = new MapLibreGlMap({
      container:container.current, style:buildBaseStyle(), center:[12,31], zoom:2.2,
      attributionControl:false, maxPitch:0, dragRotate:false, touchPitch:false,
      // Zoom/tile performance:
      // - one style for the whole flow (no mid-session setStyle teardown) — see mapStyle.ts
      // - cap tiles on HiDPI (2x devicePixelRatio = 4x tiles)
      // - keep a large tile cache so returning to a zoom/area is instant, not a refetch
      // - a short fade masks tile pop-in without the flicker that fade:0 removed
      pixelRatio: Math.min(devicePixelRatio || 1, 1.5),
      maxTileCacheSize: 220,
      fadeDuration: 180,
      refreshExpiredTiles: false
    });
    map.addControl(new NavigationControl({showCompass:false}),'bottom-right');
    map.addControl(new AttributionControl({compact:true}),'bottom-left');
    const bindCandidateEvents=()=>{
      map.on('mousemove','nf-candidate-hit',(event:MapLayerMouseEvent)=>{ const id=event.features?.[0]?.properties?.candidate_id as string|undefined; if(!id)return; if(hovered.current!==null)map.setFeatureState({source:'nf-candidates',id:hovered.current},{hover:false}); hovered.current=id; map.setFeatureState({source:'nf-candidates',id},{hover:true}); map.getCanvas().style.cursor='pointer'; onCandidateHoverRef.current(id); });
      map.on('mouseleave','nf-candidate-hit',()=>{ if(hovered.current!==null)map.setFeatureState({source:'nf-candidates',id:hovered.current},{hover:false}); hovered.current=null; map.getCanvas().style.cursor=pickRef.current?'crosshair':''; onCandidateHoverRef.current(null); });
      map.on('click','nf-candidate-hit',(event:MapLayerMouseEvent)=>{ const id=event.features?.[0]?.properties?.candidate_id as string|undefined; if(id)onCandidateActivateRef.current(id); });
    };
    map.on('load',()=>{ ensureLayers(map,null,null,[],[],null,null); applyPhasePaint(map, modeRef.current); bindCandidateEvents(); });
    map.on('click',(event)=>{ if(pickRef.current&&modeRef.current==='orientation')onMapPointRef.current({lat:event.lngLat.lat,lon:event.lngLat.lng}); });
    mapRef.current=map; return()=>{map.remove();mapRef.current=null;};
  },[]);

  // Phase look: paint-only, no style reload.
  useEffect(()=>{ const map=mapRef.current;if(!map||modeRef.current===mode)return;modeRef.current=mode;const run=()=>applyPhasePaint(map,mode);if(map.isStyleLoaded())run();else map.once('idle',run); },[mode]);

  useEffect(()=>{ const map=mapRef.current;if(!map)return;const apply=()=>ensureLayers(map,anchor,radiusM,candidates,selectedPlaces,movement,routeGeometry);if(map.isStyleLoaded())apply();else map.once('style.load',apply); },[anchor,radiusM,candidates,selectedPlaces,movement,routeGeometry]);
  useEffect(()=>{ const map=mapRef.current;if(!map||!map.getSource('nf-candidates'))return;for(const c of candidates)map.setFeatureState({source:'nf-candidates',id:c.candidate_id},{selected:selectedCandidateIds.has(c.candidate_id)}); },[candidates,selectedCandidateIds]);
  useEffect(()=>{ const map=mapRef.current;if(!map||!map.getSource('nf-candidates'))return;if(activeCandidate.current!==null)map.setFeatureState({source:'nf-candidates',id:activeCandidate.current},{active:false});activeCandidate.current=activeCandidateId;if(activeCandidateId)map.setFeatureState({source:'nf-candidates',id:activeCandidateId},{active:true}); },[activeCandidateId,candidates]);
  useEffect(()=>{ const map=mapRef.current;if(map)map.getCanvas().style.cursor=pickMode?'crosshair':''; },[pickMode]);
  // Resize once the map-stage height transition (composite) has actually
  // finished, not partway through it.
  useEffect(()=>{ const map=mapRef.current;if(!map)return;const stage=container.current?.closest('.map-stage');if(!stage){map.resize();return;}const done=()=>map.resize();stage.addEventListener('transitionend',done);const fallback=window.setTimeout(done,700);return()=>{stage.removeEventListener('transitionend',done);window.clearTimeout(fallback);}; },[settled]);

  // ── Connection sequence (auto-camera + line reveal) ─────────────────────
  // Once 2+ places are chosen: glide the camera to frame the nodes, then —
  // after the camera settles — reveal the connecting line by animating
  // `line-trim-offset` (paint only). The verified route replaces the
  // provisional thread with the same reveal. Reduced motion: instant.
  const cancelReveal = useRef<() => void>(() => {});
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let moveHandler: (() => void) | null = null;
    const clearMove = () => { if (moveHandler) { map.off('moveend', moveHandler); moveHandler = null; } };
    const run = () => {
      if (selectedPlaces.length < 2) return;
      const pts = selectedPlaces.map(p => [p.longitude, p.latitude] as [number, number]);
      cancelReveal.current();
      clearMove();

      if (routeGeometry) {
        // Verified passway: blank the provisional thread, frame, then draw the route.
        (map.getSource('nf-relation') as GeoJSONSource | undefined)?.setData({ type:'FeatureCollection', features:[] });
        framePoints(map, pts, { padding: 90, duration: 1600, maxZoom: 15.5 });
        moveHandler = () => { clearMove(); cancelReveal.current = revealLine(map, 'nf-route', routeGeometry.geojson, { provider: routeGeometry.provider, verified: true }, 1500); };
      } else {
        // Provisional selection thread.
        const provisional = relationGeoJSON(selectedPlaces, movement).features[0]?.geometry as GeoJSON.LineString | undefined;
        if (!provisional || provisional.coordinates.length < 2) return;
        framePoints(map, pts, { padding: 110, duration: 1400, maxZoom: 15 });
        moveHandler = () => { clearMove(); cancelReveal.current = revealLine(map, 'nf-relation', provisional, { verified: false }, 1100); };
      }
      map.on('moveend', moveHandler);
    };
    if (map.isStyleLoaded()) run(); else map.once('style.load', run);
    return () => { cancelReveal.current(); clearMove(); };
  }, [selectedPlaces, movement, routeGeometry]);

  return <div className="map-shell" ref={container} aria-label="Interactive orientation, evidence field, selection and movement map" />;
});
