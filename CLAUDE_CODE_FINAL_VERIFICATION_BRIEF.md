# Nearby Field — Claude Code Final Verification / Release Brief

## 0. Candidate and authority

Continue this existing repository.

- Executable parent candidate: `NF-R2-0.2.0`
- Release target: `Nearby Field v1.0.0`
- Do **not** redesign or rebuild from scratch.
- Preserve adopted decisions, frozen regressions, the canonical Nearby Narrative role texts, and authority documents unless a demonstrated defect requires a repair.
- Do not weaken an oracle because the candidate fails.
- Do not substitute inspection, mocks, proxies, screenshots of another candidate, or simulation for real execution of the candidate under test.

### Read order

1. `START_HERE_CLAUDE_CODE.md`
2. `NEXT_ROUND_INPUT/ROUND3_BUILD_BRIEF.md`
3. `ROUND2_STATE.md`
4. `ROUND2_RUNTIME_EVIDENCE.md`
5. `ROUND2_DEFECT_REGISTER.md`
6. `NEXT_ROUND_INPUT/ROUND3_FROZEN_REGRESSIONS.md`
7. `NEXT_ROUND_INPUT/ROUND3_MODEL_EVAL_PROTOCOL.md`
8. `NEXT_ROUND_INPUT/authority/00_START_HERE.md`
9. `NEXT_ROUND_INPUT/authority/10_PRODUCT_AND_INTERACTION.md`
10. `NEXT_ROUND_INPUT/authority/12_VISUAL_CARTOGRAPHIC_SYSTEM.md`
11. `NEXT_ROUND_INPUT/authority/13_PROCESSING_AND_LOADER.md`
12. `NEXT_ROUND_INPUT/authority/14_TECHNICAL_ARCHITECTURE.md`
13. `NEXT_ROUND_INPUT/authority/15_SKILL_INTEGRATION_RUNTIME.md`
14. `NEXT_ROUND_INPUT/authority/17_QA_TEST_MATRIX.md`
15. `NEXT_ROUND_INPUT/authority/24_MODEL_COST_AND_EVAL_STRATEGY.md`
16. `packages/nearby-narrative/`
17. `round3_chatgpt_evidence/` only as evidence/findings to reproduce, not as higher authority than the frozen product/design/QA sources.

Read additional authority files only when an active decision requires them.

## 1. Mission

Close the remaining verification and implementation gaps of the existing candidate and produce the **actual final release**.

Required final encounter:

`place → field → Gatherer → selected constellation → movement → Synthesizer → paragraph → map↔prose → again`

**Do the work.** Do not answer with a plan in place of execution. Do not push terminal/browser/code work back to the user when Claude Code can perform it. Stop only for a genuinely missing credential/account permission or an irreducible owner decision.

## 2. First: establish the exact source state

Before modifying anything:

- inspect git status/history if available;
- record exact candidate identity/hash;
- run the inherited regression suite unchanged;
- inspect the Round-3 ChatGPT evidence and reproduce each claimed source defect against this source tree before applying a change;
- create a new distinguishable candidate rather than silently treating evidence as implementation.

The Round-3 evidence specifically raised these likely defects/repairs; verify them rather than assuming them:

1. exact anchor coordinates should not be leaked through GET query strings;
2. production CORS should be exact allow-listed;
3. request/model/source envelopes should be bounded;
4. movement/selection packets should be revalidated server-side;
5. MapLibre v6 + Vite worker packaging may require the documented worker URL setup;
6. prose should be a separate reading field after the map encounter, not a floating glass panel over the map;
7. loader staging should follow real completed stages rather than artificial waits;
8. reduced-motion, keyboard/back behavior, and accessible encounter summary need candidate-bound verification.

## 3. Canonical application verification

Install exact dependencies and repair dependency/build issues without redesigning the architecture.

Then:

- build the canonical React + TypeScript + MapLibre application;
- run the actual canonical app locally;
- exercise the **actual canonical app** with Playwright, not `standalone-r2` or another proxy;
- capture screenshots, traces, console/network errors, and relevant state evidence.

Minimum rendered states:

- desktop `1440×1000`
- mobile `390×844`
- narrow `320×568`
- reduced motion
- keyboard-only
- 200% zoom
- Taft sparse case
- Harpers Ferry dense case

Exercise the complete encounter:

`place → field → Gatherer → selected constellation → movement → Synthesizer → paragraph → map↔prose → again`

For user-visible requirements, prove the rendered/user-facing consequence, not merely internal state.

## 4. Regression and repair discipline

Run inherited tests unchanged before editing expectations.

Historical baselines include:

- Round-2 app/Worker tests: `18/18`
- canonical Nearby Narrative tests: `14/14`

If a test fails:

`OBSERVE → REPRODUCE → FREEZE EXISTING ORACLE → DIAGNOSE → NEW CANDIDATE → MINIMUM CORRECT REPAIR → BLIND RETEST → ADJACENT REGRESSION`

Never change expected behavior simply to make the implementation green.

After implementing Round-3 repairs, add targeted regressions/canaries for each new release boundary.

