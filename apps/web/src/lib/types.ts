export type Coordinate = { lat: number; lon: number };
export type AnchorSource = 'search' | 'device_location' | 'map_point';
export type AnchorGranularity = 'city' | 'town' | 'village' | 'locality' | 'neighbourhood' | 'district' | 'street' | 'address' | 'poi' | 'map_point' | 'device_location';

export interface Anchor {
  label: string | null;
  coordinate: Coordinate;
  source: AnchorSource;
  granularity: AnchorGranularity;
  regionalContext: {
    settlementOrCity?: string | null;
    intermediateRegion?: string | null;
    country?: string | null;
  };
}

export interface SearchResult {
  id: string;
  label: string;
  secondary: string | null;
  coordinate: Coordinate;
  granularity: AnchorGranularity;
  regionalContext: Anchor['regionalContext'];
  provider: 'maptiler' | 'wikipedia-coordinate-fallback';
}

export interface CandidatePage {
  candidate_id: string;
  pageid: number;
  title: string;
  url: string;
  latitude: number;
  longitude: number;
  distance_from_anchor_m: number;
  extract: string;
}

export interface EnrichmentEvidence {
  source_id: string;
  title: string;
  url: string;
  snippet: string;
  explicit_local_term: string;
}

export interface CandidateField {
  current_date: string;
  anchor: { label: string | null; lat: number; lon: number };
  regional_context: Record<string, unknown>;
  logical_radius_m: 1000 | 3000 | 10000;
  candidate_pages: CandidatePage[];
  enrichment: EnrichmentEvidence[];
  sparse: boolean;
  counts: Record<'1000' | '3000' | '10000', number>;
  retrieval: { corpus: string; max_radius_m: number; candidate_cap: number; extract_cap_words: number };
}

export interface EvidenceItem { evidence_id: string; text: string; }
export interface SelectedPlace {
  place_id: string; source_candidate_id: string; title: string; url: string; latitude: number; longitude: number;
  facts: EvidenceItem[]; particulars: EvidenceItem[]; affordances: string[]; semantic_lures: string[];
}
export interface LocalMaterial { evidence_id: string; source_id: string; text: string; }
export interface Relation { relation_id: string; a: string; b: string; text: string; }
export interface GathererOutput { selected_places: SelectedPlace[]; local_material: LocalMaterial[]; relations: Relation[]; unknown_current_conditions: string[]; }
export type MovementState = 'NONE' | 'VERIFIED' | 'RELATIONAL_UNVERIFIED';
export interface MovementLeg { from: string; to: string; distance_m: number | null; duration_s?: number | null; }
export interface Movement { state: MovementState; route_verified: boolean; order: string[]; total_distance_m: number | null; total_duration_s?: number | null; legs: MovementLeg[]; }
export interface RouteGeometry { order: string[]; provider: string; geojson: GeoJSON.LineString; }
export type BindingRelation = 'mention' | 'reference' | 'structural';
export interface Binding { place_id: string; relation: BindingRelation; start: number | null; end: number | null; evidence_ids: string[]; }
export interface NearbyFieldSynthesis { paragraph: string; used_place_ids: string[]; bindings: Binding[]; }
export interface ModelMeta { provider: string; model: string; attempts: number; latency_ms: number; usage: {prompt_tokens:number|null;completion_tokens:number|null;total_tokens:number|null}|null; prompt_sha256: string; schema_sha256: string; }
