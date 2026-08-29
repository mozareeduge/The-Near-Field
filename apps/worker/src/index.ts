import { handleGather, handleMovement, handleSynthesize, type RuntimeEnv } from './round2.ts';
import { RateLimiter, DEFAULT_RATE_LIMIT_MAX, DEFAULT_RATE_LIMIT_WINDOW_S } from './rate-limit.ts';
export { RateLimiter };

interface Env extends RuntimeEnv {
  MAPTILER_API_KEY?: string;
  ALLOWED_ORIGINS?: string;
  RATE_LIMITER?: DurableObjectNamespace;
  RATE_LIMIT_MAX?: string;
  RATE_LIMIT_WINDOW_S?: string;
}

// Cloudflare Workers deployments must set ALLOWED_ORIGINS (comma-separated
// exact origins) in production. Falling back to "*" only happens when the
// binding is entirely absent, which is the local/dev-only shape -- never a
// deployed default a misconfiguration could silently inherit.
function allowedOrigins(env: Env): string[] | '*' {
  if (!env.ALLOWED_ORIGINS) return '*';
  return env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean);
}

function corsHeadersFor(request: Request, env: Env) {
  const origin = request.headers.get('Origin');
  const allowed = allowedOrigins(env);
  const allow = allowed === '*' ? (origin || '*') : (origin && allowed.includes(origin) ? origin : '');
  const headers: Record<string, string> = {
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'Content-Type',
    'access-control-max-age': '86400',
    'vary': 'Origin'
  };
  if (allow) headers['access-control-allow-origin'] = allow;
  return headers;
}

const MAX_BODY_BYTES = 200_000;

async function readBoundedJson(request: Request): Promise<{ ok: true; value: unknown } | { ok: false; status: number; error: string }> {
  const declared = request.headers.get('content-length');
  if (declared && Number(declared) > MAX_BODY_BYTES) {
    return { ok: false, status: 413, error: 'Request body too large' };
  }
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return { ok: false, status: 413, error: 'Request body too large' };
  try { return { ok: true, value: JSON.parse(text) }; }
  catch { return { ok: false, status: 400, error: 'Invalid JSON body' }; }
}

type Coordinate = { lat: number; lon: number };
type SearchResult = {
  id: string;
  label: string;
  secondary: string | null;
  coordinate: Coordinate;
  granularity: string;
  regionalContext: Record<string, string | null>;
  provider: 'maptiler' | 'wikipedia-coordinate-fallback';
};

type CandidatePage = {
  candidate_id: string;
  pageid: number;
  title: string;
  url: string;
  latitude: number;
  longitude: number;
  distance_from_anchor_m: number;
  extract: string;
};

type EnrichmentEvidence = {
  source_id: string;
  title: string;
  url: string;
  snippet: string;
  explicit_local_term: string;
};

const WIKI = 'https://en.wikipedia.org/w/api.php';
const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };

function json(request: Request, env: Env, body: unknown, status = 200, extraHeaders?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, 'cache-control': 'no-store', ...corsHeadersFor(request, env), ...extraHeaders }
  });
}

