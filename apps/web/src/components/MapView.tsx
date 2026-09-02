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

const ORIENTATION_STYLE = 'https://tiles.openfreemap.org/styles/positron';
const FIELD_STYLE = 'https://tiles.openfreemap.org/styles/fiord';

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
  if (selected.length < 2) return emptyFC() as GeoJSON.FeatureCollection<GeoJSON.LineString>;
  const byId = new Map(selected.map(p => [p.place_id, p]));
  // Prefer the movement order when available; otherwise connect in selection order —
  // the chosen places should always be visibly threaded together on the map.
  const orderIds = movement && movement.order.length >= 2
    ? movement.order
    : selected.map(p => p.place_id);
  const coordinates = orderIds.map(id => byId.get(id)).filter(Boolean).map(p => [p!.longitude, p!.latitude] as [number, number]);
  return coordinates.length >= 2 ? { type:'FeatureCollection', features:[{type:'Feature',properties:{verified:false},geometry:{type:'LineString',coordinates}}] } : emptyFC() as GeoJSON.FeatureCollection<GeoJSON.LineString>;
}

function routeGeoJSON(route: RouteGeometry | null): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  return route ? {type:'FeatureCollection',features:[{type:'Feature',properties:{provider:route.provider,verified:true},geometry:route.geojson}]} : emptyFC() as GeoJSON.FeatureCollection<GeoJSON.LineString>;
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
    const map = new MapLibreGlMap({ container:container.current, style:ORIENTATION_STYLE, center:[12,31], zoom:2.2, attributionControl:false, maxPitch:0, dragRotate:false, touchPitch:false });
    map.addControl(new NavigationControl({showCompass:false}),'bottom-right');
    map.addControl(new AttributionControl({compact:true}),'bottom-left');
    const bindCandidateEvents=()=>{
      map.on('mousemove','nf-candidate-hit',(event:MapLayerMouseEvent)=>{ const id=event.features?.[0]?.properties?.candidate_id as string|undefined; if(!id)return; if(hovered.current!==null)map.setFeatureState({source:'nf-candidates',id:hovered.current},{hover:false}); hovered.current=id; map.setFeatureState({source:'nf-candidates',id},{hover:true}); map.getCanvas().style.cursor='pointer'; onCandidateHoverRef.current(id); });
      map.on('mouseleave','nf-candidate-hit',()=>{ if(hovered.current!==null)map.setFeatureState({source:'nf-candidates',id:hovered.current},{hover:false}); hovered.current=null; map.getCanvas().style.cursor=pickRef.current?'crosshair':''; onCandidateHoverRef.current(null); });
      map.on('click','nf-candidate-hit',(event:MapLayerMouseEvent)=>{ const id=event.features?.[0]?.properties?.candidate_id as string|undefined; if(id)onCandidateActivateRef.current(id); });
    };
    map.on('load',()=>{ ensureLayers(map,null,null,[],[],null,null); bindCandidateEvents(); });
    map.on('click',(event)=>{ if(pickRef.current&&modeRef.current==='orientation')onMapPointRef.current({lat:event.lngLat.lat,lon:event.lngLat.lng}); });
    mapRef.current=map; return()=>{map.remove();mapRef.current=null;};
  },[]);

  useEffect(()=>{ const map=mapRef.current;if(!map||modeRef.current===mode)return;modeRef.current=mode;map.setStyle(mode==='field'?FIELD_STYLE:ORIENTATION_STYLE,{diff:false});map.once('style.load',()=>ensureLayers(map,anchor,radiusM,candidates,selectedPlaces,movement,routeGeometry)); },[mode]);
  useEffect(()=>{ const map=mapRef.current;if(!map)return;const apply=()=>ensureLayers(map,anchor,radiusM,candidates,selectedPlaces,movement,routeGeometry);if(map.isStyleLoaded())apply();else map.once('style.load',apply); },[anchor,radiusM,candidates,selectedPlaces,movement,routeGeometry]);
  useEffect(()=>{ const map=mapRef.current;if(!map||!map.getSource('nf-candidates'))return;for(const c of candidates)map.setFeatureState({source:'nf-candidates',id:c.candidate_id},{selected:selectedCandidateIds.has(c.candidate_id)}); },[candidates,selectedCandidateIds]);
  useEffect(()=>{ const map=mapRef.current;if(!map||!map.getSource('nf-candidates'))return;if(activeCandidate.current!==null)map.setFeatureState({source:'nf-candidates',id:activeCandidate.current},{active:false});activeCandidate.current=activeCandidateId;if(activeCandidateId)map.setFeatureState({source:'nf-candidates',id:activeCandidateId},{active:true}); },[activeCandidateId,candidates]);
  useEffect(()=>{ const map=mapRef.current;if(map)map.getCanvas().style.cursor=pickMode?'crosshair':''; },[pickMode]);
  useEffect(()=>{ const map=mapRef.current;if(!map)return;const id=window.setTimeout(()=>map.resize(),360);return()=>window.clearTimeout(id); },[settled]);

  return <div className="map-shell" ref={container} aria-label="Interactive orientation, evidence field, selection and movement map" />;
});
