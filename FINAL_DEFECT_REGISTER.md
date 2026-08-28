# Final defect register

Format: `LOCATION/RULE → SCENARIO → FAILURE → ROOT CAUSE → REPAIR → EXPECTED IMPROVEMENT`,
per `CLAUDE_CODE_FINAL_VERIFICATION_BRIEF.md` §9. Ordered roughly by
severity within each pass. Everything marked **FIXED** was actually
changed, rebuilt, and re-tested — not just noted.

## Design pass (before this finalization pass)

1. **`apps/web/src/App.tsx`/`styles.css` → any completed encounter →
   literary paragraph rendered as a `backdrop-filter` panel floating over
   the still-fullscreen map → root cause: the completed-state layout was
   never split from the live-encounter layout → repaired: `.map-stage`
   settles to a bounded hero, `.reading-field` is a real document-flow
   section below it → directly restores the locked §16 "map/prose
   composite" contract, and closes verification-brief item 6 exactly as
   named. **FIXED.**
2. **`styles.css` → whole app → generic Inter/Georgia/system-mono typography
   instead of the specified Recursive variable-axis system → root cause:
   the font was never actually integrated → repaired: self-hosted
   `@fontsource-variable/recursive`, axes applied per register (§4) →
   restores the specified two-register typographic identity. **FIXED.**
3. **`apps/web/src/components/MapView.tsx` → any build → `tsc -b && vite
   build` fails → root cause: maplibre-gl v6 removed its default export
   (named exports only) → repaired: import `Map`/`NavigationControl`/
   `AttributionControl` as named imports → build compiles clean. **FIXED.**
4. **`apps/worker/package.json` → `npm install` from repo root → fails →
   root cause: `@cloudflare/workers-types@^4.20260820.0` doesn't exist (the
   package moved to a `5.x` date-based scheme) → repaired: pinned to
   `^5.20260828.1` → install succeeds. **FIXED.**
5. **`styles.css` mobile media query → field/gathering/routing/synthesizing
   phases on a narrow viewport → candidate ledger overlaps the map
   attribution text → root cause: introduced while fixing #1 (bottom
   offset reduced from 62px to 12px without noticing the reserved
   attribution-row space) → repaired: restored adequate clearance →
   confirmed no overlap via Playwright at 390×844. **FIXED** (same session
   it was introduced).
6. **`App.tsx` → zero-result search → no feedback shown → root cause: the
   spec's own required copy ("Nothing surfaced here",
   `12_VISUAL_CARTOGRAPHIC_SYSTEM.md` §17) was never wired up → repaired:
   added the empty-state branch and `.search-empty` styling. **FIXED.**
7. **`styles.css`, ~30 declarations → whole app → spacing values drifted off
   the declared 4px base-unit grid (9/10/13/14/17/18/22/45/46/62px etc.) →
   root cause: hand-tuned values never audited against the authority's §5
   grid → repaired: every spacing value snapped to a 4px multiple, except
   values the authority explicitly specifies outside that grid (52px search
   height, safe-area floors) → re-verified visually, no regression.
   **FIXED.**
8. **`styles.css` → dark/field-mode floating panels (ledger, inspector,
   enrichment, error surface) → three different elevation treatments
   (blur+hairline, border+shadow, border-only) on panels of the same
   family → root cause: never unified across incremental edits → repaired:
   one treatment (tonal surface + hairline, no shadow, no blur) per
   VISUAL-CRAFT's dark-surface guidance; light-register overlays keep their
   own separate, internally-consistent treatment (documented in a CSS
   comment, not a second violation). **FIXED.**

## Finalization / security pass (this pass)

9. **`apps/worker/src/index.ts`, `round2.ts` → `corsHeaders`/`response` →
   any cross-origin request → `access-control-allow-origin` reflects
   whatever `Origin` the request sent, unconditionally → root cause: no
   allow-list existed → repaired: `ALLOWED_ORIGINS` env var (comma-separated
   exact origins); unset only in local dev, where it reflects any origin as
   a documented dev-only default, never the deployed one → directly closes
   verification-brief item 2. **FIXED.** Covered by
   `tests/security.test.mjs`.
