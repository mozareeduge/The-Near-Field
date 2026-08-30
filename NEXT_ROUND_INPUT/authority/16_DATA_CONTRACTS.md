# Nearby Field — Data Contracts

This document describes the app-level objects. Exact portable schemas live under `practical/canonical-skill/nearby-narrative/schemas/`. App-specific stricter schemas live under `practical/app-contracts/`.

---

# 1. Anchor

```ts
type AnchorSource = "search" | "device_location" | "map_point";

type AnchorGranularity =
  | "city"
  | "town"
  | "village"
  | "locality"
  | "neighbourhood"
  | "district"
  | "street"
  | "address"
  | "poi"
  | "map_point"
  | "device_location";

interface Anchor {
  label: string | null;
  lat: number;
  lon: number;
  source: AnchorSource;
  granularity: AnchorGranularity;
  regionalContext: {
    settlementOrCity?: string | null;
    intermediateRegion?: string | null;
    country?: string | null;
  };
}
```

Raw device accuracy may exist in browser state but does not belong to literary runtime payloads.

---

# 2. Geographic candidate

```ts
interface CandidatePage {
  candidate_id: string;       // C01...
  pageid: number;             // real MediaWiki page ID
  title: string;
  url: string;
  latitude: number;
  longitude: number;
  distance_from_anchor_m: number;
  extract: string;            // <=110 words
}
```

Cap:
16.

---

# 3. Enrichment evidence

```ts
interface EnrichmentEvidence {
  source_id: string;          // E01...
  title: string;
  url: string;
  snippet: string;            // <=80 words
  explicit_local_term: string;
}
```

Cap:
4.

No coordinate field.

No route participation.

---

# 4. Candidate field

```ts
interface CandidateField {
  current_date: string;
  anchor: {
    label: string | null;
    lat: number;
    lon: number;
  };
  regional_context: Record<string, unknown>;
  logical_radius_m: 1000 | 3000 | 10000;
  candidate_pages: CandidatePage[];
  enrichment: EnrichmentEvidence[];
}
```

---

# 5. Gatherer selected evidence

Portable schema already defines:

```ts
interface EvidenceItem {
  evidence_id: string;
  text: string;
}

interface SelectedPlace {
  place_id: string;                  // P01...
  source_candidate_id: string;
  title: string;
  url: string;
  latitude: number;
  longitude: number;
  facts: EvidenceItem[];             // max 3
  particulars: EvidenceItem[];       // max 3
  affordances: string[];             // max 2
  semantic_lures: string[];          // max 2
}

interface LocalMaterial {
  evidence_id: string;
  source_id: string;                 // enrichment source
  text: string;
}

interface Relation {
  relation_id: string;
  a: string;
  b: string;
  text: string;
}

interface GathererOutput {
  selected_places: SelectedPlace[];  // 1..5
  local_material: LocalMaterial[];   // <=4
  relations: Relation[];
  unknown_current_conditions: string[];
}
```

---

# 6. Movement

```ts
type MovementState =
  | "NONE"
  | "VERIFIED"
  | "RELATIONAL_UNVERIFIED";

interface MovementLeg {
  from: string;
  to: string;
  distance_m: number | null;
  duration_s?: number | null;        // app adapter may include
}

interface Movement {
  state: MovementState;
  route_verified: boolean;
  order: string[];
  total_distance_m: number | null;
  total_duration_s?: number | null;
  legs: MovementLeg[];
}
```

Invariant:

```text
state=VERIFIED => route_verified=true
state=NONE/RELATIONAL_UNVERIFIED => route_verified=false
```

App-level validator should enforce this relation even though the portable v7 schema is more permissive structurally.

Route geometry is a separate UI object:

```ts
interface VerifiedRouteGeometry {
  order: string[];
  geojson: GeoJSON.LineString;
  provider: string;
}
```

Do not send `geojson` to Synthesizer.

---

# 7. Synthesizer input

```ts
interface SynthesizerInput {
  run_id: string;
  current_date: string;
  regional_context: Record<string, unknown>;
  selected_places: SelectedPlace[];
  local_material: LocalMaterial[];
  relations: Relation[];
  unknown_current_conditions: string[];
  movement: Movement;
}
```

No raw source fields.

---

# 8. Binding

```ts
type BindingRelation = "mention" | "reference" | "structural";

interface Binding {
  place_id: string;
  relation: BindingRelation;
  start: number | null;
  end: number | null;
  evidence_ids: string[];
}
```

Rules:
- `mention/reference`: integer `0 <= start < end <= paragraph.length`;
- `structural`: `start=end=null`;
- one place can have multiple bindings;
- binding evidence IDs must exist.

---

# 9. Nearby Field synthesis output

App profile:

```ts
interface NearbyFieldSynthesis {
  paragraph: string;
  used_place_ids: string[];
  bindings: Binding[];     // required in app
}
```

The portable skill keeps bindings optional for plain-chat portability.

---

# 10. Run state

```ts
type RunState =
  | { type: "idle" }
  | { type: "searching"; query: string }
  | { type: "locating" }
  | { type: "anchor_preview"; anchor: Anchor }
  | { type: "anchored"; anchor: Anchor }
  | { type: "discovering"; anchor: Anchor; field?: CandidateField }
  | { type: "enriching"; field: CandidateField }
  | { type: "gathering"; field: CandidateField }
  | { type: "routing"; field: CandidateField; gatherer: GathererOutput }
  | { type: "synthesizing"; field: CandidateField; gatherer: GathererOutput; movement: Movement }
  | { type: "complete"; field: CandidateField; gatherer: GathererOutput; movement: Movement; result: NearbyFieldSynthesis }
  | { type: "error"; stage: string; retained: unknown };
```

Avoid mutable partial global state where a stale async response can silently overwrite a newer run.

---

# 11. Provenance

For each displayed selected place, retain:

```ts
interface PlaceProvenance {
  place_id: string;
  title: string;
  url: string;
  source_candidate_id: string;
  evidence_ids: string[];
}
```

For selected local material:

```ts
interface EnrichmentProvenance {
  evidence_id: string;
  source_id: string;
  title: string;
  url: string;
}
```

Provenance is UI/debug data, not paragraph text.
