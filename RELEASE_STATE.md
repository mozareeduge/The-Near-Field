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
26/26 app+worker+security tests, 14/14 canonical Nearby Narrative tests,
both static UI contracts, real local HTTP requests against a real running
Worker (not just mocks), and real Playwright interaction against the real
component tree. A focused security pass found four real, concrete issues
(reflected CORS with no allow-list, exact coordinates in a GET query
string, unbounded request bodies, and an unvalidated `/api/movement`
tampering/abuse vector) and fixed all four, with regression tests. That's
materially more than "static tests are green."

It is not `VERIFICATION_INCOMPLETE`: the remaining gaps are a categorical
proof boundary (missing credentials, blocked network), not unfinished
work — `KNOWN_LIMITS.md` names exactly what's outstanding and exactly what
closes each item. Nothing was left ambiguous or unattempted within what
this environment permits.

## Known risks a deployer must resolve before going live

1. **No rate limiting** on any endpoint (needs KV/Durable Objects
   provisioned at deploy time — see `KNOWN_LIMITS.md`).
2. **`ALLOWED_ORIGINS` must be set** in production — it defaults to
   reflecting any origin, which is correct for local dev and wrong for a
   deployment.
3. **The CSP's `connect-src` has a literal placeholder**
   (`REPLACE-WITH-DEPLOYED-WORKER-ORIGIN` in `apps/web/public/_headers`)
   that must be filled in with the real deployed Worker origin, or the
   app's own API calls will be blocked by its own policy.
4. **Live routing and live model behavior are unverified** — see
   `MODEL_EVALUATION.md` and `KNOWN_LIMITS.md`. The code paths are tested;
   the providers are not.

## What this verdict does not cover

External-host portability (Codex, Hermes, other Claude Code environments)
is a separate campaign per the project's own three-round finalization plan
— not attempted or claimed here.