10. **`apps/worker/src/index.ts` `handleField`, `apps/web/src/lib/api.ts`
    `fetchField` → every field lookup → the exact anchor coordinate
    traveled in the `/api/field` GET query string → root cause: original
    Round-1 shape never revisited → repaired: `/api/field` is now POST with
    a JSON body → closes verification-brief item 1 exactly as named.
    **FIXED.** Covered by `tests/security.test.mjs` and updated
    `tests/worker-integration.test.mjs`.
11. **`apps/worker/src/round2.ts` `handleGather`/`handleMovement`/
    `handleSynthesize`, `index.ts` `handleField` → any POST → request
    bodies were parsed with no size bound → root cause: never bounded →
    repaired: 200KB cap (checked via `Content-Length` and actual body
    length) before `JSON.parse`, `413` otherwise → closes verification-brief
    item 3 ("request/model/source envelopes should be bounded"). **FIXED.**
    Covered by `tests/security.test.mjs`.
12. **`apps/worker/src/round2.ts` `handleMovement` → any movement request →
    `gatherer.selected_places` (including coordinates) was trusted
    unvalidated, unlike `/api/gather` and `/api/synthesize`, which both
    cross-check against the original `field` → a client could skip
    `/api/gather` entirely and post arbitrary coordinates disguised as
    "selected_places," using the endpoint (and the server's ORS credential)
    to route or tamper with points that were never actually selected from
    real evidence → root cause: `handleMovement` never received `field` to
    validate against → repaired: `field` is now required in the request
    body and `gatherer` is revalidated against it exactly like Synthesizer
    does, before ORS is ever called → closes the "movement/selection
    packets should be revalidated server-side" item and the
    "coordinate/selection tampering" adversarial case named in the brief.
    **FIXED.** Covered by two new regression tests in
    `tests/round2-pipeline.test.mjs`.
13. **`apps/worker/src/index.ts`, `round2.ts` → every API response → no
    `Cache-Control` header → root cause: never set → repaired:
    `Cache-Control: no-store` on all JSON responses → closes "source/model
    responses are no-store where specified." **FIXED.**
14. **`apps/worker/tsconfig.json` → `tsc --noEmit` → two pre-existing errors
    (`.ts` import extension without `allowImportingTsExtensions`, missing
    `GeoJSON` namespace) → root cause: config gaps, not code bugs → repaired:
    enabled `allowImportingTsExtensions`, added `geojson` to `types` and
    `@types/geojson` as a devDependency → clean typecheck. **FIXED.**
15. **`apps/web/public/_headers` (new) → deployed static site → no CSP or
    baseline security headers existed for the web app at all → repaired:
    added a Cloudflare Pages `_headers` file (CSP, `X-Content-Type-Options`,
    `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) → closes
    "CSP behaves as intended." **Partially fixed — see `KNOWN_LIMITS.md`**:
    the CSP's `connect-src` contains a placeholder
    (`REPLACE-WITH-DEPLOYED-WORKER-ORIGIN`) a deployer must fill in with the
    actual deployed Worker origin before shipping; it cannot be known at
    build time since the Worker and static site deploy separately.
16. **`README.md`, `apps/web/index.html`, `package.json`×3 → whole repo →
    stale "Round 1"/"Round 2 candidate" naming and `0.2.0-r2` versions
    throughout → root cause: never updated at release → repaired: retitled,
    versioned `1.0.0` across root/`apps/web`/`apps/worker`. **FIXED.**

## Explicitly not fixed, and why

- **No rate limiting on any endpoint.** Real rate limiting on Cloudflare
  Workers needs a durable store (KV or Durable Objects) provisioned at
  deploy time — that's infrastructure to provision, not a code change this
  pass can make correctly from a sandbox with no deploy access. A
  same-request in-memory counter would be actively misleading (Workers are
  stateless per-request) so it was not implemented as a placeholder.
  Documented as an open risk in `KNOWN_LIMITS.md`, not silently skipped.
- **Live ORS/Workers AI/MapTiler behavior.** See `MODEL_EVALUATION.md` and
  `KNOWN_LIMITS.md` — categorically blocked by this sandbox's network
  policy and missing credentials, not a code defect.
