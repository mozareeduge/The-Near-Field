# Next steps to go live

Status: **the whole pipeline is live.** Both the web app and the API are
deployed and wired to each other:

- Web: `https://mozareeduge.github.io/The-Near-Field/`
- API: `https://nearby-field-r2.mozareeduge.workers.dev` (with the
  `RATE_LIMITER` Durable Object and Workers AI bindings active,
  `ALLOWED_ORIGINS` locked to the GitHub Pages origin)

Everything below is now either done, genuinely optional, or a permanent
platform trade-off — not a blocker to using the deployed app.

## Done

1. **GitHub Pages enabled and live.** `.github/workflows/deploy-pages.yml`
   ran for real; build and `actions/deploy-pages` both succeeded.
2. **Cloudflare account/API token created, repo secrets added**
   (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`).
3. **Worker deployed for real** via `.github/workflows/deploy-worker.yml`.
   Getting here from a cold account took three real fixes, each only
   discoverable against a live account (not something this project's own
   sandbox testing could have caught):
   - Cloudflare accounts need a `workers.dev` subdomain registered before
     any Worker can publish there — a one-time manual dashboard step.
   - `wrangler-action`'s `secrets` input runs `wrangler secret put`, which
     needs an *existing* script — the workflow now deploys first, then
     uploads secrets, instead of folding both into one step.
   - `wrangler-action`'s `secrets` input hard-fails on a listed name with
     no value at all (not just skips it) — the workflow now only lists
     secret names that are actually configured, so leaving
     `MAPTILER_API_KEY`/`ORS_API_KEY` unset (see below) doesn't break the
     deploy.
4. **`VITE_API_BASE` repo variable set** to the real Worker origin, and
   the Pages site rebuilt — confirmed directly in that build's log
   (`VITE_API_BASE: https://nearby-field-r2.mozareeduge.workers.dev`),
   baked into both the JS `fetch()` calls and the CSP `connect-src`.
5. **Rate limiting is live**: the `RATE_LIMITER` Durable Object binding
   deployed cleanly; `GET https://nearby-field-r2.mozareeduge.workers.dev/health`
   should report `"rateLimited":true`.

## Optional: real geocoding and routing

Right now the worker runs on its tested fallbacks — Wikipedia
coordinate-search instead of MapTiler geocoding, and an honestly-labeled
`RELATIONAL_UNVERIFIED` movement state instead of a verified ORS walking
route. Both fallbacks are real, working, tested code paths, not stubs —
this is a quality upgrade, not a fix. To enable the real providers:

1. Get free-tier keys: MapTiler at https://cloud.maptiler.com, ORS at
   https://openrouteservice.org/dev/#/signup.
2. Add them as repo secrets (**Settings → Secrets and variables → Actions
   → Secrets**): `MAPTILER_API_KEY`, `ORS_API_KEY`.
3. Re-run **Actions → Deploy worker to Cloudflare → Run workflow**.

## Optional: verify live behavior this sandbox categorically could not

This project's own network egress proxy has blocked `github.io`,
`workers.dev`, `tiles.openfreemap.org`, `api.openrouteservice.org`, and
`api.maptiler.com` throughout every round of this project — every claim
about the live deploy above rests on GitHub Actions' own logs (build
output, deploy bindings table, deployed URL), not a fetch performed from
any sandbox. Worth checking yourself, once, since nothing here ever could:

- Open the site and confirm the map tiles actually render (layout,
  typography, and interaction were all verified independent of tile
  rendering across this project's whole history, but the cartographic
  layer's real pixel appearance never has been).
- Run a full search → confirm → gather → route → synthesize pass and
  watch a real Workers AI response come back.
- If you added the optional keys above, confirm a real ORS route and real
  MapTiler autocomplete.

## Optional cleanup: a second, unused Cloudflare deploy path

At some point during setup, Cloudflare's own native Git-connected
"Workers Builds" product got connected to this repo too (visible as a
project sometimes labeled `thenearfield` in the Cloudflare dashboard,
separate from anything in `.github/workflows/`). Its one build attempt
failed (it ran `wrangler deploy` from the repo root instead of
`apps/worker/`, which this monorepo's layout doesn't support) and it has
deployed nothing — the live Worker came entirely from
`deploy-worker.yml`. It's harmless sitting there unused, but if you'd
rather not have a second, non-functional deploy path connected: Cloudflare
dashboard → **Workers & Pages** → find that project → **Settings →
Disconnect** (or delete the project). Not required for anything to keep
working.

## Permanent trade-off: GitHub Pages cannot serve the `_headers`-format CSP

GitHub Pages serves static files only and does not support custom response
headers. `apps/web/index.html` carries a `<meta>` CSP that covers as much
as that mechanism allows, but there is no way on GitHub Pages to send
`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, or
`Permissions-Policy`, and `frame-ancestors` is silently dropped from a
`<meta>` CSP by the HTML spec itself. `apps/web/public/_headers` still
carries the full header set in case this app is ever moved to Cloudflare
Pages instead, where it would take effect immediately. This is a real,
informed trade-off of the hosting choice this round targeted (GitHub
Pages), not an oversight — see `KNOWN_LIMITS.md`.
