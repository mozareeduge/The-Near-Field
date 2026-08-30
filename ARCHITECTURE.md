# Architecture

## Shape

Two deployables, one shared contract:

```text
apps/web     React 19 + TypeScript + Vite + MapLibre GL 6 (static site)
apps/worker  Cloudflare Worker (Workers AI binding, no other stateful bindings)
```

They talk over a small JSON API the Worker exposes; there is no shared
database, session store, or server-rendered coupling. `packages/contracts`
holds the TypeScript types both sides agree on; `apps/web/src/lib/types.ts`
mirrors the wire shapes the Worker actually returns.

## Request flow

```text
GET  /api/search        query -> place results (MapTiler if configured, else
                         a bounded Wikipedia coordinate-search fallback)
POST /api/field          {lat, lon, label?, date?} -> the bounded Wikipedia
                         evidence field (candidates + sparse enrichment)
POST /api/gather         {run_id, field, anchor_granularity} -> one Workers AI
                         call to the Gatherer role, schema-validated,
                         cross-checked against `field`, one bounded retry
POST /api/movement       {anchor, field, gatherer} -> pedestrian route via
                         ORS Matrix+Directions if ORS_API_KEY is set and
                         >1 place selected, else a coordinate-order
                         RELATIONAL_UNVERIFIED fallback. `gatherer` is
                         revalidated against `field` before it can reach ORS
                         or produce a route.
POST /api/synthesize     {run_id, field, gatherer, movement} -> one Workers AI
                         call to the Synthesizer role + the app's binding
                         extension, schema-validated, cross-checked against
                         `gatherer`
```

`field`, `gather`, and `movement` were deliberately kept as three separate
calls (not folded into one "generate" endpoint) so each stage is
independently retryable and a failure at one stage preserves the furthest
validated artifact instead of discarding the whole encounter — see
`NEXT_ROUND_INPUT/authority/10_PRODUCT_AND_INTERACTION.md` §15.

## Why coordinates travel as POST bodies, not query strings

`/api/field` and `/api/movement` take the anchor coordinate in a JSON body.
Earlier revisions of this app put `lat`/`lon` in the GET query string, which
means an exact location would land in browser history, server access logs,
and any `Referer` header sent to a third party. Fixed this release — see
`FINAL_DEFECT_REGISTER.md`.

## Payload boundary (Gatherer / Synthesizer)

The Gatherer never receives fiction-shaped instructions or a prior
paragraph; it returns a bounded, schema-shaped selection (max 5 places, max
3 facts/particulars each). The Synthesizer never receives raw candidate
extracts, rejected candidates, search results, exact device GPS, or route
GeoJSON — only what the Gatherer selected plus the compact movement state.
`packages/nearby-narrative/tests/` and `tests/round2-pipeline.test.mjs`
assert this boundary directly (`synth_payload_boundary`, "Synth input
boundary excludes raw candidates, extracts and route geometry").

Both model responses are schema-validated server-side
(`GATHERER_SCHEMA`/`SYNTHESIS_SCHEMA` in `apps/worker/src/round2.ts`), then
semantically cross-checked against the request that produced them
(`validateGatherer`, `validateSynthesis`) — coordinate/title/URL match,
known candidate IDs, known evidence IDs, binding offsets inside the actual
paragraph, no unexpected top-level keys. A response that fails validation
gets exactly one repair attempt (the validation errors are fed back to the
model) before the call is a hard failure — never silently accepted.

## Movement

`state` is one of `NONE` (one place, no route), `RELATIONAL_UNVERIFIED`
(spatial order only, explicitly not a walking claim), or `VERIFIED` (an
actual ORS Matrix + Directions LineString for the exact selected sequence).
`VERIFIED` is unreachable without both a real Matrix response and a real
Directions response for that exact point set — a partial/matrix-only result
downgrades to `RELATIONAL_UNVERIFIED`, never silently upgrades. Tested in
`tests/round2-pipeline.test.mjs`.

## Security boundary

- CORS is an explicit origin allow-list via `ALLOWED_ORIGINS` (comma-separated
  exact origins). Unset only in local dev, where it reflects any origin —
  documented in `.env.example` as never the deployed default.
- All API responses carry `Cache-Control: no-store`.
- All POST bodies are size-bounded (200 KB) before JSON parsing, rejected
  with 413 otherwise.
- Provider secrets (`MAPTILER_API_KEY`, `ORS_API_KEY`) never reach the
  client — the Worker is the only thing that calls those APIs.
- The client aborts and discards in-flight requests on `restart`/`again`
  (see `runController`/`fieldController` in `apps/web/src/App.tsx`), so a
  stale async response from a superseded run cannot overwrite a newer
  encounter's state.

## Design system

See `DESIGN_SYSTEM.md`.
