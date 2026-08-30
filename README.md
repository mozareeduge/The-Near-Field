# Nearby Field

A locative literary web artwork. A location becomes a bounded Wikipedia
evidence field, a selected constellation of 1–5 places, an optional verified
walking route, and one English paragraph materially dependent on that local
field.

```text
place → field → Gatherer → selected constellation → movement → Synthesizer → paragraph → map ↔ prose → again
```

It is not a chat interface, a trip planner, a GIS dashboard, or a Wikipedia
browser. See `NEXT_ROUND_INPUT/authority/10_PRODUCT_AND_INTERACTION.md` and
`12_VISUAL_CARTOGRAPHIC_SYSTEM.md` for the product/design contract this
build is held to.

## Status

**Release verdict: `READY_WITH_KNOWN_RISKS`.** See `RELEASE_STATE.md` for
the full reasoning and `KNOWN_LIMITS.md` for exactly what's unverified and
why. Short version: the app builds, runs, and passes every deterministic
check available in this environment, including a security pass that found
and fixed real issues. What's *not* verified here is live-provider behavior
(routing, model literary quality, geocoding, map tiles) — this sandbox's
network egress is blocked to all of those providers, and no live credentials
are configured. That's a proof gap, not a known defect.

## Repo layout

- `apps/web/` — the canonical React + TypeScript + MapLibre application.
- `apps/worker/` — the Cloudflare Worker backend (search / field / gather /
  movement / synthesize).
- `packages/nearby-narrative/` — the canonical Gatherer/Synthesizer skill:
  role texts, schemas, scripts, and its own deterministic test suite.
- `NEXT_ROUND_INPUT/` — frozen product/design/QA authority carried into this
  build.
- `.claude/`, `.agents/`, `STYLESEED.md`, root `CLAUDE.md`/`AGENTS.md` —
  StyleSeed vendored as a secondary craft/coherence gate on top of (never
  instead of) the locked authority above. See `CLAUDE.md` for how the two
  relate.

## Run it

```bash
npm install
npm run dev          # worker on :8787, web app on :5173 (Vite proxies via VITE_API_BASE)
```

Configuration is in `.env.example`. Without `MAPTILER_API_KEY`, search falls
back to a bounded Wikipedia coordinate search. Without `ORS_API_KEY`,
multi-place movement is always `RELATIONAL_UNVERIFIED` (never fabricated as
verified). `ALLOWED_ORIGINS` is required in production — see
`RELEASE_STATE.md` for why.

## QA

```bash
npm run qa       # = bash qa-release.sh
```

Runs, against real builds (not a syntax-approximation gate): the full Node
test suite (app, worker, and a dedicated security regression suite), the
canonical Nearby Narrative suite, both static UI contracts, a real
TypeScript + Vite build of the web app, and a real TypeScript build +
`wrangler deploy --dry-run` of the Worker.

Current result: **26/26** app/worker/security tests, **14/14** canonical
Nearby Narrative tests, both static UI contracts pass, both builds clean.
Full breakdown in `QA_EVIDENCE.md`.

## Documentation

- `ARCHITECTURE.md` — system/data flow, layer boundaries.
- `DESIGN_SYSTEM.md` — the visual/typographic/motion system and how the
  build implements it.
- `MODEL_EVALUATION.md` — Gatherer/Synthesizer model status and why live
  comparative evaluation is a documented proof gap here.
- `QA_EVIDENCE.md` — every check run this release, and its result.
- `FINAL_DEFECT_REGISTER.md` — every defect found and fixed (or explicitly
  not fixed and why) in this release pass.
- `RELEASE_STATE.md` — the verdict and its reasoning.
- `KNOWN_LIMITS.md` — what remains unverified, and exactly what would close
  each gap.
