# Known limits and proof gaps

Everything here is a boundary of what this environment could verify, not a
known defect in the code. Each entry names exactly what would close it.

## Live provider behavior — unverified

| Provider | Blocked by | What's actually tested | What would close the gap |
|---|---|---|---|
| OpenRouteService (routing) | no `ORS_API_KEY`; ORS's API is also unreachable through this sandbox's network egress proxy | the `VERIFIED`/downgrade *logic* against mocked responses shaped like the real API (`tests/round2-pipeline.test.mjs`) | run with a real `ORS_API_KEY` in an unrestricted network, exercise a real multi-place selection, confirm a real LineString comes back |
| Cloudflare Workers AI (Gatherer/Synthesizer) | no live Cloudflare AI account access from this sandbox | prompts, schemas, validators, and the one-retry repair loop, all against real model-*shaped* failures (see `MODEL_EVALUATION.md`) | run with real Workers AI access against the frozen packet set `ROUND3_MODEL_EVAL_PROTOCOL.md` requires |
| MapTiler (geocoding) | no `MAPTILER_API_KEY` configured | the Wikipedia coordinate-search fallback path (`tests/worker-integration.test.mjs`) | configure a key, verify autocomplete/fuzzy-match quality against real queries |
| OpenFreeMap (map tiles) | `tiles.openfreemap.org` returns `403` on `CONNECT` through this sandbox's proxy (confirmed directly with `curl`, not inferred) | layout, spacing, typography, and interaction, independent of tile rendering (the map area renders as a flat placeholder in every screenshot taken here) | open the app in a normal network environment and look at it |

## Known unimplemented: rate limiting

No endpoint has rate limiting. This needs a durable store (Cloudflare KV or
Durable Objects) provisioned at deploy time; implementing an in-process
counter would be actively misleading since Workers are stateless per
request and it would provide no real protection. This is a real,
unaddressed risk for a deployed instance — not a rounding error — and
should be closed before this handles meaningful public traffic.

## CSP placeholder

`apps/web/public/_headers` ships a real Content-Security-Policy, but its
`connect-src` includes a literal placeholder,
`REPLACE-WITH-DEPLOYED-WORKER-ORIGIN`, because the Worker and the static
site are deployed and versioned separately — the static site's build has no
way to know the Worker's eventual origin. **A deployer must fill this in
before shipping**, or the app's own API calls will be blocked by its own
CSP.

## Adversarial pass — partial

`CLAUDE_CODE_FINAL_VERIFICATION_BRIEF.md` §9 lists sixteen adversarial
cases. What this pass actually exercised, live, against the real running
Worker (not a mock): oversized request bodies, malformed JSON, hostile
Origin, coordinate/selection tampering on `/api/movement`, invalid
coordinates, upstream-provider failure (Wikipedia unreachable → clean 502,
no crash). What it did *not* exercise live, because they require a live
model/routing provider or a real deployed CORS boundary this sandbox
cannot reach: invalid Gatherer IDs against a real model response,
interrupted/failed AI request against a real call, ORS Matrix-success/
Directions-failure against the real API, repeated `Again` against real
generations. The *code paths* for all of these are covered by mocked unit
tests (see `QA_EVIDENCE.md`); the live-provider instances are not.

## What is genuinely done

Everything in `QA_EVIDENCE.md`'s green tables, and every fix in
`FINAL_DEFECT_REGISTER.md`, is real: real builds, real local HTTP requests
against a real running Worker, real Playwright interaction against the real
component tree. The boundary above is drawn honestly at "needs a credential
or network path this sandbox does not have," not at "ran out of time to
check."