function wikiUrl(params: Record<string, string | number | undefined>) {
  const url = new URL(WIKI);
  url.searchParams.set('origin', '*');
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

async function wiki<T>(params: Record<string, string | number | undefined>): Promise<T> {
  const response = await fetch(wikiUrl({ action: 'query', format: 'json', formatversion: 2, ...params }), {
    headers: { 'Api-User-Agent': 'NearbyField/0.1 (Round-1 prototype; locative literary artwork)' }
  });
  if (!response.ok) throw new Error(`Wikipedia request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export function boundedWords(input: string, maxWords: number) {
  const normalized = input.replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  return normalized.split(' ').slice(0, maxWords).join(' ');
}

function wikiPageUrl(title: string) {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
}

function mapTilerGranularity(types: string[] | undefined) {
  const type = types?.[0] || 'locality';
  const mapping: Record<string, string> = {
    locality: 'locality', municipality: 'city', municipal_district: 'district',
    neighbourhood: 'neighbourhood', address: 'address', road: 'street', poi: 'poi',
    region: 'district', subregion: 'district', county: 'district', country: 'locality'
  };
  return mapping[type] || 'locality';
}

async function searchMapTiler(query: string, key: string, proximity?: string): Promise<SearchResult[]> {
  const url = new URL(`https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json`);
  url.searchParams.set('key', key);
  url.searchParams.set('limit', '6');
  url.searchParams.set('autocomplete', 'true');
  url.searchParams.set('fuzzyMatch', 'true');
  url.searchParams.set('language', 'en');
  if (proximity) url.searchParams.set('proximity', proximity);
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`MapTiler search failed: ${response.status}`);
  const data = await response.json() as { features?: any[] };
  return (data.features || []).slice(0, 6).map((feature: any): SearchResult => {
    const [lon, lat] = feature.center || feature.geometry?.coordinates || [0, 0];
    const context = Array.isArray(feature.context) ? feature.context : [];
    const country = context.find((c: any) => c.id?.startsWith('country'))?.text || null;
    const region = context.find((c: any) => c.id?.startsWith('region'))?.text || null;
    const settlement = context.find((c: any) => /place|municipality|locality/.test(c.id || ''))?.text || null;
    return {
      id: feature.id,
      label: feature.text || feature.place_name || query,
      secondary: feature.place_name && feature.place_name !== feature.text ? feature.place_name : null,
      coordinate: { lat: Number(lat), lon: Number(lon) },
      granularity: mapTilerGranularity(feature.place_type),
      regionalContext: { settlementOrCity: settlement, intermediateRegion: region, country },
      provider: 'maptiler'
    };
  });
}

async function searchWikipediaCoordinates(query: string): Promise<SearchResult[]> {
  type SearchData = { query?: { search?: { pageid: number; title: string; snippet?: string }[] } };
  const search = await wiki<SearchData>({
    list: 'search', srsearch: query, srnamespace: 0, srlimit: 16, srprop: 'snippet'
  });
  const hits = search.query?.search || [];
  if (!hits.length) return [];
  const ids = hits.map(h => h.pageid).join('|');
  type PagesData = { query?: { pages?: { pageid: number; title: string; coordinates?: { lat: number; lon: number }[]; terms?: { description?: string[] } }[] } };
  const pages = await wiki<PagesData>({
    pageids: ids,
    prop: 'coordinates|pageterms',
    wbptterms: 'description',
    coprimary: 'primary'
  });
  const rank = new Map(hits.map((h, i) => [h.pageid, i]));
  return (pages.query?.pages || [])
    .filter(p => p.coordinates?.[0])
    .sort((a, b) => (rank.get(a.pageid) ?? 99) - (rank.get(b.pageid) ?? 99))
    .slice(0, 6)
    .map((p): SearchResult => {
      const c = p.coordinates![0];
      const description = p.terms?.description?.[0] || null;
      return {
        id: `wiki:${p.pageid}`,
        label: p.title,
        secondary: description,
        coordinate: { lat: c.lat, lon: c.lon },
        granularity: 'locality',
        regionalContext: { settlementOrCity: null, intermediateRegion: null, country: null },
        provider: 'wikipedia-coordinate-fallback'
      };
    });
}

const NON_PLACE_TITLE = /^(List of|History of|Timeline of|Demographics of|Economy of|Politics of|Battle of|Siege of|\d{4} .* (election|incident|attack))/i;
export function isUsefulPage(page: { title: string; extract?: string; pageprops?: Record<string, unknown> }) {
  if (page.pageprops && 'disambiguation' in page.pageprops) return false;
  if (NON_PLACE_TITLE.test(page.title)) return false;
  const extract = (page.extract || '').replace(/\s+/g, ' ').trim();
  const words = extract.split(/\s+/).filter(Boolean);
  if (words.length < 24) return false;
  // The Taft regression exposed coordinate-bearing settlement stubs whose only
  // content is administrative placement + a census count. They are geographic,
  // but too weak to become useful literary evidence. Preserve them as source
  // reality by rejecting deterministically rather than letting the Gatherer
  // overvalue generic census boilerplate.
  const censusStub = /(?:is a (?:village|city)|in .* district).*?(?:2006 census|national census|population was)/i.test(extract);
  if (censusStub && words.length < 85) return false;
  return true;
}

async function retrieveCandidates(lat: number, lon: number): Promise<CandidatePage[]> {
  type GeoData = { query?: { geosearch?: { pageid: number; title: string; lat: number; lon: number; dist: number }[] } };
  const geo = await wiki<GeoData>({
    list: 'geosearch',
    gscoord: `${lat}|${lon}`,
    gsradius: 10000,
    gslimit: 50,
    gsnamespace: 0,
    gsprop: 'type|name|dim|country|region'
  });
  const geos = geo.query?.geosearch || [];
  if (!geos.length) return [];
  const pageIds = geos.map(g => g.pageid).join('|');
  type PageData = { query?: { pages?: { pageid: number; title: string; extract?: string; pageprops?: Record<string, unknown> }[] } };
  const detail = await wiki<PageData>({
    pageids: pageIds,
    prop: 'extracts|pageprops',
    exintro: 1,
    explaintext: 1,
    exsectionformat: 'plain'
  });
  const byId = new Map((detail.query?.pages || []).map(p => [p.pageid, p]));
  const usable = geos
    .map(g => ({ geo: g, page: byId.get(g.pageid) }))
    .filter((x): x is { geo: typeof geos[number]; page: NonNullable<typeof x.page> } => Boolean(x.page && isUsefulPage(x.page)))
    .sort((a, b) => a.geo.dist - b.geo.dist)
    .slice(0, 16);
  return usable.map((x, index) => ({
    candidate_id: `C${String(index + 1).padStart(2, '0')}`,
    pageid: x.geo.pageid,
    title: x.geo.title,
    url: wikiPageUrl(x.geo.title),
    latitude: x.geo.lat,
    longitude: x.geo.lon,
    distance_from_anchor_m: Math.round(x.geo.dist),
    extract: boundedWords(x.page.extract || '', 110)
  }));
}

export function logicalRadius(candidates: CandidatePage[]): 1000 | 3000 | 10000 {
  if (candidates.filter(c => c.distance_from_anchor_m <= 1000).length >= 3) return 1000;
  if (candidates.filter(c => c.distance_from_anchor_m <= 3000).length >= 3) return 3000;
  return 10000;
}

function localTerms(label: string) {
  const cleaned = label.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/[,_–—-]+/g, ' ').replace(/\s+/g, ' ').trim();
  const parts = cleaned.split(' ').filter(p => p.length >= 3 && !/^(iran|city|county|province|town|village)$/i.test(p));
  return parts.slice(0, 3);
}

function snippetAround(text: string, term: string, maxWords = 80) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const lower = normalized.toLowerCase();
  const index = lower.indexOf(term.toLowerCase());
  if (index < 0) return '';
  const before = normalized.slice(0, index).split(' ');
  const after = normalized.slice(index).split(' ');
  const wordsBefore = before.slice(Math.max(0, before.length - 24));
  return [...wordsBefore, ...after].slice(0, maxWords).join(' ');
}

async function retrieveEnrichment(label: string | null, candidateIds: Set<number>): Promise<EnrichmentEvidence[]> {
  if (!label) return [];
  const terms = localTerms(label);
  const anchorTerm = terms[0];
  if (!anchorTerm) return [];

  // Bounded exact-place enrichment. Multiple narrowly material queries are used
  // only after the 10 km geographic field is sparse. Every retained snippet must
  // still contain the exact local term; results never acquire coordinates.
  const queryTails = ['', 'watermill', 'qanat', 'garden', 'architecture'];
  const hitMap = new Map<number, { pageid: number; title: string }>();
  type SearchData = { query?: { search?: { pageid: number; title: string }[] } };
  for (const tail of queryTails) {
    if (hitMap.size >= 24) break;
    const q = `\"${anchorTerm}\" ${terms.slice(1).join(' ')} ${tail}`.trim();
    const search = await wiki<SearchData>({ list: 'search', srsearch: q, srnamespace: 0, srlimit: 10 });
    for (const hit of search.query?.search || []) {
      if (!candidateIds.has(hit.pageid)) hitMap.set(hit.pageid, hit);
    }
  }
  const hits = [...hitMap.values()].slice(0, 24);
  if (!hits.length) return [];
  type PageData = { query?: { pages?: { pageid: number; title: string; extract?: string; pageprops?: Record<string, unknown> }[] } };
  const detail = await wiki<PageData>({
    pageids: hits.map(h => h.pageid).join('|'),
    prop: 'extracts|pageprops',
    explaintext: 1
  });
  const output: EnrichmentEvidence[] = [];
  for (const page of detail.query?.pages || []) {
    if (output.length >= 4) break;
    if (!page.extract || (page.pageprops && 'disambiguation' in page.pageprops)) continue;
    const explicit = terms.find(term => page.extract!.toLowerCase().includes(term.toLowerCase()));
    if (!explicit) continue;
    const snippet = snippetAround(page.extract, explicit, 80);
    if (!snippet) continue;
    output.push({
      source_id: `E${String(output.length + 1).padStart(2, '0')}`,
      title: page.title,
      url: wikiPageUrl(page.title),
      snippet,
      explicit_local_term: explicit
    });
  }
  return output;
}

async function handleSearch(request: Request, env: Env, url: URL) {
  const q = (url.searchParams.get('q') || '').trim();
  if (q.length < 2) return json(request, env, { results: [], provider: env.MAPTILER_API_KEY ? 'maptiler' : 'wikipedia-coordinate-fallback' });
  const proximity = url.searchParams.get('proximity') || undefined;
  try {
    const results = env.MAPTILER_API_KEY
      ? await searchMapTiler(q, env.MAPTILER_API_KEY, proximity)
      : await searchWikipediaCoordinates(q);
    return json(request, env, { results, provider: env.MAPTILER_API_KEY ? 'maptiler' : 'wikipedia-coordinate-fallback' });
  } catch (error) {
    return json(request, env, { error: error instanceof Error ? error.message : 'Search failed' }, 502);
  }
}

// POST with a JSON body, not GET with lat/lon query params: an exact anchor
// coordinate must not sit in a URL, where it would land in browser history,
// server access logs, and any Referer header sent to a third party.
async function handleField(request: Request, env: Env) {
  const parsed = await readBoundedJson(request);
  if (!parsed.ok) return json(request, env, { error: parsed.error }, parsed.status);
  const body = parsed.value;
  const lat = Number((body as any)?.lat);
  const lon = Number((body as any)?.lon);
  const label = typeof (body as any)?.label === 'string' ? (body as any).label : null;
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return json(request, env, { error: 'Invalid coordinates' }, 400);
  }
  try {
    const all = await retrieveCandidates(lat, lon);
    const radius = logicalRadius(all);
    const within = all.filter(c => c.distance_from_anchor_m <= radius).slice(0, 16)
      .map((c, i) => ({ ...c, candidate_id: `C${String(i + 1).padStart(2, '0')}` }));
    const counts = {
      1000: all.filter(c => c.distance_from_anchor_m <= 1000).length,
      3000: all.filter(c => c.distance_from_anchor_m <= 3000).length,
      10000: all.filter(c => c.distance_from_anchor_m <= 10000).length
    };
    const sparse = within.length < 3;
    const enrichment = sparse ? await retrieveEnrichment(label, new Set(within.map(c => c.pageid))) : [];
    const suppliedDate = typeof (body as any)?.date === 'string' ? (body as any).date : null;
    const currentDate = suppliedDate && /^\d{4}-\d{2}-\d{2}$/.test(suppliedDate)
      ? suppliedDate
      : new Date().toISOString().slice(0, 10);
    return json(request, env, {
      current_date: currentDate,
      anchor: { label: label || null, lat, lon },
      regional_context: {},
      logical_radius_m: radius,
      candidate_pages: within,
      enrichment,
      sparse,
      counts,
      retrieval: { corpus: 'English Wikipedia', max_radius_m: 10000, candidate_cap: 16, extract_cap_words: 110 }
    });
  } catch (error) {
    return json(request, env, { error: error instanceof Error ? error.message : 'Field retrieval failed' }, 502);
  }
}

