# QA evidence — v1.0.0 release pass

Everything below was actually executed in this session (this repository,
this branch, exact commits on `claude/code-harness-loop-8boqfk`), not
inspected or inferred. Reproduce with `npm run qa` (= `bash qa-release.sh`).

## Deterministic/static suites

| Suite | Result |
|---|---|
| `node --experimental-strip-types --test tests/*.test.mjs` (app + worker + security + rate limiting) | **35/35 PASS** |
| `packages/nearby-narrative/tests/run_tests.py` (canonical skill) | **14/14 PASS** |
| `packages/nearby-narrative/scripts/static_check.py` | VALID |
| `tests/static-ui-check.py` | PASS |
| `tests/round2-ui-static.py` | PASS |

The 35 Node tests break down as: the historical 18 (field logic, prompt
fidelity, Round-2 pipeline, worker integration), 2 regressions for the
`/api/movement` tampering fix, 6 in `tests/security.test.mjs` for the
security fixes made in the v1.0.0 release (GET-coordinate rejection, CORS
allow-list behavior in both directions, `no-store` header, oversized-body
rejection, malformed-JSON handling), and 9 new in `tests/rate-limit.test.mjs`
for the Durable-Object-backed rate limiter added in this pass (sliding-window
math including eviction and retry-after, per-IP scoping via a fake in-memory
Durable Object stub, `/health` exemption, and the dev-open no-binding
fallback).

## Real builds

| Check | Result |
|---|---|
| `npm --workspace apps/web run build` (`tsc -b && vite build`) | clean |
| `npm --workspace apps/worker run check` (`tsc --noEmit` + `wrangler deploy --dry-run`) | clean |

Both were previously broken: MapLibre GL v6's move to named-only exports
broke the web build, and a stale `@cloudflare/workers-types` pin blocked
`npm install` entirely, and the worker's own `tsc --noEmit` had two
unrelated pre-existing errors (a `.ts` import-extension config gap, a
missing `GeoJSON` type). All four are fixed; see `FINAL_DEFECT_REGISTER.md`.

## Real runtime checks (not unit-test mocks)

Run against the actual Worker via `wrangler dev --local` and the actual web
app via `vite dev`, both talking to each other over real HTTP on
localhost — not the Node `worker.fetch()` in-process harness the unit
tests use:

| Check | Result |
|---|---|
| `GET /api/field?...` | 404 (only POST is routed) |
| `POST /api/field` with `lat:999` | 400, clean error body |
| CORS header with unset `ALLOWED_ORIGINS` | reflects `Origin` (documented dev-only default) |
| `POST /api/gather` with a 250KB body | 413 |
| `POST /api/gather` with malformed JSON | 400, clean error body |
| `GET /health` | `Cache-Control: no-store` present |
| `GET /api/search?q=...` with Wikipedia unreachable | 502 with a clean error body, no crash |
| Real web app search, with the Worker's Wikipedia call blocked | UI shows "Search failed (502)" — no unhandled exception, no blank/frozen state |

## Visual/interaction verification

Self-hosted Chromium via Playwright, driving the real `apps/web` component
tree through mocked API responses built from this project's own Harpers
Ferry fixtures, at desktop (1440×1000), mobile (390×844), narrow
(320×568), and `prefers-reduced-motion`. Covered: orientation search, empty
search result, anchor preview/confirm, the full
discovering→gathering→routing→synthesizing sequence, the completed
map/prose composite, map⇄prose binding hover/click cross-highlighting, and
`again`/`new place`.

**Not covered**: live map tile rendering. `tiles.openfreemap.org` returns
`403` on `CONNECT` through this sandbox's network egress proxy — confirmed
directly with `curl`, not inferred from a blank screenshot. Layout,
typography, spacing, and interaction were all verified independent of tile
rendering (the map area renders as a flat placeholder color instead), but
the cartographic layer's actual pixel appearance is unverified here.

## Deploy pipeline (this pass)

| Check | Result |
|---|---|
| `wrangler deploy --dry-run` resolves the new `RATE_LIMITER` Durable Object binding + `new_sqlite_classes` migration | clean, binding listed in output |
| `vite build` with `VITE_API_BASE` set replaces `%VITE_API_BASE%` in the built CSP `<meta>` tag with the real origin | verified by inspecting `dist/index.html` directly |
| `vite build` with `VITE_API_BASE` unset falls back to the checked-in empty `apps/web/.env.production` default, leaving `connect-src` closed (no literal `%VITE_API_BASE%` token) rather than open | verified by inspecting `dist/index.html` directly |
| `.github/workflows/deploy-pages.yml`, `.github/workflows/deploy-worker.yml` | authored, not run — no live GitHub Actions runner in this sandbox; see `NEXT_STEPS.md` |

## Not executed here (proof gaps, not defects)

| Item | Why | Detail |
|---|---|---|
| Live ORS routing (`VERIFIED` movement against the real API) | No `ORS_API_KEY`; ORS API also unreachable through this sandbox's proxy | `KNOWN_LIMITS.md` |
| Live Workers AI Gatherer/Synthesizer calls, Round-3 comparative model evaluation | No live Cloudflare AI access from this sandbox | `MODEL_EVALUATION.md` |
| Live MapTiler geocoding | No `MAPTILER_API_KEY` configured | app correctly falls back to the tested Wikipedia coordinate-search path |
| Rate limiter against real Cloudflare infra | No live Cloudflare account access from this sandbox | The sliding-window logic and per-IP scoping *are* covered (9/9, `tests/rate-limit.test.mjs`) against a fake Durable Object stub; `wrangler deploy --dry-run` confirms the binding/migration resolve. See `KNOWN_LIMITS.md`. |

The `VERIFIED`-movement code path (matrix + directions success) *is*
covered by `tests/round2-pipeline.test.mjs` using mocked ORS responses that
match the real API's documented shape — the routing *logic* is tested; the
live *provider* is not.
