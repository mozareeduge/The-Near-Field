# Nearby Field — Round 2 candidate

**Candidate:** `NF-R2-0.2.0`  
**Parent:** `NF-R1-0.1.0`  
**Round objective:** complete the first literary encounter without collapsing retrieval, selection, movement, and prose into one opaque model call.

Implemented causal path:

`confirmed field → canonical Gatherer → validated selected constellation → truthful movement → canonical Synthesizer + binding extension → one paragraph → map ⇄ prose`

## What changed in Round 2

- Added separate Worker endpoints for Gatherer, movement, and Synthesizer so each stage is independently retryable and prior valid state survives later failure.
- Embedded the canonical Gatherer and Synthesizer static roles exactly; added prompt-fidelity regression tests.
- Added schema-shaped Workers AI requests, output validation, exact candidate/source identity checks, one bounded model repair attempt, and run metadata.
- Added ORS Matrix + Directions adapter. `VERIFIED` is impossible unless the exact ordered points receive route-provider evidence and a route LineString. Without that evidence the system returns `RELATIONAL_UNVERIFIED`; one selected place returns `NONE`.
- Added visible selected-state map behavior while preserving unselected field objects as residue/context.
- Added one-paragraph validation, used-place validation, strict mention/reference offsets, structural bindings, and evidence-ID validation.
- Added shared map/prose object activation for mouse, keyboard, focus, and touch/click paths.
- Added failure recovery, `again`, provenance, and an accessible non-canvas encounter summary.
- Superseded the legacy Harpers Ferry `VERIFIED` fixture in the current Round-2 fixture; the legacy file is preserved explicitly as historical evidence.

## Run surfaces

### Production source

- `apps/web/` — React + TypeScript + MapLibre interface
- `apps/worker/` — field/search + Gatherer + movement + Synthesizer Worker

Configuration is described in `.env.example`. The Workers AI binding is declared in `apps/worker/wrangler.jsonc`.

### Dependency-free Round-2 encounter fixture

Open `standalone-r2/index.html` in a normal browser. It contains local Harpers Ferry and Taft fixtures and demonstrates the Round-2 state grammar without claiming live AI/routing evidence.

- default: Harpers Ferry, dense multi-node, `RELATIONAL_UNVERIFIED`
- `?fixture=taft`: sparse/single-node, `NONE`
- `?route=verified` is a visual fixture branch only; it is not provider proof.

## QA

Run:

```bash
./qa-round2.sh
```

Current deterministic result:

- Round-2/Round-1 Node tests: **18/18 PASS**
- inherited canonical Nearby Narrative suite: **14/14 PASS**
- canonical skill static check: **VALID**
- Round-1 and Round-2 static UI contracts: **PASS**
- standalone JavaScript parse: **PASS**
- selected TS/TSX syntax/transpile gate: **PASS**

See `ROUND2_RUNTIME_EVIDENCE.md` for what these results do and do not prove.

## Proof boundary

This execution harness could not finish `npm install` and its system Chromium remained unusable for a headless browser run. Therefore this package does **not** claim a canonical React/MapLibre browser execution, a live Workers AI call, or a live ORS route. Those remain candidate-bound Round-3 verification items rather than being simulated into a green claim.

## Continue

Round 3 starts from `NEXT_ROUND_INPUT/README.md`.
