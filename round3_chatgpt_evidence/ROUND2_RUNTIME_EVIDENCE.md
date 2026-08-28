# Nearby Field — Round 2 runtime and QA evidence

Candidate: `NF-R2-0.2.0`  
Date: 2026-08-26

## Evidence classes

### CANDIDATE_EXECUTION — Worker/logic paths

`node --experimental-strip-types --test tests/*.test.mjs`

Result: **18/18 PASS**.

Material cases include:

- R1 extract-budget and useful-page filtering;
- deterministic 1/3/10 radius logic;
- exact `/api/field` Taft sparse path;
- exact `/api/search` keyless fallback path;
- embedded Gatherer role == canonical skill reference;
- embedded Synthesizer role == canonical skill reference;
- Gatherer rejects unknown source candidate IDs;
- Gatherer performs one bounded repair attempt and no more;
- no routing evidence → `RELATIONAL_UNVERIFIED`;
- controlled exact ORS Matrix + Directions response → `VERIFIED` + LineString;
- Directions failure → automatic downgrade;
- Synthesizer input excludes raw candidate pages/extracts/enrichment/route geometry;
- validated output requires paragraph bindings;
- invalid binding offsets remain red after the repair limit;
- Taft enrichment cannot enter movement.

### CANDIDATE_EXECUTION — canonical skill

`python packages/nearby-narrative/tests/run_tests.py`

Result: **14/14 PASS**, including canaries for extract overflow, enrichment locality, Gatherer fiction/source leakage, multi-paragraph output, and binding offsets.

`python packages/nearby-narrative/scripts/static_check.py` → **VALID**.

### INSPECTION / static executable-contract checks

- `tests/static-ui-check.py` → PASS for Round-1 entry/confirm/field/sparse/mobile/reduced-motion surfaces.
- `tests/round2-ui-static.py` → PASS for Round-2 gathering/routing/synthesizing/selection/movement/prose/map⇄prose/failure-recovery surfaces.
- `node --check standalone-r2/app.js` → PASS.
- TypeScript `transpileModule` gate → PASS for `App.tsx`, `MapView.tsx`, API/types, Worker index and Round-2 runtime.

The complete captured run is `ROUND2_QA_RUN.txt`.

## Fixture evidence

### Harpers Ferry — current Round-2 fixture

The prior v3.1 fixture is preserved as `movement.legacy-v3.1.json`. Current `movement.json` is deliberately:

- `state = RELATIONAL_UNVERIFIED`
- `route_verified = false`
- deterministic order `P01 → P02 → P03`
- coordinate-derived total relation distance ≈ 502.1 m
- **no route geometry**

Current Synthesizer output adds validated mention bindings for Harpers Ferry station, Jefferson Rock, and Lockwood House.

This demonstrates the dense multi-node path without pretending that the fixture itself is a live walking-route observation.

### Taft

The inherited Taft canaries and exact R1 Worker field test remain green. The Round-2 movement test demonstrates that coordinate-free enrichment cannot become a route node; a single selected geographic place yields `NONE`.

## Current external-interface verification (web research, not candidate execution)

Checked 2026-08-26:

- Cloudflare Workers AI documents schema-shaped JSON output via `response_format` and warns that schema adherence can still fail; Round 2 therefore keeps its own validator and retry boundary.
- Current Cloudflare model pages expose `response_format` for the provisional GLM-4.7-Flash and Llama 4 Scout adapters; both remain available in the current catalog. This establishes adapter plausibility, not literary quality.
- openrouteservice documents Matrix as distance/time evidence and Directions `/geojson` as route geometry; the matrix alone explicitly does not supply detailed route geometry.
- MapLibre documents mutable GeoJSON sources and feature identity/state mechanisms used by the selected/active map behavior.

## Verification incomplete

### Canonical browser

`npm install --ignore-scripts --no-audit --no-fund` did not complete within the harness execution window. The harness also cannot produce a reliable headless Chromium run. Therefore:

- no claim that Vite production build completed;
- no claim that MapLibre rendered successfully here;
- no claim that real keyboard/touch focus movement was observed visually;
- no screenshot/video is presented as canonical runtime evidence.

### Live providers

No authorized Workers AI binding or ORS key was available in this execution context. Provider branches are implemented and tested with controlled responses, but **live inference and live routing remain unverified**.

## Round-2 verdict

**ROUND-2 BUILD GATE: PASSED WITH EXPLICIT PROOF GAPS.**

The required architecture and fixture-backed complete encounter are implemented, the critical negative controls are green/red as expected, and no known semantic defect remains hidden. Canonical browser + live-provider evidence is intentionally carried into Round 3 instead of being mislabeled as execution.
