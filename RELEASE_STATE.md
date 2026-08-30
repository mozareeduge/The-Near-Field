# Release state

## Verdict: `READY_WITH_KNOWN_RISKS`

## Candidate

`Nearby Field v1.0.0`, built from the `NF-R2-0.2.0` source candidate in the
Claude Code handoff package. Root/`apps/web`/`apps/worker` versioned
`1.0.0` this release.

## Reasoning

Per `CLAUDE_CODE_FINAL_VERIFICATION_BRIEF.md` §11: *"A central
interaction/visual/model/routing behavior that was not exercised with a
capable evidence mode cannot support `READY` merely because static tests
are green."* Live routing (ORS), live model comparison (Workers AI), live
geocoding (MapTiler), and live map tile rendering (OpenFreeMap) were not
exercised here — not skipped, but categorically blocked: no live
credentials are configured, and this sandbox's network egress proxy blocks
every one of those provider domains (confirmed directly for each, not
inferred). That rules out `READY`.

It is not `NOT_READY`: every check this environment could actually run,
ran, and is green — real TypeScript+Vite and TypeScript+Wrangler builds,
35/35 app+worker+security tests, 14/14 canonical Nearby Narrative tests,
both static UI contracts, real local HTTP requests against a real running
Worker (not just mocks), and real Playwright interaction against the real
component tree. A focused security pass found four real, concrete issues
(reflected CORS with no allow-list, exact coordinates in a GET query
string, unbounded request bodies, and an unvalidated `/api/movement`
tampering/abuse vector) and fixed all four, with regression tests. That's
materially more than "static tests are green."

A follow-up pass took this from "verified but never deployed anywhere" to
"has a real, working deploy pipeline": a GitHub Pages workflow for
`apps/web`, a secret-gated Cloudflare Workers deploy workflow for
`apps/worker`, a real Durable-Object-backed rate limiter (previously
genuinely unimplemented), and GitHub-Pages-appropriate CSP delivery. None
of that required credentials this sandbox lacks — it's checked-in
configuration and code, verified by real builds and `wrangler deploy
--dry-run`, not a live deploy. See `NEXT_STEPS.md` for exactly what a
human still needs to supply to make it live.

It is not `VERIFICATION_INCOMPLETE`: the remaining gaps are a categorical
proof boundary (missing credentials, blocked network, a repo-settings
toggle no tool in this environment exposes), not unfinished work —
`KNOWN_LIMITS.md` and `NEXT_STEPS.md` name exactly what's outstanding and
exactly what closes each item. Nothing was left ambiguous or unattempted
within what this environment permits.

## Known risks a deployer must resolve before going live

1. ~~No rate limiting~~ **Implemented** as a Durable-Object-backed
   sliding window (`apps/worker/src/rate-limit.ts`, wired into
   `wrangler.jsonc`), unit tested (9/9,
   `tests/rate-limit.test.mjs`). Unverified against a real deployed
   Cloudflare account — see `KNOWN_LIMITS.md`.
2. ~~`ALLOWED_ORIGINS` must be set~~ **Confirmed set on the live deploy.**
   `.github/workflows/deploy-worker.yml` sets it automatically on every
   deploy through that workflow (defaulting to the GitHub Pages origin,
   overridable via the `ALLOWED_ORIGINS` repo variable) — verified by
   inspecting the real successful run's log, not just the workflow source.
   Only remains a risk for a manual `wrangler deploy` run outside CI.
3. **GitHub Pages cannot serve the `_headers`-format CSP** —
   `apps/web/index.html` now carries an equivalent `<meta>` CSP with its
   `connect-src` filled in from the `VITE_API_BASE` build variable, but a
   `<meta>` CSP cannot carry `frame-ancestors`, and GitHub Pages has no
   mechanism at all for `X-Frame-Options`/`X-Content-Type-Options`/
   `Referrer-Policy`/`Permissions-Policy`. See `KNOWN_LIMITS.md` for what
   closing this fully would require.
4. **Live routing and live model behavior are unverified** — see
   `MODEL_EVALUATION.md` and `KNOWN_LIMITS.md`. The code paths are tested;
   the providers are not.
5. ~~The web app is live; the API is not yet~~ **Both are live and
   connected.** `https://mozareeduge.github.io/The-Near-Field/` (web) and
   `https://nearby-field-r2.mozareeduge.workers.dev` (API, with the
   `RATE_LIMITER` Durable Object and Workers AI bindings active) are both
   real, deployed, and wired to each other — the Pages build's
   `VITE_API_BASE` was confirmed in the build log to be the real Worker
   origin, baked into both the JS `fetch()` calls and the CSP
   `connect-src`. This sandbox's own network egress proxy blocks
   `github.io`/`workers.dev` outright, so the actual pixels and live
   request/response behavior are unverified from here (same documented
   restriction as OpenFreeMap/ORS/MapTiler) — every claim above rests on
   GitHub Actions' own success status and real deploy logs (worker script
   size, bindings table, deployed URL, `ALLOWED_ORIGINS` value), not a
   fetch performed from this environment. Getting here from a cold
   Cloudflare account required two real-world steps no sandbox could
   simulate or skip past: registering a `workers.dev` subdomain, and
   fixing two `wrangler-action` step-ordering/edge-case bugs only visible
   against a real account (see git history on `deploy-worker.yml`). What's
   still genuinely unverified: live ORS/MapTiler/OpenFreeMap behavior
   (`ORS_API_KEY`/`MAPTILER_API_KEY` were deliberately left unset — the
   worker's tested fallbacks are what's live right now), and the rate
   limiter under real concurrent edge traffic.

## What this verdict does not cover

External-host portability (Codex, Hermes, other Claude Code environments)
is a separate campaign per the project's own three-round finalization plan
— not attempted or claimed here.
