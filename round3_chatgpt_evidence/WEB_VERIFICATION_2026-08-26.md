# Web verification relevant to Round 2

Checked: 2026-08-26. These are current external capability checks, not execution evidence for `NF-R2-0.2.0`.

## Cloudflare Workers AI

- JSON Mode / structured outputs: https://developers.cloudflare.com/workers-ai/features/json-mode/
- GLM-4.7-Flash: https://developers.cloudflare.com/workers-ai/models/glm-4.7-flash/
- Llama 4 Scout: https://developers.cloudflare.com/workers-ai/models/llama-4-scout-17b-16e-instruct/
- Pricing: https://developers.cloudflare.com/workers-ai/platform/pricing/

Current significance: Workers AI supports `response_format`/schema-shaped outputs, while its docs explicitly warn that a model may still fail to satisfy a schema. This justifies the Round-2 post-model validator and bounded repair rather than trusting provider formatting alone.

The provisional models are current hosted options. They are implementation defaults only; Round 3 must compare literary/epistemic/runtime performance before final selection.

## openrouteservice

- Matrix: https://giscience.github.io/openrouteservice/api-reference/endpoints/matrix/
- Directions request/GeoJSON return: https://giscience.github.io/openrouteservice/api-reference/endpoints/directions/requests-and-return-types
- current API playground: https://openrouteservice.org/dev/

Current significance: Matrix provides time/distance between points; detailed route geometry belongs to Directions. Round 2 therefore does not equate matrix success with a verified map line.

## MapLibre GL JS

- GeoJSONSource: https://maplibre.org/maplibre-gl-js/docs/API/classes/GeoJSONSource/

Current significance: mutable GeoJSON source data supports changing selected/route relation states without replacing the entire map apparatus.
