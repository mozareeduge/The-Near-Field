# Round 1 second-pass audit

## Pass A attacked

The first coherent build had four material weaknesses:

1. a tempting public-Nominatim fallback would have violated the service's current autocomplete policy;
2. Taft's live coordinate results revealed that geographic page count could be inflated by weak census/administrative stubs;
3. MapLibre candidate-layer event registration was vulnerable to initial style-load timing;
4. the server's UTC date could disagree with the participant's local date.

## Pass B changes

- removed Nominatim from the autocomplete route;
- added a deterministic weak settlement-stub guard without converting enrichment into geography;
- bound custom layer creation/restoration to map/style load lifecycle;
- passed participant-local date into the field contract;
- added exact Worker route tests for search fallback and sparse Taft behavior;
- preserved browser/build verification failures as proof gaps instead of lowering the oracle.

## Stress-case disposition

- dense location: supported by current Harpers Ferry and Berlin GeoSearch evidence;
- sparse location: Taft remains sparse after usefulness filtering;
- no geocoder key: coordinate-Wikipedia search fallback has an exact Worker route test;
- fabricated enrichment point: regression-guarded against;
- 1/3/10 expansion: unit-tested as smallest sufficient radius;
- current React/MapLibre visual runtime: **verification incomplete**, not passed by inspection.

## Round-1 release verdict

**ROUND 1 DELIVERED / VERIFICATION INCOMPLETE FOR CANONICAL BROWSER BUNDLE**

The artifact and exact Round-1 logic exist and can be handed forward. The canonical production-path browser bundle was not truthfully executable in this harness because its dependency/browser runtime could not be established. Round 2 can proceed because the missing proof is isolated and documented; it must not be forgotten or relabeled as success.
