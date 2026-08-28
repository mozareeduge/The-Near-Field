# Nearby Field — Technical Architecture v3

## 1. Deployment topology

```text
GITHUB PAGES
React + TypeScript + Vite
MapLibre + custom style
browser geolocation
search/map interaction
        │
        │ HTTPS / SSE
        ▼
CLOUDFLARE WORKER
        │
        ├─ geocoding adapter
        ├─ Wikipedia field preparation
        ├─ Gatherer model call
        ├─ route matrix/directions
        ├─ Synthesizer model call
        ├─ schema/invariant validation
        └─ stage-event stream
```

The browser is the artwork surface.

The Worker is an orchestration/security boundary, not a general agent.

---

# 2. Recommended repository

```text
nearby-field/
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── search/
│   │   │   ├── location/
│   │   │   ├── map/
│   │   │   ├── field/
│   │   │   ├── prose/
│   │   │   ├── state/
│   │   │   └── api/
│   │   └── ...
│   └── worker/
│       ├── src/
│       │   ├── geocode/
│       │   ├── wikipedia/
│       │   ├── gatherer/
│       │   ├── routing/
│       │   ├── synthesizer/
│       │   ├── validation/
│       │   └── stream/
│       └── ...
├── packages/
│   ├── nearby-narrative/      # canonical skill snapshot or build import
│   ├── contracts/
│   ├── geo/
│   └── map-style/
├── fixtures/
└── tests/
```

Do not make the app import the developer/QA handoff package at runtime.

---

# 3. Frontend

## React + TypeScript + Vite — CURRENT DEFAULT

Why:
- async search;
- map lifecycle;
- streamed stage events;
- linked prose/map state;
- recovery/retry paths;
- mobile/desktop variants.

React is organizational infrastructure, not the aesthetic.

Avoid generic component libraries whose default cards, shadows, buttons or dialogs impose a dashboard look.

## State machine

Preferred:
XState.

Acceptable:
typed reducer/state-machine implementation with explicit discriminated states/events.

Do not model the run as loosely related booleans.

---

# 4. Mapping

## MapLibre GL JS — CURRENT DEFAULT

Use for:
- vector basemap;
- style layers;
- GeoJSON sources;
- field circle;
- candidate/selected points;
- route/relation geometry;
- feature-state interactions;
- camera;
- responsive map behavior.

## Maputnik
Development-time map-style authoring.

Export/check in style JSON.

No runtime dependency required.

## OpenFreeMap
Prototype MapLibre-compatible basemap.

Provider interface:

```ts
interface BasemapProvider {
  styleUrl: string;
  attribution: string;
}
```

Future:
- MapTiler map styles;
- Protomaps/PMTiles;
- self-hosted OpenMapTiles.

## Turf.js
Optional geometry helper for:
- line length;
- slicing/reveal;
- local distance;
- animation geometry.

---

# 5. Search / geocoding

## MapTiler Geocoding — CURRENT DEFAULT

Adapter:

```ts
interface SearchProvider {
  autocomplete(
    query: string,
    context: SearchContext,
    signal?: AbortSignal
  ): Promise<SearchResult[]>;

  reverse(
    point: Coordinate,
    signal?: AbortSignal
  ): Promise<ReverseResult | null>;
}
```

Need:
- autocomplete;
- fuzzy matching;
- proximity bias;
- types;
- language/local script;
- reverse lookup.

UI:
- debounce ~160 ms;
- cancel stale query;
- max six results.

Alternatives:
- Photon: open source, self-host for serious use;
- Pelias: powerful but operationally heavier.

Public Nominatim is not selected for keystroke autocomplete.

---

# 6. Browser geolocation

Use standard browser Geolocation API.

Starting options:

```ts
{
  enableHighAccuracy: true,
  timeout: 8000,
  maximumAge: 30000
}
```

This is a prototype default.

Permission follows explicit user action.

