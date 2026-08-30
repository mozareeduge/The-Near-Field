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
2. **`ALLOWED_ORIGINS` must be set** in production — it defaults to
   reflecting any origin, which is correct for local dev and wrong for a
   deployment. `.github/workflows/deploy-worker.yml` now sets it
   automatically on every deploy through that workflow (defaulting to the
   GitHub Pages origin, overridable via the `ALLOWED_ORIGINS` repo
   variable), so this risk only remains live for a manual `wrangler
   deploy` run outside that workflow.
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
5. **The web app is live; the API is not yet.** PR #1 merged to `main`
   and `.github/workflows/deploy-pages.yml` ran for real on that merge
   (build + `actions/deploy-pages` both succeeded) —
   `https://mozareeduge.github.io/The-Near-Field/` is a real, deployed
   site. This sandbox's own network egress proxy blocks `github.io`
   outright, so its actual pixels are unverified from here (same
   documented restriction as OpenFreeMap/ORS/MapTiler) — GitHub Actions'
   own success status is what this claim rests on, not a fetch from this
   environment. `.github/workflows/deploy-worker.yml` also ran on that
   merge and, exactly as designed, detected no `CLOUDFLARE_API_TOKEN`/
   `CLOUDFLARE_ACCOUNT_ID` repo secrets and skipped cleanly (job
   succeeded, all deploy steps skipped) rather than failing. Until those
   secrets are added, the live site has no working API behind it — search/
   field/gather/movement/synthesize will fail against
   `http://localhost:8787` (the unconfigured `VITE_API_BASE` default).
   See `NEXT_STEPS.md` for the exact remaining steps.

## What this verdict does not cover

External-host portability (Codex, Hermes, other Claude Code environments)
is a separate campaign per the project's own three-round finalization plan
— not attempted or claimed here.
