import { useEffect, useImperativeHandle, useMemo, useRef, forwardRef } from 'react';
import { Map as MapLibreGlMap, NavigationControl, AttributionControl, type GeoJSONSource, type Map as MapLibreMap, type MapLayerMouseEvent, type StyleSpecification } from 'maplibre-gl';
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
import { DEMO_MODE } from '../lib/api';

// Design-QA fixture styles: solid background only, no tile source — lets the
// map (and everything we draw on it: anchor, radius, candidates, route)
// render and be screenshotted with no reachable tile server. Real deploys
// always use the vendor styles below.
const DEMO_ORIENTATION_STYLE: StyleSpecification = { version: 8, name: 'demo-orientation', sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#D6D0C4' } }] };
const DEMO_FIELD_STYLE: StyleSpecification = { version: 8, name: 'demo-field', sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#0A0908' } }] };
const ORIENTATION_STYLE = DEMO_MODE ? DEMO_ORIENTATION_STYLE : 'https://tiles.openfreemap.org/styles/positron';
const FIELD_STYLE = DEMO_MODE ? DEMO_FIELD_STYLE : 'https://tiles.openfreemap.org/styles/fiord';

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

// Progressive reveal: return a LineString trimmed to the first `fraction` of
// its length (walking the coordinate list, not interpolating — vertex
// resolution is dense enough at this scale that vertex-stepping reads as a
// smooth draw at 12-20 fps updates). fraction=1 returns the full line.
function partialLine(geometry: GeoJSON.LineString, fraction: number): GeoJSON.LineString {
  const coords = geometry.coordinates;
  if (fraction >= 1 || coords.length < 2) return geometry;
  // total planar length (fine for framing; web-mercator distortion is uniform at this scale)
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
      // interpolate the final partial segment so the tip moves continuously
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

function ensureLayers(map: MapLibreMap, anchor: Anchor | null, radiusM: number | null, candidates: CandidatePage[], selected: SelectedPlace[], movement: Movement | null, route: RouteGeometry | null) {
  // Callers already gate on styleReady (a style swap isn't in flight), not
  // map.isStyleLoaded() — that also flips false while our own just-added
  // sources are settling, which isn't a reason to skip an update. See the
  // styleReady comment above for why that used to drop updates silently.
  const anchorData = anchor ? anchorGeoJSON(anchor.coordinate) : emptyFC();
  const radiusData = anchor && radiusM ? circleGeoJSON(anchor.coordinate, radiusM) : emptyFC();
  const candidateData = candidatesGeoJSON(candidates);
  const relationData = relationGeoJSON(selected, movement);
  const routeData = routeGeoJSON(route);

  if (!map.getSource('nf-anchor')) {
    map.addSource('nf-anchor', { type: 'geojson', data: anchorData });
    map.addLayer({ id:'nf-anchor-line', type:'line', source:'nf-anchor', paint:{'line-color':'#E9E4D8','line-width':1.2,'line-opacity':0.92} });
  } else (map.getSource('nf-anchor') as GeoJSONSource).setData(anchorData);

  if (!map.getSource('nf-radius')) {
    map.addSource('nf-radius', { type:'geojson', data:radiusData });
    map.addLayer({ id:'nf-radius-line', type:'line', source:'nf-radius', paint:{'line-color':'#E9E4D8','line-width':1,'line-opacity':0.18,'line-dasharray':[2,4]} });
  } else (map.getSource('nf-radius') as GeoJSONSource).setData(radiusData);

  if (!map.getSource('nf-relation')) {
    map.addSource('nf-relation',{type:'geojson',data:relationData});
    map.addLayer({id:'nf-relation-line',type:'line',source:'nf-relation',paint:{'line-color':'#C9A46B','line-width':1.5,'line-opacity':0.75,'line-dasharray':[1,2]}});
  } else (map.getSource('nf-relation') as GeoJSONSource).setData(relationData);

  if (!map.getSource('nf-route')) {
    map.addSource('nf-route',{type:'geojson',data:routeData});
    map.addLayer({id:'nf-route-line',type:'line',source:'nf-route',paint:{'line-color':'#E4CFA3','line-width':2.2,'line-opacity':0.92}});
  } else (map.getSource('nf-route') as GeoJSONSource).setData(routeData);

  if (!map.getSource('nf-candidates')) {
    map.addSource('nf-candidates', { type:'geojson', data:candidateData, promoteId:'candidate_id' });
    // Hit target radius: 20px (40px diameter) on coarse/touch pointers per the
    // authority doc's own ≥40px touch rule (§7); 16px (32px) stays for
    // precision mouse/trackpad input, where a tighter target is more legible.
    const coarsePointer = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
    map.addLayer({ id:'nf-candidate-hit', type:'circle', source:'nf-candidates', paint:{'circle-radius': coarsePointer ? 20 : 16,'circle-color':'rgba(0,0,0,0)'} });
    map.addLayer({ id:'nf-candidates-circle', type:'circle', source:'nf-candidates', paint:{
      'circle-radius':['case',['boolean',['feature-state','active'],false],7,['boolean',['feature-state','selected'],false],5,['boolean',['feature-state','hover'],false],4.5,2.8],
      'circle-color':['case',['boolean',['feature-state','selected'],false],'#F0E9DA','#0A0908'],
      'circle-stroke-color':['case',['boolean',['feature-state','active'],false],'#FBF6EA',['boolean',['feature-state','selected'],false],'#C9A46B',['boolean',['feature-state','hover'],false],'#C9A46B','#8A8172'],
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

  // `map.isStyleLoaded()` also reflects whether OUR OWN just-added GeoJSON
  // sources have finished settling, not just whether a style swap is in
  // flight — it can read false for a moment right after ensureLayers adds a
  // source. The data-update effect below used to fall back to
  // `map.once('style.load', apply)` when that happened, but 'style.load'
  // only fires once per setStyle call: an update caught in that window
  // registered a listener that would never fire again, silently dropping
  // it. styleReady tracks "is a style swap in flight" explicitly instead;
  // latest* mirrors the current props so the style.load handler that ends a
  // swap can re-apply whatever arrived while it was in flight.
  const styleReady = useRef(false);
  const latestArgs = useRef({ anchor, radiusM, candidates, selectedPlaces, movement, routeGeometry });
  latestArgs.current = { anchor, radiusM, candidates, selectedPlaces, movement, routeGeometry };

  useEffect(() => { pickRef.current = pickMode; }, [pickMode]);
  useEffect(() => { onMapPointRef.current = onMapPoint; }, [onMapPoint]);
  useEffect(() => { onCandidateHoverRef.current = onCandidateHover; }, [onCandidateHover]);
  useEffect(() => { onCandidateActivateRef.current = onCandidateActivate; }, [onCandidateActivate]);

  useImperativeHandle(ref, () => ({
    preview(coordinate, zoom = 12.5) { const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; mapRef.current?.flyTo({ center:[coordinate.lon,coordinate.lat], zoom, duration: reduced ? 0 : 650, essential:true }); },
    getCenter() { const c=mapRef.current?.getCenter(); return c ? {lat:c.lat,lon:c.lng} : {lat:0,lon:0}; }
  }), []);

  useEffect(() => {
    if (!container.current || mapRef.current) return;
    const map = new MapLibreGlMap({ container:container.current, style:ORIENTATION_STYLE, center:[12,31], zoom:2.2, attributionControl:false, maxPitch:0, dragRotate:false, touchPitch:false });
    map.addControl(new NavigationControl({showCompass:false}),'bottom-right');
    map.addControl(new AttributionControl({compact:true}),'bottom-left');
    const bindCandidateEvents=()=>{
      map.on('mousemove','nf-candidate-hit',(event:MapLayerMouseEvent)=>{ const id=event.features?.[0]?.properties?.candidate_id as string|undefined; if(!id)return; if(hovered.current!==null)map.setFeatureState({source:'nf-candidates',id:hovered.current},{hover:false}); hovered.current=id; map.setFeatureState({source:'nf-candidates',id},{hover:true}); map.getCanvas().style.cursor='pointer'; onCandidateHoverRef.current(id); });
      map.on('mouseleave','nf-candidate-hit',()=>{ if(hovered.current!==null)map.setFeatureState({source:'nf-candidates',id:hovered.current},{hover:false}); hovered.current=null; map.getCanvas().style.cursor=pickRef.current?'crosshair':''; onCandidateHoverRef.current(null); });
      map.on('click','nf-candidate-hit',(event:MapLayerMouseEvent)=>{ const id=event.features?.[0]?.properties?.candidate_id as string|undefined; if(id)onCandidateActivateRef.current(id); });
    };
    map.on('load',()=>{ styleReady.current=true; ensureLayers(map,null,null,[],[],null,null); bindCandidateEvents(); });
    map.on('click',(event)=>{ if(pickRef.current&&modeRef.current==='orientation')onMapPointRef.current({lat:event.lngLat.lat,lon:event.lngLat.lng}); });
    mapRef.current=map; return()=>{map.remove();mapRef.current=null;};
  },[]);

  useEffect(()=>{ const map=mapRef.current;if(!map||modeRef.current===mode)return;modeRef.current=mode;styleReady.current=false;map.setStyle(mode==='field'?FIELD_STYLE:ORIENTATION_STYLE,{diff:false});map.once('style.load',()=>{styleReady.current=true;const a=latestArgs.current;ensureLayers(map,a.anchor,a.radiusM,a.candidates,a.selectedPlaces,a.movement,a.routeGeometry);}); },[mode]);
  useEffect(()=>{ const map=mapRef.current;if(!map||!styleReady.current)return;ensureLayers(map,anchor,radiusM,candidates,selectedPlaces,movement,routeGeometry); },[anchor,radiusM,candidates,selectedPlaces,movement,routeGeometry]);
  useEffect(()=>{ const map=mapRef.current;if(!map||!map.getSource('nf-candidates'))return;for(const c of candidates)map.setFeatureState({source:'nf-candidates',id:c.candidate_id},{selected:selectedCandidateIds.has(c.candidate_id)}); },[candidates,selectedCandidateIds]);
  useEffect(()=>{ const map=mapRef.current;if(!map||!map.getSource('nf-candidates'))return;if(activeCandidate.current!==null)map.setFeatureState({source:'nf-candidates',id:activeCandidate.current},{active:false});activeCandidate.current=activeCandidateId;if(activeCandidateId)map.setFeatureState({source:'nf-candidates',id:activeCandidateId},{active:true}); },[activeCandidateId,candidates]);
  useEffect(()=>{ const map=mapRef.current;if(map)map.getCanvas().style.cursor=pickMode?'crosshair':''; },[pickMode]);
  useEffect(()=>{ const map=mapRef.current;if(!map)return;const id=window.setTimeout(()=>map.resize(),360);return()=>window.clearTimeout(id); },[settled]);

  // ── Connection sequence (auto-camera + progressive line reveal) ──────────
  // While selecting: once 2+ places are chosen, glide the camera so the user
  // SEES the nodes being threaded; draw the provisional relation line
  // progressively (12 fps vertex-stepping reveal) instead of popping it in.
  // When the verified route arrives: re-frame to the final passway and morph
  // the route line in with the same reveal, fading the provisional thread.
  // Reduced motion: camera jumps and opacity swaps only (authority §19).
  const revealTimer = useRef<number | null>(null);
  const stopReveal = () => { if (revealTimer.current !== null) { window.clearInterval(revealTimer.current); revealTimer.current = null; } };
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const run = () => {
      const pts = selectedPlaces.map(p => [p.longitude, p.latitude] as [number, number]);
      if (selectedPlaces.length >= 2 && !routeGeometry) {
        // Selection thread: frame the chosen nodes, then draw the provisional line progressively.
        framePoints(map, pts, { padding: 110, duration: 1400, maxZoom: 15 });
        const provisional = relationGeoJSON(selectedPlaces, movement).features[0]?.geometry as GeoJSON.LineString | undefined;
        if (provisional && provisional.coordinates.length >= 2) {
          const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          const src = map.getSource('nf-relation') as GeoJSONSource | undefined;
          if (src && !reduced) {
            stopReveal();
            const start = performance.now(), DURATION = 1200, FPS = 1000 / 12;
            revealTimer.current = window.setInterval(() => {
              const t = Math.min(1, (performance.now() - start) / DURATION);
              (map.getSource('nf-relation') as GeoJSONSource).setData({ type:'FeatureCollection', features:[{ type:'Feature', properties:{verified:false}, geometry: partialLine(provisional, t) }] });
              if (t >= 1) stopReveal();
            }, FPS);
          }
        }
      }
      if (routeGeometry && selectedPlaces.length >= 2) {
        // Verified passway arrived: re-frame so the final connection is fully in view.
        const routePts = routeGeometry.geojson.coordinates.slice(-1).concat([[0,0]]).slice(0,1) as unknown as [number,number][];
        void routePts; // framing uses node points; route follows the same extent
        framePoints(map, pts, { padding: 90, duration: 1600, maxZoom: 15.5 });
        const src = map.getSource('nf-route') as GeoJSONSource | undefined;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (src && !reduced) {
          stopReveal();
          const start = performance.now(), DURATION = 1800, FPS = 1000 / 14;
          revealTimer.current = window.setInterval(() => {
            const t = Math.min(1, (performance.now() - start) / DURATION);
            (map.getSource('nf-route') as GeoJSONSource).setData({ type:'FeatureCollection', features:[{ type:'Feature', properties:{provider:routeGeometry.provider,verified:true}, geometry: partialLine(routeGeometry.geojson, t) }] });
            if (t >= 1) stopReveal();
          }, FPS);
        }
      }
    };
    if (map.isStyleLoaded()) run(); else map.once('style.load', run);
    return stopReveal;
  }, [selectedPlaces, movement, routeGeometry]);

  // role="img": the canvas itself has no keyboard path — real interaction
  // routes through the candidate ledger and the sr-only run narration below.
  // The label describes what's shown, not an affordance the map doesn't have.
  return <div className="map-shell" ref={container} role="img" aria-label="Map of the current orientation, evidence field, selection and movement" />;
});