Exact coordinate:
- lives in browser as needed;
- may be used to establish geographic field/search bias;
- is not sent to Gatherer/Synthesizer.

Do not put exact location in URL query strings.

---

# 7. Wikipedia source preparation

Core API:
MediaWiki Action API / English Wikipedia.

The app should implement the **v7 retrieval contract**, not the old app-v2 ~20-candidate contract.

## 7.1 Geographic fetch

A practical implementation may query 10 km once:

```text
action=query
list=geosearch
gscoord=<lat>|<lon>
gsradius=10000
gslimit=<bounded>
gsnamespace=0
```

Then fetch bounded plaintext extracts for returned page IDs.

Partition normalized candidates by distance:

```text
≤1000 m
≤3000 m
≤10000 m
```

Choose smallest radius with at least three useful candidates.

This is equivalent to issuing three sequential radius calls but can reduce external API requests.

The loader must still represent the **logical** field truthfully.

## 7.2 Normalization

Deterministic:
- non-disambiguation;
- useful extract;
- place-like;
- deduplicate;
- actual page ID/title/URL;
- coordinates/distance;
- extract ≤110 words;
- model payload ≤16 geographic candidates.

## 7.3 Sparse enrichment

If `<3` useful candidates within 10 km:
- run bounded MediaWiki search for exact anchor/place term + regional context;
- retrieve/retain at most four explicit local passages;
- each ≤80 words;
- keep separate `enrichment[]`.

Do not assign coordinates to enrichment.

## 7.4 Injection boundary

Raw `extract`/`snippet` fields are untrusted source content.

They enter Gatherer only as delimited structured data.

They do not enter Synthesizer.

---

# 8. Gatherer call

Worker owns:

1. prepare exact role prompt from v7 `references/GATHERER.md`;
2. construct bounded candidate-field input;
3. call model **once**;
4. request provider-native structured output when possible;
5. validate JSON/schema and invariants;
6. verify source candidate IDs/title/URL identity;
7. retry once on invalid result;
8. emit stage events.

No browsing/tool use inside Gatherer.

Model may be relatively economical if evals prove sufficient.

---

# 9. Movement

## openrouteservice — CURRENT DEFAULT

Use:
- Matrix endpoint for walking distances/durations;
- Directions endpoint for final route geometry.

### Route algorithm

For N ≤5:
1. selected coordinates only;
2. start = selected place nearest anchor;
3. compute matrix;
4. enumerate open permutations of remaining nodes;
5. minimize configured cost;
6. request final directions for winning order.

Tie-break:
- secondary route metric;
- stable IDs.

### Strong app verification rule

`VERIFIED` requires a successful routing-provider result for exact ordered points.

A route can contain:
- geometry;
- total distance;
- total duration;
- per-leg values where provider supplies them.

If provider fails/no path:
- use `RELATIONAL_UNVERIFIED`;
- never fabricate solid geometry.

Valhalla remains the future/self-host candidate.

---

# 10. Synthesizer call

Worker:
1. build strict compact payload via deterministic code;
2. include movement facts, not route GeoJSON;
3. use exact v7 `references/SYNTHESIZER.md`;
4. add tiny **app output metadata contract** defining bindings;
5. call a new model context once;
6. validate paragraph + place IDs + bindings;
7. retry once if invalid;
8. emit complete stage.

Never pass:
- candidate extracts;
- rejected pages;
- enrichment raw snippets not selected;
- route geometry;
- prior model history.

Never render model HTML.

---

# 11. App-specific output contract

The portable skill allows bindings to be optional.

Nearby Field needs them.

Therefore its LLM provider call uses a stricter app schema:

```ts
type NearbyFieldSynthesis = {
  paragraph: string;
  used_place_ids: string[];
  bindings: Binding[];       // required by app adapter
};
```

The app extension must say:
- annotate after final prose is decided;
- do not rewrite just to mention every selected place;
- structural bindings are valid.

See `practical/app-contracts/`.

---

# 12. LLM provider abstraction

