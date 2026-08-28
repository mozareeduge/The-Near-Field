# Round 1 defect register

| ID | Location/state | Observed gap | Consequence | Correction / status |
|---|---|---|---|---|
| R1-D01 | search provider | Public Nominatim looked like an easy keyless autocomplete fallback, but current policy forbids client-side autocomplete | policy violation / brittle public dependency | **FIXED:** MapTiler remains production default; keyless fallback uses coordinate-bearing Wikipedia search |
| R1-D02 | Taft field | coordinate-bearing nearby settlement stubs can numerically satisfy density while carrying almost no discriminating material | false abundance; sparse geography gets laundered into a rich field | **FIXED:** deterministic short census/admin stub filter before threshold counting |
| R1-D03 | MapLibre cold load | layer-delegated handlers could be attached before candidate layer existed | possible cold-load event failure | **FIXED:** candidate layer handlers are registered after initial map `load`; custom data is restored on `style.load` |
| R1-D04 | local midnight | Worker UTC date could differ from participant's local calendar date | wrong temporal context passed to later skill stages | **FIXED:** client supplies `YYYY-MM-DD`; Worker validates and preserves it |
| R1-D05 | sparse enrichment | broad text results can tempt the renderer to place evidence on the map | fabricated geography | **FIXED:** enrichment type contains no lat/lon; UI labels it off-map/non-route evidence; regression test asserts absence |
| R1-D06 | build verification | npm dependency retrieval unavailable in current harness | canonical React/Vite bundle not compiled/exercised here | **OPEN PROOF GAP:** source and Worker logic delivered; dependency-free candidate included; carry exact proof gap into Round 2 |
| R1-D07 | browser visual QA | system Chromium headless did not terminate; Playwright installation had no downloaded browser | no trustworthy screenshot/runtime interaction evidence from this harness | **OPEN PROOF GAP:** do not claim visual pass; close when a capable browser runtime is available |

No unresolved defect changes the Round-1 product contract. D06/D07 limit proof strength and remain mandatory regression items.
