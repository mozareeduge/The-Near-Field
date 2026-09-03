// Demo/QA fixture data — used only when VITE_DEMO=1 (see api.ts). Lets the
// full search → field → selection → movement → synthesis flow run and be
// screenshotted without live Wikipedia/MapTiler/ORS/Workers AI access.
import type { CandidateField, GathererOutput, Movement, NearbyFieldSynthesis, RouteGeometry, SearchResult, Binding } from './types';

const ANCHOR = { lat: 32.6572, lon: 51.6776 };

export const DEMO_SEARCH_RESULTS: SearchResult[] = [
  { id: 'd1', label: 'Naqsh-e Jahan Square', secondary: 'Isfahan, Iran', coordinate: ANCHOR, granularity: 'poi', regionalContext: { settlementOrCity: 'Isfahan', country: 'Iran' }, provider: 'wikipedia-coordinate-fallback' },
  { id: 'd2', label: 'Naqsh-e Jahan Square Bazaar', secondary: '32.6579°N · 51.6773°E', coordinate: { lat: 32.6579, lon: 51.6773 }, granularity: 'poi', regionalContext: {}, provider: 'wikipedia-coordinate-fallback' }
];

const CANDIDATES: CandidateField['candidate_pages'] = [
  { candidate_id: 'c1', pageid: 101, title: 'Ali Qapu', url: 'https://en.wikipedia.org/wiki/Ali_Qapu', latitude: 32.6577, longitude: 51.6768, distance_from_anchor_m: 230, extract: 'A grand palace on the western side of the square, its music hall carved with the silhouettes of vessels and its high talar looking directly across the maidan.' },
  { candidate_id: 'c2', pageid: 102, title: 'Sheikh Lotfollah Mosque', url: 'https://en.wikipedia.org/wiki/Sheikh_Lotfollah_Mosque', latitude: 32.6567, longitude: 51.6779, distance_from_anchor_m: 280, extract: 'A private Safavid-era mosque on the eastern side of the square, built without minaret or courtyard, its cream-to-rose dome shifting colour through the day.' },
  { candidate_id: 'c3', pageid: 103, title: 'Shah Mosque, Isfahan', url: 'https://en.wikipedia.org/wiki/Shah_Mosque,_Isfahan', latitude: 32.6577, longitude: 51.6774, distance_from_anchor_m: 510, extract: 'The congregational mosque closing the square’s southern end, its entrance portal turned to face Mecca against the axis of the maidan itself.' },
  { candidate_id: 'c4', pageid: 104, title: 'Qeysarieh Portal', url: 'https://en.wikipedia.org/wiki/Isfahan_Grand_Bazaar', latitude: 32.6588, longitude: 51.6773, distance_from_anchor_m: 640, extract: 'The painted gateway at the square’s northern edge, opening into the covered bazaar that has run this line since the early seventeenth century.' },
  { candidate_id: 'c5', pageid: 105, title: 'Chehel Sotoun', url: 'https://en.wikipedia.org/wiki/Chehel_Sotoun', latitude: 32.6558, longitude: 51.6746, distance_from_anchor_m: 910, extract: 'A pavilion set behind a long rectangular pool; twenty slender columns on the portico double in the water to give the garden its name, "forty columns."' }
];

export function demoField(anchorLabel: string | null, coordinate: { lat: number; lon: number }): CandidateField {
  return {
    current_date: new Date().toISOString().slice(0, 10),
    anchor: { label: anchorLabel, lat: coordinate.lat, lon: coordinate.lon },
    regional_context: { settlementOrCity: 'Isfahan', country: 'Iran' },
    logical_radius_m: 1000,
    candidate_pages: CANDIDATES,
    enrichment: [],
    sparse: false,
    counts: { '1000': 5, '3000': 5, '10000': 5 },
    retrieval: { corpus: 'en.wikipedia.org (demo fixture)', max_radius_m: 10000, candidate_cap: 24, extract_cap_words: 60 }
  };
}

export function demoGatherer(field: CandidateField): GathererOutput {
  const byId = new Map(field.candidate_pages.map(c => [c.candidate_id, c]));
  const pick = (candidateId: string, placeId: string): GathererOutput['selected_places'][number] => {
    const c = byId.get(candidateId)!;
    return { place_id: placeId, source_candidate_id: candidateId, title: c.title, url: c.url, latitude: c.latitude, longitude: c.longitude, facts: [{ evidence_id: `${placeId}-f1`, text: c.extract }], particulars: [], affordances: [], semantic_lures: [] };
  };
  return {
    selected_places: [pick('c1', 'p1'), pick('c2', 'p2'), pick('c5', 'p3')],
    local_material: [],
    relations: [],
    unknown_current_conditions: []
  };
}

export function demoMovement(): { movement: Movement; route_geometry: RouteGeometry } {
  const order = ['p1', 'p2', 'p3'];
  const geojson: GeoJSON.LineString = {
    type: 'LineString',
    coordinates: [
      [51.6768, 32.6577], [51.6772, 32.6574], [51.6776, 32.6570],
      [51.6779, 32.6567], [51.6772, 32.6562], [51.6760, 32.6558], [51.6746, 32.6558]
    ]
  };
  return {
    movement: { state: 'VERIFIED', route_verified: true, order, total_distance_m: 640, total_duration_s: 480, legs: [
      { from: 'p1', to: 'p2', distance_m: 210, duration_s: 160 },
      { from: 'p2', to: 'p3', distance_m: 430, duration_s: 320 }
    ] },
    route_geometry: { order, provider: 'demo-fixture', geojson }
  };
}

function span(paragraph: string, phrase: string, placeId: string, relation: Binding['relation']): Binding {
  const start = paragraph.indexOf(phrase);
  if (start < 0) throw new Error(`demo fixture: phrase not found in paragraph: "${phrase}"`);
  return { place_id: placeId, relation, start, end: start + phrase.length, evidence_ids: [] };
}

export function demoSynthesis(): NearbyFieldSynthesis {
  const paragraph = 'From the maidan the walk is short: up into Ali Qapu’s talar, where the wooden columns frame the square exactly as they were built to, then across to Sheikh Lotfollah, whose dome carries no minaret to announce it and needed none. The last stretch runs west along the old canal line to Chehel Sotoun, where twenty columns on the portico double to forty in the reflecting pool, and the count is only true from the water’s edge.';
  const bindings: Binding[] = [
    span(paragraph, 'Ali Qapu’s talar', 'p1', 'mention'),
    span(paragraph, 'Sheikh Lotfollah', 'p2', 'mention'),
    span(paragraph, 'Chehel Sotoun', 'p3', 'mention'),
    { place_id: 'p3', relation: 'structural', start: null, end: null, evidence_ids: [] }
  ];
  return { paragraph, used_place_ids: ['p1', 'p2', 'p3'], bindings };
}
