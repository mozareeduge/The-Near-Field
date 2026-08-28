# Nearby Field — Product and Interaction Specification v3

## Status

This document supersedes the app handoff v2 where it conflicts with the current v7 skill.

UI/visual craft is specified separately. This file defines product behavior and user-visible interaction consequences.

---

# 1. Product definition

Nearby Field is a locative literary web artwork.

The user does not compose prompts or choose a literary style. The interaction is:

```text
find somewhere
→ confirm it
→ watch a local evidence field constitute itself
→ encounter one map/prose work
→ optionally generate again from the same place
```

The system turns a location into:
- a bounded nearby Wikipedia field;
- a selected constellation of 1–5 geographic places;
- an optional verified movement trace;
- one English fictional paragraph materially dependent on the local field.

The experience should feel like an artistic instrument, not:
- AI chat;
- trip planner;
- route-navigation product;
- GIS editor;
- Wikipedia browser;
- story-parameter form;
- dashboard.

---

# 2. Entry

## 2.1 Entry methods — LOCKED

The user can:

1. **Use my location**
2. **Search**
3. **Choose a point on the map**

All resolve to:

```ts
Anchor {
  coordinate
  humanLabel?
  granularity
  regionalContext?
  source
}
```

---

# 3. Search quality — LOCKED

The search experience should be as easy as finding a place in a strong mainstream map.

Required qualities:
- autocomplete/type-ahead;
- fuzzy/typo tolerance;
- city/town/village/locality;
- neighbourhood/district;
- landmark/POI;
- street/address where provider supports it;
- local script + English where available;
- geographic disambiguation;
- keyboard operation;
- touch-friendly results;
- map preview/focus;
- proximity bias when appropriate;
- viewport bias after deliberate map movement.

Do not turn search into experimental typography or hidden controls.

The user should never pay an aesthetic tax to establish geography.

### Current search default
MapTiler Geocoding behind an adapter.

### Request behavior starting point
- debounce ~160 ms;
- cancel stale in-flight requests;
- no request for empty query;
- up to six visible result rows;
- cache identical query/context briefly where provider terms permit.

---

# 4. Geographic granularity

A universal administrative hierarchy is not assumed.

| Result type | Product behavior |
|---|---|
| continent | orientation only |
| country | orientation only |
| province/state/large region | orientation; refinement expected |
| city/town/village/locality | valid anchor |
| neighbourhood/district | valid anchor |
| street/address | valid anchor |
| landmark/POI | valid anchor |
| direct map point | valid anchor |
| device location | valid anchor |

If a broad result is selected, the map should move there but generation should not silently choose a central point.

---

# 5. Device location

Request permission only after explicit user action.

### Success
- focus/preview position;
- accuracy halo only when useful;
- allow confirmation/refinement.

### Low accuracy
Current heuristic:
if reported accuracy > ~1000 m, show broad uncertainty and encourage map refinement.

### Denied/unavailable
No blocking error.

Offer/leave:
`Search instead`

Raw exact device position is not sent to either LLM.

---

# 6. Map-point selection

Desktop:
- click;
- temporary registration mark;
- `Use this point`.

Mobile:
- long press or stable center-crosshair interaction;
- `Use this point`.

Reverse geocoding improves the label but is not required for the coordinate itself to be valid.

---

# 7. Anchor confirmation

Selecting a search result may preview before generation.

Example:

```text
Taft
Yazd Province · Iran

Use this place
```

After confirmation:
- anchor becomes a stable registration mark;
- search interface contracts/recedes;
- map begins orientation→field transformation;
- discovery starts.

Do not ask the user for:
- mood;
- genre;
- narrator;
- number of places;
- style;
- “creativity” level.

Those would convert the work into a generic generative-content form.

---

# 8. Geographic field

## 8.1 Candidate retrieval

Core corpus:
English Wikipedia coordinate-bearing pages.

Logical search:

```text
1 km
→ if fewer than 3 useful candidates: 3 km
→ if fewer than 3: 10 km
```

Use the smallest radius that contains at least 3 useful normalized candidates.

If 10 km still contains only 1–2:
- keep those honest candidates;
- mark field sparse;
- invoke enrichment.

Candidate runtime cap:
`16`

Candidate extract cap:
`110 words`.

## 8.2 Useful candidate

Deterministic pre-Gatherer normalization should reject:
- disambiguation;
- empty/very weak extracts;
- obvious duplicates;
- coordinate-bearing pages that clearly are not usable physical/geographic places for this task.

Preserve:
- real page ID;
- title;
- canonical URL;
- coordinate;
- anchor distance;
- bounded extract.

## 8.3 Sparse enrichment

Trigger:
`<3 useful geographic candidates within 10 km`.

Retrieve at most four bounded English-Wikipedia passages explicitly mentioning:
- the anchor;
- an already selected/local place;
- regionally consistent names.

