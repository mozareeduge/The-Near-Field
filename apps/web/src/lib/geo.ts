import type { CandidatePage, Coordinate } from './types';

export function circleGeoJSON(center: Coordinate, radiusM: number, steps = 96): GeoJSON.Feature<GeoJSON.Polygon> {
  const earth = 6371008.8;
  const angular = radiusM / earth;
  const lat1 = center.lat * Math.PI / 180;
  const lon1 = center.lon * Math.PI / 180;
  const coordinates: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const bearing = (i / steps) * Math.PI * 2;
    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(angular) + Math.cos(lat1) * Math.sin(angular) * Math.cos(bearing));
    const lon2 = lon1 + Math.atan2(Math.sin(bearing) * Math.sin(angular) * Math.cos(lat1), Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2));
    coordinates.push([lon2 * 180 / Math.PI, lat2 * 180 / Math.PI]);
  }
  return { type: 'Feature', properties: { radiusM }, geometry: { type: 'Polygon', coordinates: [coordinates] } };
}

export function candidatesGeoJSON(candidates: CandidatePage[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: candidates.map(c => ({
      type: 'Feature',
      id: c.candidate_id,
      properties: {
        candidate_id: c.candidate_id,
        title: c.title,
        distance_m: c.distance_from_anchor_m
      },
      geometry: { type: 'Point', coordinates: [c.longitude, c.latitude] }
    }))
  };
}

export function anchorGeoJSON(center: Coordinate): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  const latDelta = 0.00007;
  const lonDelta = latDelta / Math.max(0.2, Math.cos(center.lat * Math.PI / 180));
  return {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[center.lon - lonDelta, center.lat], [center.lon + lonDelta, center.lat]] } },
      { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[center.lon, center.lat - latDelta], [center.lon, center.lat + latDelta]] } }
    ]
  };
}

export function formatDistance(meters: number) {
  return meters < 1000 ? `${meters} m` : `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} km`;
}