// Per-client sliding-window rate limit on the API routes, backed by the
// RateLimiter Durable Object (rate-limit.ts). No RATE_LIMITER binding is
// the local/dev-only shape (Wrangler needs a migration to provision the
// class -- see wrangler.jsonc) -- deliberately open in that case, the same
// pattern this file already uses for ALLOWED_ORIGINS.
async function rateLimitResponse(request: Request, env: Env, url: URL): Promise<Response | null> {
  if (!env.RATE_LIMITER) return null;
  const key = request.headers.get('cf-connecting-ip') || 'unknown';
  const max = Number(env.RATE_LIMIT_MAX) || DEFAULT_RATE_LIMIT_MAX;
  const windowS = Number(env.RATE_LIMIT_WINDOW_S) || DEFAULT_RATE_LIMIT_WINDOW_S;
  const id = env.RATE_LIMITER.idFromName(key);
  const stub = env.RATE_LIMITER.get(id);
  const checkUrl = `https://rate-limit.internal/check?max=${max}&windowS=${windowS}`;
  const decisionRes = await stub.fetch(checkUrl, { method: 'POST' });
  const decision = await decisionRes.json() as { allowed: boolean; retryAfterSeconds: number };
  if (decision.allowed) return null;
  return json(request, env, { error: `Rate limit exceeded for ${url.pathname}. Try again later.` }, 429, {
    'retry-after': String(decision.retryAfterSeconds)
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeadersFor(request, env) });
    const url = new URL(request.url);
    if (url.pathname === '/health') return json(request, env, { ok: true, round: 2, ai: Boolean(env.AI), routing: Boolean(env.ORS_API_KEY), rateLimited: Boolean(env.RATE_LIMITER) });
    if (url.pathname.startsWith('/api/')) {
      const limited = await rateLimitResponse(request, env, url);
      if (limited) return limited;
    }
    if (url.pathname === '/api/search') return handleSearch(request, env, url);
    if (url.pathname === '/api/field' && request.method === 'POST') return handleField(request, env);
    if (url.pathname === '/api/gather' && request.method === 'POST') return handleGather(request, env);
    if (url.pathname === '/api/movement' && request.method === 'POST') return handleMovement(request, env);
    if (url.pathname === '/api/synthesize' && request.method === 'POST') return handleSynthesize(request, env);
    return json(request, env, { error: 'Not found' }, 404);
  }
} satisfies { fetch(request: Request, env: Env): Promise<Response> };