Prefer:
- infrastructure;
- material systems;
- work;
- ordinary practices;
- physical organization;
- other local concrete conditions.

Enrichment does **not**:
- receive a fake coordinate;
- appear as a candidate map point;
- participate in routing.

Its purpose is to give a sparse place enough local material without fabricating geography.

---

# 9. Gatherer selection

Gatherer chooses 1–5 geographic places.

Density target remains:

| useful geographic candidates in final field | target selected |
|---:|---:|
| 1 | 1 |
| 2 | 2 |
| 3–5 | 3 |
| 6–12 | 4 |
| 13–16 | 5 |

It may choose fewer only when the apparent diversity is false/duplicative.

Selection pressure:
- real relation;
- concrete particularity;
- material/functional difference;
- ordinary human affordance;
- resistance to symbolic monoculture.

It should not simply choose the nearest or most famous pages.

Enrichment material can be selected into `local_material`, but remains non-geographic.

---

# 10. Movement

## 10.1 One selected place
State:
`NONE`

No route line.

The single node can still support the work.

## 10.2 Two to five places
App:
1. obtain pedestrian cost matrix;
2. start from selected place nearest anchor;
3. enumerate feasible open sequences;
4. choose best route by current route-cost policy;
5. request final geometry.

At five points there are at most 120 permutations before fixing/optimizing start; exhaustive comparison is trivial.

## 10.3 Verified
For the web app, a solid verified trace means the routing provider successfully returned route evidence for the exact sequence.

## 10.4 Route unavailable
State:
`RELATIONAL_UNVERIFIED`

Keep:
- point order/coordinate relation;
- dashed/faint relation trace.

Synthesizer is told route is unverified and must not claim pedestrian accessibility.

---

# 11. Synthesis

A fresh Synthesizer model call receives:
- date/regional context;
- selected place evidence;
- selected enrichment material;
- relations;
- explicit unknown-current-condition list;
- compact movement.

It does not receive:
- raw page extracts;
- rejected candidates;
- search results;
- exact device GPS;
- route GeoJSON;
- Gatherer prompt/reasoning;
- prior generated paragraph.

The Synthesizer internally:
- considers multiple human situations;
- rejects easy symbolic/touristic/task-machine choices;
- composes;
- rereads;
- repairs or rebuilds;
- finalizes.

Only the final structured object leaves the call.

---

# 12. Final work

The final state contains:

### Primary artwork
- geographic field/map;
- selected nodes;
- verified/unverified movement if applicable;
- one English paragraph.

### Interaction metadata
- map/prose bindings;
- selected place IDs;
- source/evidence IDs.

### Quiet controls
- `again`
- `new place`
- provenance/info

No:
- rating;
- likes;
- share feed;
- chat box;
- prompt editor;
- visible model settings.

---

# 13. Map ⇄ prose

This is LOCKED.

Binding classes:
- `mention`
- `reference`
- `structural`

A place may have multiple bindings.

### Desktop
Phrase hover/focus:
- corresponding node gains contrast;
- related route segment may subtly emphasize.

Node hover/focus:
- related prose span(s) quietly emphasize.

### Mobile
Tap toggles linked state.

### Structural
No fake phrase is introduced merely to connect a map node.

### Provenance
No automatic Wikipedia popup.

Sources are a separate deliberate action/layer.

---

# 14. Again

`again` preserves:
- anchor;
- regional context;
- base geographic field where cache remains valid.

It reruns:
- selection (and enrichment selection where applicable);
- movement if selected set/order changes;
- synthesis.

It may lightly discourage the immediately previous selected set when alternatives exist, but that behavior remains open to evaluation.

If the field has only one viable configuration, repetition is allowed.

---

# 15. Error/recovery philosophy

Every failure preserves the furthest validated artifact.

| failure | preserve |
|---|---|
| search | current map/query |
| location | map/search |
| source retrieval | anchor |
| Gatherer | candidate/enrichment field |
| routing | selected constellation |
| Synthesizer | selected constellation + movement |
| binding validation | paragraph can be held until corrected; do not reveal invalid linkage |

Never restart the whole experience unless anchor changes or the source field is invalidated.

---

# 16. Non-functional product qualities

## Immediacy
Search/pan/zoom/selection should feel direct.

## Geographic legibility
The field can become highly reduced without losing basic orientation.

## Specificity
The paragraph materially depends on its local evidence.

## Restraint
The product reveals process without turning it into explanatory spectacle.

## Truthfulness
Visual and textual claims correspond to actually completed stages.

## Reversibility
Failures do not destroy earlier valid work.

## Privacy
Location is ephemeral/minimal and absent from literary prompt history.

## Portability
Map, search, route, and LLM providers stay behind interfaces.

## Cost boundedness
Normal generation is two model calls with bounded inputs.

## Accessibility
Keyboard, screen reader, reduced motion, non-color-only states and touch targets are design requirements, not post-launch add-ons.
