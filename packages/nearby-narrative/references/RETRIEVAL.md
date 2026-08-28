# Retrieval

Retrieval is deterministic host/script work.

## Anchor

Accept:
- specific place name;
- coordinates;
- valid prepared field.

If a named place is materially ambiguous, disambiguate.
If it is only a country/very broad region, request a finer anchor.

## Geographic field

Core corpus: English Wikipedia.

Retrieve coordinate-bearing pages within 10 km, keep distance, and partition logically:

```text
0–1 km
1–3 km
3–10 km
```

The smallest partition containing at least 3 useful candidates is the preferred field. If fewer than 3 exist in 10 km, the field is sparse.

Before Gatherer:
- max 16 candidates;
- max 110 words of normalized plaintext per candidate;
- preserve ID/title/URL/coordinates/distance;
- discard disambiguation, empty/very weak extracts, obvious duplicates.

## Sparse enrichment

Only for a sparse field.

Search English Wikipedia with the exact anchor/place reference and regional disambiguation when available.

Keep at most 4 short snippets:
- explicit local mention required;
- max 80 words each;
- prefer infrastructure, material systems, work, ordinary practice, or physical organization.

Keep enrichment separately typed. It is not a route point.

## Movement

Use pedestrian routing if available.

Otherwise compute deterministic coordinate relation/order and mark `route_verified=false`.

Never turn an unverified relation into a walking claim.
