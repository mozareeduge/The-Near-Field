import type { CandidateField, SearchResult, GathererOutput, ModelMeta, Movement, NearbyFieldSynthesis, RouteGeometry } from './types';
import { DEMO_SEARCH_RESULTS, demoField, demoGatherer, demoMovement, demoSynthesis } from './fixtures';

const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:8787').replace(/\/$/, '');

// Design-QA fixture mode: VITE_DEMO=1 runs the full flow on canned local data,
// with no network calls, so the app can be driven and screenshotted without a
// reachable tile server, Wikipedia, geocoder, router, or Workers AI binding.
export const DEMO_MODE = import.meta.env.VITE_DEMO === '1';
const demoDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function searchPlaces(query: string, signal?: AbortSignal, proximity?: { lat: number; lon: number }) {
  if (DEMO_MODE) {
    await demoDelay(140);
    const results = DEMO_SEARCH_RESULTS.filter(r => r.label.toLowerCase().includes(query.toLowerCase()));
    return { results, provider: 'wikipedia-coordinate-fallback' as const };
  }
  const url = new URL(`${API_BASE}/api/search`);
  url.searchParams.set('q', query);
  if (proximity) url.searchParams.set('proximity', `${proximity.lon},${proximity.lat}`);
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Search failed (${response.status})`);
  const data = await response.json() as { results: SearchResult[]; provider: string; error?: string };
  return data;
}

export async function fetchField(anchor: { label: string | null; coordinate: { lat: number; lon: number } }, signal?: AbortSignal) {
  if (DEMO_MODE) { await demoDelay(180); return demoField(anchor.label, anchor.coordinate); }
  // POST with a JSON body, not GET with the coordinate in the query string --
  // an exact location must not land in browser history, server access logs,
  // or a Referer header.
  // Preserve the participant's local calendar date instead of silently using
  // the Worker's UTC date near midnight.
  const d = new Date();
  const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const response = await fetch(`${API_BASE}/api/field`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ lat: anchor.coordinate.lat, lon: anchor.coordinate.lon, label: anchor.label, date: localDate }),
    signal
  });
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

const DEMO_META: ModelMeta = { provider: 'demo', model: 'fixture', attempts: 1, latency_ms: 0, usage: null, prompt_sha256: '', schema_sha256: '' };

export async function runGatherer(input: { run_id: string; field: CandidateField; anchor_granularity: string }, signal?: AbortSignal) {
  if (DEMO_MODE) { await demoDelay(260); return { run_id: input.run_id, gatherer: demoGatherer(input.field), meta: DEMO_META }; }
  return postJson<{run_id:string;gatherer:GathererOutput;meta:ModelMeta}>('/api/gather', input, signal);
}

export async function computeMovement(input: { anchor: {lat:number;lon:number}; field: CandidateField; gatherer: GathererOutput }, signal?: AbortSignal) {
  if (DEMO_MODE) { await demoDelay(220); const { movement, route_geometry } = demoMovement(); return { movement, route_geometry, provider_meta: {} }; }
  return postJson<{movement:Movement;route_geometry:RouteGeometry|null;provider_meta:Record<string,unknown>}>('/api/movement', input, signal);
}

export async function runSynthesizer(input: { run_id:string; field:CandidateField; gatherer:GathererOutput; movement:Movement }, signal?: AbortSignal) {
  if (DEMO_MODE) { await demoDelay(320); return { run_id: input.run_id, result: demoSynthesis(), meta: DEMO_META }; }
  return postJson<{run_id:string;result:NearbyFieldSynthesis;meta:ModelMeta}>('/api/synthesize', input, signal);
}
