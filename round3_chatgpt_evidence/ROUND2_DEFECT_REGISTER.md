# Nearby Field — Round 2 defect register

Candidate: `NF-R2-0.2.0`

| ID | Location/state | Defect / risk | Root cause | Round-2 action | Current disposition |
|---|---|---|---|---|---|
| R2-D01 | legacy `fixtures/harpers-ferry/movement.json` | `VERIFIED` without route-provider geometry/distances | documentary/path plausibility had been conflated with runtime route proof | preserved legacy copy; current fixture rebuilt as `RELATIONAL_UNVERIFIED` | **CLOSED** |
| R2-D02 | Gatherer boundary | schema-shaped JSON could still cite invented candidate IDs | schema cannot establish source identity | post-model exact ID/title/URL/coordinate validation + one retry | **CLOSED** |
| R2-D03 | Synthesizer boundary | valid JSON could contain bad/unknown paragraph bindings | structural schema cannot prove substring/evidence identity | post-model used-place/evidence/offset validation + red test | **CLOSED** |
| R2-D04 | movement/provider failure | route line could visually imply verified walking path | route geometry and relation ordering were not separated strongly enough | solid route only from ORS Directions LineString; otherwise dashed relation / no route | **CLOSED** |
| R2-D05 | first map⇄prose implementation | transient map hover and prose hover could diverge from pinned object | one state variable was doing both ephemeral and persistent work | separate hover place from pinned active place; derive common displayed place | **CLOSED** |
| R2-D06 | embedded canonical Synthesizer role | code-fence formatting around the source-operation transform was omitted in first embedding | template-literal convenience modified canonical static role | escaped backticks; exact prompt-fidelity regression | **CLOSED** |
| R2-D07 | canonical React/MapLibre runtime | exact browser candidate not rendered/exercised here | package installation timed out and system Chromium is not usable in this harness | preserved explicit proof gap; standalone fixture + static/syntax evidence only | **OPEN → Round 3** |
| R2-D08 | live Workers AI | real model outputs/latency/token data not observed | no authorized Cloudflare account/binding in this execution context | adapter + structured validation tested with controlled fake AI | **OPEN → Round 3** |
| R2-D09 | live ORS | exact external pedestrian route not observed | no ORS key supplied | exact Matrix+Directions branch tested with mocked provider responses; no-key fallback executed | **OPEN → Round 3** |
| R2-D10 | final literary/model quality | provisional models are not experimentally selected | Round-3 model tournament intentionally deferred | no final artistic/model claim | **OPEN BY DESIGN → Round 3** |

No open item is converted into a pass by source inspection or simulation.
