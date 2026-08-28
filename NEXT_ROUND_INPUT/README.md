# Full input for Round 3 — Nearby Field

This directory makes the final round executable in a fresh context without reconstructing Rounds 1–2 from chat.

## Current candidate to continue

Parent candidate: `NF-R2-0.2.0`  
Its actual implementation is one directory above:

- `../apps/web/`
- `../apps/worker/`
- `../packages/contracts/`
- `../packages/nearby-narrative/`
- `../fixtures/`
- `../tests/`
- `../standalone-r2/`

Do not rebuild the application from scratch.

## Read order

1. `ROUND3_BUILD_BRIEF.md`
2. `../ROUND2_STATE.md`
3. `../ROUND2_RUNTIME_EVIDENCE.md`
4. `../ROUND2_DEFECT_REGISTER.md`
5. `ROUND3_FROZEN_REGRESSIONS.md`
6. `ROUND3_MODEL_EVAL_PROTOCOL.md`
7. `authority/00_START_HERE.md`
8. `authority/10_PRODUCT_AND_INTERACTION.md`
9. `authority/12_VISUAL_CARTOGRAPHIC_SYSTEM.md`
10. `authority/13_PROCESSING_AND_LOADER.md`
11. `authority/14_TECHNICAL_ARCHITECTURE.md`
12. `authority/15_SKILL_INTEGRATION_RUNTIME.md`
13. `authority/17_QA_TEST_MATRIX.md`
14. `authority/24_MODEL_COST_AND_EVAL_STRATEGY.md`
15. other authority/evidence only when the active decision requires it.

## Authority rule

Round 2 supersedes prior state only where `ROUND2_STATE.md` records an adopted decision or where a demonstrated defect required an evidence-backed repair. In particular:

- the old Harpers Ferry `VERIFIED` fixture is historical/superseded for current route truth;
- canonical Gatherer/Synthesizer skill roles remain authoritative and are now guarded by prompt-fidelity tests;
- provisional Cloudflare model names are implementation defaults, **not final artistic/model choices**;
- open visual/craft decisions remain open until judged on an actual rendered candidate.

## Required output of Round 3

A repaired, candidate-bound `Nearby Field v1.0.0` release completing all of:

`working browser encounter + real provider evidence + model/literary selection + cartographic/sensory craft + responsive/accessibility + privacy/security/resilience + adversarial QA + release package`

Round 3 is the final build round. Testing, craft, repair, and packaging are inside Round 3; they are not deferred to a Round 4.
