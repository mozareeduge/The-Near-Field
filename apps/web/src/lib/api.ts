import type { CandidateField, SearchResult, GathererOutput, ModelMeta, Movement, NearbyFieldSynthesis, RouteGeometry } from './types';

const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:8787').replace(/\/$/, '');

export async function searchPlaces(query: string, signal?: AbortSignal, proximity?: { lat: number; lon: number }) {
  const url = new URL(`${API_BASE}/api/search`);
  url.searchParams.set('q', query);
  if (proximity) url.searchParams.set('proximity', `${proximity.lon},${proximity.lat}`);
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Search failed (${response.status})`);
  const data = await response.json() as { results: SearchResult[]; provider: string; error?: string };
  return data;
}

export async function fetchField(anchor: { label: string | null; coordinate: { lat: number; lon: number } }, signal?: AbortSignal) {
  const url = new URL(`${API_BASE}/api/field`);
  url.searchParams.set('lat', String(anchor.coordinate.lat));
  url.searchParams.set('lon', String(anchor.coordinate.lon));
  if (anchor.label) url.searchParams.set('label', anchor.label);
  // Preserve the participant's local calendar date instead of silently using
  // the Worker's UTC date near midnight.
  const d = new Date();
  const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  url.searchParams.set('date', localDate);
  const response = await fetch(url, { signal });
  const data = await response.json() as CandidateField & { error?: string };
  if (!response.ok) throw new Error(data.error || `Field retrieval failed (${response.status})`);
  return data;
}


async function postJson<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal });
  const data = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(data.error || `${path} failed (${response.status})`);
  return data;
}

export function runGatherer(input: { run_id: string; field: CandidateField; anchor_granularity: string }, signal?: AbortSignal) {
  return postJson<{run_id:string;gatherer:GathererOutput;meta:ModelMeta}>('/api/gather', input, signal);
}

export function computeMovement(input: { anchor: {lat:number;lon:number}; gatherer: GathererOutput }, signal?: AbortSignal) {
  return postJson<{movement:Movement;route_geometry:RouteGeometry|null;provider_meta:Record<string,unknown>}>('/api/movement', input, signal);
}

export function runSynthesizer(input: { run_id:string; field:CandidateField; gatherer:GathererOutput; movement:Movement }, signal?: AbortSignal) {
  return postJson<{run_id:string;result:NearbyFieldSynthesis;meta:ModelMeta}>('/api/synthesize', input, signal);
}
