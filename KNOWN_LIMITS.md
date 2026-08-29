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

## Rate limiting — implemented, unverified against live infra

`apps/worker/src/rate-limit.ts` implements a real sliding-window rate
limiter backed by a Cloudflare Durable Object (`RateLimiter`, wired into
`wrangler.jsonc` with a `new_sqlite_classes` migration — the storage
backend the Workers Free plan requires). Every request to `/api/*` (not
`/health`) is checked against a per-client-IP (`CF-Connecting-IP`) window
before it reaches any handler; a request over the limit gets `429` with a
`Retry-After` header. Defaults are 60 requests / 300s, overridable via the
`RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_S` worker vars. Without a
`RATE_LIMITER` binding present, the check is skipped entirely — the same
dev-open pattern this codebase already uses for `ALLOWED_ORIGINS` — so
local `wrangler dev` and this sandbox's Node-harness tests are unaffected.

The sliding-window math (`evaluateRateLimit`) is unit tested directly
(9 tests in `tests/rate-limit.test.mjs`, including window eviction and
per-IP scoping) against a fake in-memory Durable Object stub. **What this
sandbox cannot verify**: the class actually provisioning correctly on a
real Cloudflare account, one instance genuinely being addressed by the
same `idFromName` key across separate Worker invocations at the edge, and
behavior under real concurrent traffic. `wrangler deploy --dry-run`
confirms the binding and migration resolve without error, which is as far
as this sandbox's proof boundary goes.

## CSP and security headers on GitHub Pages — a real, unclosable gap

`apps/web/public/_headers` still ships a real Content-Security-Policy in
Cloudflare-Pages `_headers` format, for if this app is ever deployed to
Cloudflare Pages instead. **GitHub Pages does not read that file at all**
— it serves only static files and sends no custom response headers. Since
this round targets GitHub Pages, `apps/web/index.html` now also carries a
`<meta http-equiv="Content-Security-Policy">` tag, the only CSP
enforcement mechanism GitHub Pages hosting supports. Its `connect-src` is
filled in at build time via Vite's `%VITE_API_BASE%` HTML env
interpolation (sourced from the `VITE_API_BASE` CI variable — see
`.github/workflows/deploy-pages.yml` and `apps/web/.env.production`), so
this is no longer a literal unfilled placeholder the way `_headers`'s was.

What a `<meta>` CSP cannot do, and GitHub Pages has no other mechanism
for: no `frame-ancestors` (the HTML spec has browsers silently ignore it
in a meta tag), and no `X-Frame-Options`, `X-Content-Type-Options`,
`Referrer-Policy`, or `Permissions-Policy` at all — those exist only as
response headers, which GitHub Pages does not let this app set. This is a
real residual risk of choosing GitHub Pages over Cloudflare Pages for the
static site, not an oversight: closing it fully requires either switching
the static host to something that honors custom headers (Cloudflare
Pages, where `_headers` already covers it) or fronting GitHub Pages with
a CDN/proxy that can inject them.

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
