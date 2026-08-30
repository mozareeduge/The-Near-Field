# Round 1 durable state

## Goal / stake

Make the first material apparatus of Nearby Field real before any LLM is allowed to interpret it: a participant chooses a place, the map changes role, and real nearby Wikipedia geography becomes a bounded field whose scarcity is preserved rather than cosmetically filled.

## Current candidate

`NF-R1-0.1.0`

- production-path UI: `apps/web/`
- production-path server boundary: `apps/worker/`
- directly inspectable no-build candidate: `standalone/`
- inherited contracts: `packages/contracts/`
- canonical skill: `packages/nearby-narrative/`

## Current work slice

**PRIMARY MODE:** BUILD  
**SUPPORTING:** RESEARCH → DESIGN → TEST → REPAIR  
**OUT OF SCOPE THIS ROUND:** Gatherer invocation, movement/routing, Synthesizer, generated prose, map↔prose bindings.

## Adopted Round-1 decisions

1. Retrieve the full geographic pool once at 10 km, then deterministically partition it at 1/3/10 km; do not issue progressively broader semantic searches that change the corpus.
2. Stop at the smallest radius containing at least three **useful** coordinate-bearing candidate pages; otherwise 10 km is sparse.
3. Administrative/census-only settlement stubs are geographic truth but weak literary evidence; reject the clearly generic short form before Gatherer rather than allowing it to dominate sparse fields.
4. Sparse enrichment is a separate evidence class: explicit local mention required, maximum four snippets, no invented coordinate, no point marker, no routing eligibility.
5. MapTiler remains the production geocoder adapter; because no key is part of the supplied package, a coordinate-bearing Wikipedia search fallback keeps the candidate operable. Public Nominatim is not used for autocomplete.
6. The client supplies its local calendar date to the Worker so a run around local midnight does not silently inherit the Worker's UTC date.
7. The map has two visual regimes: orientation and field. Candidate geometry and radius appear only after confirmation.

## What currently works in source/candidate logic

- place search endpoint with MapTiler or keyless coordinate-Wikipedia fallback;
- device location entry;
- map-point entry;
- anchor preview and explicit confirmation;
- orientation → field state change;
- MediaWiki GeoSearch at a hard 10 km ceiling;
- extracts + deterministic weak-page filtering;
- 1/3/10 km field sequence;
- candidate IDs and source URLs;
- sparse enrichment that remains off-map;
- candidate register/inspector;
- reset/new-place cycle;
- desktop/mobile CSS transformations and reduced-motion rule.

## Validation state

**Executed:** Worker module import; Worker TypeScript check; six deterministic Node tests including exact `/api/search` and `/api/field` routes under mocked external responses; canonical skill static suite 14/14; standalone JS syntax check.

**Live external evidence:** current MediaWiki GeoSearch was inspected for Taft, Harpers Ferry and central Berlin. Taft is sparse under the usefulness rule; Harpers Ferry and Berlin are dense within 1 km.

**Not fully executed in this harness:** canonical React/MapLibre browser bundle, because package dependencies could not be installed from npm in this environment; automated browser visual capture also lacked a usable installed headless-browser runtime. This remains a proof gap, not a claim that the UI was visually executed here.

## Active pressures entering Round 2

1. Preserve the field exactly while adding Gatherer discrimination; the LLM must not re-retrieve or invent places.
2. Selection must become visibly consequential on the map rather than merely an internal JSON result.
3. Movement must distinguish verified pedestrian route geometry from relational/unverified connections.
4. The first literary output must arise only after field → selection → movement.
5. Round-1 browser/runtime proof gap must be closed when dependency/browser access becomes available; do not rewrite the Round-1 contract to make the missing proof disappear.

## Next discriminating move

Run the canonical Gatherer over this exact candidate-field contract, validate source IDs, and use its selected constellation to drive the first visible selection-state transformation.
