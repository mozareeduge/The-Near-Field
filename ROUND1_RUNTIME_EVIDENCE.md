# Round 1 runtime and evidence record

**Candidate:** NF-R1-0.1.0  
**Evidence date:** 2026-08-26

## Candidate-bound checks actually executed

| Check | Evidence mode | Candidate binding | Result |
|---|---|---:|---|
| Worker source TypeScript check | CANDIDATE_EXECUTION | STRONG | PASS |
| Worker module import under Node type stripping | CANDIDATE_EXECUTION | STRONG | PASS |
| field/search regression suite | CANDIDATE_EXECUTION | STRONG | 6/6 PASS |
| exact `/api/field` sparse Taft response with mocked MediaWiki HTTP responses | CANDIDATE_EXECUTION | STRONG | PASS |
| exact `/api/search` no-key fallback with mocked MediaWiki HTTP responses | CANDIDATE_EXECUTION | STRONG | PASS |
| canonical Nearby Narrative deterministic suite | CANDIDATE_EXECUTION | STRONG | 14/14 PASS |
| dependency-free browser candidate JS parse | INSPECTION/EXECUTION | STRONG for JS syntax | PASS |
| React/Vite/MapLibre production build | NONE | NONE | NOT VERIFIED — npm registry unavailable from harness |
| automated browser visual/runtime capture | NONE | NONE | NOT VERIFIED — system Chromium hung in headless mode; Playwright had no browser binary installed |

## Frozen Round-1 regression expectations

- weak administrative/census settlement stubs do not count toward the three-useful-page threshold;
- the field stops at 1 km or 3 km only if that radius already contains ≥3 useful geographic pages;
- 10 km with <3 useful geographic pages is explicitly sparse;
- enrichment can add textual evidence but can never acquire coordinates or route-node status;
- extract budget is 110 words per geographic candidate;
- candidate cap is 16;
- local participant date is preserved when supplied by the client.

## Live external contact used to pressure-test the candidate

### Taft, Yazd

Current English-Wikipedia GeoSearch around the Taft anchor returns eight coordinate-bearing pages within 10 km. The surrounding results include Taft itself, several nearby settlement pages, and Jameh Mosque of Eslamiyeh. Inspection of the settlement extracts showed that many are short administrative/census stubs. Therefore coordinate presence alone is not accepted as usefulness.

The current Qanat article still contains a Taft-specific watermill relation. That remains legitimate sparse enrichment because the relation is textual and local but the Qanat page is not assigned a fake Taft coordinate.

### Harpers Ferry, West Virginia

Current GeoSearch at the supplied Harpers Ferry fixture anchor returns many pages within 1 km, including St. Peter's Roman Catholic Church, Harpers Ferry station, Jefferson Rock, John Brown's Fort, the National Historical Park, Lockwood House, Storer College, river/rail infrastructure and the historic district. This is a genuine dense-field countercase to Taft.

### Central Berlin

A 1 km GeoSearch around 52.5200, 13.4050 immediately returns a dense set of coordinate-bearing pages. This guards against overfitting the field algorithm to sparse places.

## External interfaces verified against current documentation

- MediaWiki GeoSearch supports coordinate + radius based nearby-page retrieval and browser CORS via `origin=*`.
- MapLibre GL JS remains a TypeScript/WebGL browser map library; style lifecycle includes `style.load`, used by this candidate when restoring custom field layers after a style change.
- Public Nominatim's current usage policy caps heavy use and explicitly forbids client-side autocomplete; it is not used by this candidate's search-as-you-type path.

## Proof boundary

The external APIs and exact deterministic Worker behavior have been contacted/tested, but this harness did not produce a successful automated visual execution of the React/MapLibre bundle. Do not convert that missing proof into a visual-quality or full-browser-pass claim. Round 2 must retain this as an explicit regression/proof item.
