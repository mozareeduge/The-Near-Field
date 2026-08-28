// Nearby Field app contracts — v3 handoff
// Canonical portable skill schemas remain under practical/canonical-skill/.

export type Coordinate = { lat: number; lon: number };

export type AnchorSource = "search" | "device_location" | "map_point";

export type AnchorGranularity =
  | "city" | "town" | "village" | "locality"
  | "neighbourhood" | "district"
  | "street" | "address" | "poi"
  | "map_point" | "device_location";

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
}

export interface EvidenceItem {
  evidence_id: string;
  text: string;
}

export interface SelectedPlace {
  place_id: string;
  source_candidate_id: string;
  title: string;
  url: string;
  latitude: number;
  longitude: number;
  facts: EvidenceItem[];
  particulars: EvidenceItem[];
  affordances: string[];
  semantic_lures: string[];
}

export interface LocalMaterial {
  evidence_id: string;
  source_id: string;
  text: string;
}

export interface Relation {
  relation_id: string;
  a: string;
  b: string;
  text: string;
}

export interface GathererOutput {
  selected_places: SelectedPlace[];
  local_material: LocalMaterial[];
  relations: Relation[];
  unknown_current_conditions: string[];
}

export type MovementState = "NONE" | "VERIFIED" | "RELATIONAL_UNVERIFIED";

export interface MovementLeg {
  from: string;
  to: string;
  distance_m: number | null;
  duration_s?: number | null;
}

export interface Movement {
  state: MovementState;
  route_verified: boolean;
  order: string[];
  total_distance_m: number | null;
  total_duration_s?: number | null;
  legs: MovementLeg[];
}

export interface RouteGeometry {
  order: string[];
  provider: string;
  geojson: GeoJSON.LineString;
}

export type BindingRelation = "mention" | "reference" | "structural";

export interface Binding {
  place_id: string;
  relation: BindingRelation;
  start: number | null;
  end: number | null;
  evidence_ids: string[];
}

export interface NearbyFieldSynthesis {
  paragraph: string;
  used_place_ids: string[];
  bindings: Binding[];
}

export type RunStage =
  | "idle" | "searching" | "locating" | "anchor_preview" | "anchored"
  | "discovering" | "enriching" | "gathering" | "routing"
  | "synthesizing" | "complete" | "error";

export type RunEventName =
  | "run.started"
  | "anchor.confirmed"
  | "field.search.started"
  | "field.candidates.updated"
  | "field.radius.expanded"
  | "field.radius.resolved"
  | "field.sparse"
  | "enrichment.started"
  | "enrichment.completed"
  | "gatherer.started"
  | "gatherer.completed"
  | "gatherer.retry"
  | "route.started"
  | "route.relational"
  | "route.verified"
  | "route.unavailable"
  | "synthesizer.started"
  | "synthesizer.retry"
  | "synthesizer.completed"
  | "run.completed"
  | "run.failed";

export interface RunEvent<T = unknown> {
  run_id: string;
  seq: number;
  event: RunEventName;
  at: string;
  data?: T;
}
