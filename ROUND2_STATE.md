# Nearby Field — Round 2 state

**Candidate:** `NF-R2-0.2.0`  
**Parent:** `NF-R1-0.1.0`  
**Primary mode:** BUILD → TEST → REPAIR  
**Round status:** complete as an implementation + controlled-fixture candidate; browser/live-provider verification remains explicit.

## Goal / stake

Turn the truthful geographic field built in Round 1 into the first complete literary apparatus while keeping evidence boundaries legible:

`FIELD → GATHERER → SELECTED CONSTELLATION → MOVEMENT → SYNTHESIZER → PARAGRAPH → MAP ⇄ PROSE`

## Current artifact state

### Field/search inherited and preserved

Round-1 contracts remain unchanged: one underlying 10 km geographic pool, deterministic 1/3/10 km reveal, smallest radius with ≥3 useful geographic pages, maximum 16 candidates, max 110-word extracts, separate coordinate-free sparse enrichment, and no use of public Nominatim as client autocomplete.

### Gatherer

`POST /api/gather`

- receives bounded field evidence, not raw GPS/logs/routes/prior narrative;
- uses the canonical Gatherer role;
- requests structured output;
- validates known source IDs plus exact title/URL/coordinate identity;
- validates evidence/local-material/relation structure;
- retries once at most after validation failure;
- returns model/prompt/schema/run telemetry;
- leaves the geographic field intact on failure.

### Selected constellation

- selected geographic candidates visibly differ on the map and in the register;
- unselected field candidates remain perceptible;
- candidate, map, and prose activation share a selected-object address;
- transient hover/focus and pinned click state are distinct, preventing one surface from losing the other's object focus.

### Movement

`POST /api/movement`

- `NONE`: one selected geographic place;
- `RELATIONAL_UNVERIFIED`: deterministic spatial order when no exact route proof exists;
- `VERIFIED`: only after successful ORS Matrix + Directions for the exact ordered points plus LineString route geometry;
- routing failure downgrades rather than fabricating a route;
- sparse enrichment never enters movement.

### Synthesizer

`POST /api/synthesize`

- input is reconstructed only from validated Gatherer material + movement;
- raw candidate pages/extracts/enrichment/route geometry do not cross the model boundary;
- canonical Synthesizer role is followed by a narrow app-binding extension;
- validates exactly one paragraph, known used-place IDs, binding relations, character offsets, and evidence IDs;
- retries once at most;
- field + selection + movement remain visible on failure.

### Map ⇄ prose

- direct named spans are addressable bindings;
- structural bindings may highlight the prose object without inventing a textual mention;
- map/ledger hover or focus and prose hover/focus resolve to the same selected `place_id`;
- click/touch can pin/unpin an object;
- keyboard path remains available through register and prose controls;
- accessible live summary narrates anchor, selected places, movement truth state, and paragraph outside the map canvas.

## Adopted Round-2 decisions

| Decision | Basis | Consequence |
|---|---|---|
| Keep three separate runtime stages rather than one orchestration endpoint | failure isolation and epistemic boundary | later-stage failure preserves prior valid work |
| Use Workers AI binding adapter provisionally | current Cloudflare structured-output/model support; low deployment friction | models remain replaceable and final pair stays open |
| Provisional Gatherer = `@cf/zai-org/glm-4.7-flash` | cheap current hosted model appropriate for discriminative/structured role | not an artistic/model-quality decision |
| Provisional Synthesizer = `@cf/meta/llama-4-scout-17b-16e-instruct` | current hosted text model with response-format support and moderate cost | must be challenged in Round-3 literary tournament |
| Route objective = shortest pedestrian distance, then duration, then stable IDs | inherited technical authority | deterministic order for N≤5 |
| No ORS evidence = never VERIFIED | inherited proof correction | Harpers Ferry current fixture is relational-unverified |
| `bindings` required, not optional | map⇄prose is a central Round-2 encounter requirement | invalid/missing offsets are red tests |
| unselected field candidates stay visible | field is material context, not merely a menu for the model | selection changes hierarchy rather than erasing the field |

## Findings from making

1. A movement status is not a styling choice. The old Harpers Ferry `VERIFIED` fixture encoded documentary confidence as route confidence; separating matrix/directions proof made the semantic defect visible.
2. Model schema compliance is insufficient on its own. Candidate identity, binding offsets, and evidence references require post-model validation and one bounded repair.
3. `map ⇄ prose` needs a shared object address, not parallel hover effects. The first implementation could transiently highlight different things; separating hover from pinned state repaired the relation.
4. The three-stage runtime boundary materially improves failure experience: a Synthesizer failure no longer makes the already-discovered geography disappear.
5. Sparse-field truth survives the literary layer only if enrichment is excluded from routing and cannot acquire a coordinate through model output.

## Evidence state

**Executed:** deterministic Worker endpoint tests with controlled AI/routing adapters; field/search Worker tests; prompt fidelity; canonical skill suite; static UI contracts; JS parse; TS/TSX syntax/transpile checks.

**Not executed in this harness:** canonical React/MapLibre browser bundle; live Workers AI inference; live ORS route; real touch/mobile device; visual motion timing on the canonical candidate.

## Current pressures for Round 3

1. Close the canonical browser/runtime proof gap in a capable environment.
2. Run the frozen multi-location Gatherer/Synthesizer evaluation and choose the final model pair from literary + epistemic + runtime evidence.
3. Test actual ORS route verification and fallback with real keys/network.
4. Finish visual/cartographic/temporal craft on the actual rendered candidate rather than from source inspection.
5. Harden, adversarially break, repair, and release-package the actual v1.0 candidate.

## Next discriminating move

Execute `NF-R2-0.2.0` with real dependencies/providers, then use those observations—not the provisional style/model choices—to drive Round-3 finalization.