## 5. Routing truth — live ORS

If `OPENROUTESERVICE_API_KEY` is available:

- execute the real ORS Matrix API;
- execute real ORS Directions GeoJSON;
- demonstrate at least one genuine `VERIFIED` movement;
- verify Matrix-only evidence can **never** produce `VERIFIED`;
- verify provider failure/partial failure downgrades to `RELATIONAL_UNVERIFIED`;
- verify one selected place yields `NONE`;
- preserve exact provider evidence in QA artifacts without leaking secrets.

If no ORS credential is available, do not fake this test. Record the exact blocked proof in `RELEASE_STATE.md` and continue all independent work.

## 6. Live model / literary evaluation

Use `NEXT_ROUND_INPUT/ROUND3_MODEL_EVAL_PROTOCOL.md` exactly as the evaluation contract.

If the configured Cloudflare/Workers AI account/binding is available:

- execute actual Gatherer and Synthesizer provider calls;
- use the required varied set of location packets;
- keep evidence packets identical across compared models;
- compare the required candidates using the frozen rubric;
- preserve model IDs, model settings/seeds where supported, complete outputs, latency, token/cost data, validation failures, retries, and rubric judgments;
- select final Gatherer and Synthesizer only from this evidence.

Canonical Gatherer/Synthesizer role texts must remain unchanged.

Provider JSON/schema compliance alone is not sufficient. Existing candidate/source/evidence/binding semantic validators remain authoritative.

If Workers AI access is unavailable, say exactly which credential/binding/account capability is missing. Do not replace the frozen comparison with subjective prose.

## 7. Security and privacy

Verify against the running candidate, including network inspection where relevant:

- exact coordinates never enter request URLs;
- raw GPS never enters model input;
- secrets remain server-side;
- production CORS uses an exact allow-list;
- CSP behaves as intended;
- request payload limits work;
- source/generation rate limits work;
- tampered place/coordinate/evidence packets fail;
- source/model responses are `no-store` where specified;
- stale async responses cannot overwrite a newer encounter;
- failures do not erase prior valid field/selection state.

Use disposable negative controls/canaries for critical green mechanisms where feasible.

## 8. Cartographic / sensory craft

Review the **actual canonical rendered app**, not code alone.

Preserve this spatial contract:

`orientation map → field-mode map → completed spatial encounter → release space → separate reading field → provenance`

The prose must **not** become a floating glass panel over the map.

The map has two regimes:

- orientation mode remains conventionally legible enough to locate/confirm the place;
- field mode suppresses ordinary map hierarchy and raises anchor/candidates/selected constellation/movement/prose relations.

Inspect and repair material defects in:

- geometry/proportion;
- spatial rhythm and map→reading release space;
- typography and prose measure;
- density and overlap;
- orientation vs field hierarchy;
- selected/unselected field relation;
- movement/route hierarchy;
- motion timing/easing;
- loader timing;
- mobile and 320px transformation;
- interaction feedback/tactility;
- map↔prose identity;
- reduced-motion equivalent;
- accessible reading/encounter summary.

Aesthetic changes must be justified against the authority files and actual rendered consequences, not by generic UI taste.

## 9. Final adversarial pass

After the first canonical candidate is green, deliberately attack it.

At minimum test:

- sparse geography;
- dense geography;
- invalid Gatherer IDs;
- invalid prose offsets;
- interrupted/failed AI request;
- ORS Matrix success + Directions failure;
- stale async response;
- repeated `Again`;
- hostile Origin;
- oversized source request;
- oversized generation request;
- coordinate/selection tampering;
- reduced motion;
- 320px viewport;
- keyboard-only operation;
- 200% zoom;
- missing model/provider credential;
- missing route credential.

A material defect must result in an actual repaired candidate and blind retest—not merely an issues list.

## 10. Final release artifacts

Produce/update these in the repository root:

- `README.md`
- `ARCHITECTURE.md`
- `DESIGN_SYSTEM.md`
- `MODEL_EVALUATION.md`
- `QA_EVIDENCE.md`
- `FINAL_DEFECT_REGISTER.md`
- `RELEASE_STATE.md`
- `KNOWN_LIMITS.md`
- `.env.example`

Also preserve under an evidence directory:

- canonical Playwright screenshots/traces;
- test reports;
- live ORS evidence when available;
- live model evaluation outputs when available;
- exact model identities;
- dependency/build versions;
- exact candidate identity/hash/commit.

Do not store API keys or secrets in evidence or source control.

## 11. Release verdict

The final verdict must be exactly one of:

- `READY`
- `READY_WITH_KNOWN_RISKS`
- `NOT_READY`
- `VERIFICATION_INCOMPLETE`

Do not substitute a pass percentage.

A central interaction/visual/model/routing behavior that was not exercised with a capable evidence mode cannot support `READY` merely because static tests are green.

## 12. Finish condition

This is the final verification/build pass. Do not defer ordinary testing, craft, repair, or packaging to another round.

Close everything the environment permits. If an external credential blocks one branch, continue all independent branches and isolate that blocked proof precisely.