```ts
interface LiteraryModelProvider {
  gatherer(
    input: GathererInput,
    options: GatherOptions
  ): Promise<GathererOutput>;

  synthesizer(
    input: SynthesizerInput,
    options: SynthOptions
  ): Promise<NearbyFieldSynthesis>;
}
```

Provider implementation may use:
- OpenAI;
- Anthropic;
- Workers AI;
- another JSON-schema-capable model endpoint.

Do not hard-wire the artwork to one commercial provider.

No vector DB.

No LangChain required.

---

# 13. Agent Skill package at runtime

The Agent Skills folder is the **behavioral source artifact**.

The web app does not need:
- discovery catalog;
- skill activation tool;
- `.agents/skills` scanning;
- implicit invocation.

It already knows the role files it uses.

Build/deploy may:
- copy the exact v7 role files into Worker bundle;
- import them as text;
- checksum them to ensure runtime prompt lineage.

The public skill and the web app should share versions/commits so they cannot silently diverge.

---

# 14. Stage event transport

SSE or streamed fetch.

Events:

```text
run.started
anchor.confirmed
field.search.started
field.candidates.updated
field.radius.expanded
field.sparse
enrichment.started
enrichment.completed
gatherer.started
gatherer.completed
gatherer.retry
route.started
route.verified
route.relational
route.unavailable
synthesizer.started
synthesizer.retry
synthesizer.completed
run.completed
run.failed
```

No token stream.

No model-reasoning trace.

---

# 15. Storage

v1:
- no user DB;
- no account;
- no saved generation history;
- no vector DB.

Allowed:
- short-lived cache for public geocoder/Wikipedia/routing results;
- source cache if provider terms allow;
- rate-limit state.

Later storage features require an explicit product decision.

---

# 16. Security / privacy

## Secrets
Worker secrets:
- geocoder key;
- routing key;
- model key.

## Browser
No private secrets in JS.

## Exact location
- do not log as analytics;
- do not include in literary model payload;
- minimize persistence;
- choose proxy/rounding strategy deliberately.

## Input/output
- all provider/model text rendered as text;
- validate source URLs/IDs;
- no arbitrary model-generated hyperlinks;
- sanitize any provenance rendering.

## Prompt injection
Source extracts/snippets are untrusted.

Gatherer role states this explicitly.

Synthesizer does not receive raw source text.

## Abuse/cost
Soft rate limit generation endpoint by session/IP or an equivalent low-friction mechanism.

---

# 17. CSP

Configure for:
- static app;
- Worker endpoint;
- tile/style/font hosts;
- geocoding/routing hosts where browser directly accesses them.

Avoid broad wildcards.

---

# 18. Deployment

## Frontend
GitHub Actions:
1. install;
2. typecheck;
3. unit tests;
4. component/integration tests;
5. build;
6. upload Pages artifact;
7. deploy.

## Worker
Wrangler or CI deployment.

Separate:
- dev;
- staging;
- production environment variables.

---

# 19. Performance targets — initial, not SLA

### Search
- local UI response <100 ms;
- provider suggestions p95 target <700 ms after debounce.

### Map
- first interactive map target <2.5 s on modern mid-range mobile with decent network;
- target 60 fps interactions;
- semantic correctness must not depend on >30 fps.

### Field
- first geographic candidates median target <3 s after confirmed anchor.

### Model run
Goal:
- normally two model calls;
- median complete work ≤15 s;
- p95 ≤30 s.

The loader must remain valid if slower.

### Bundle
Keep initial JS lean; lazy-load nonessential provenance/debug tooling.

---

# 20. Resilience

Stage retry scope:

| stage | retained artifact |
|---|---|
| search | map/query |
| discovery | anchor |
| enrichment | geographic field |
| Gatherer | field |
| route | selected field |
| Synthesizer | selected field + movement |
| binding metadata | hold final until corrected |

Do not restart validated source work because literary JSON was malformed.
