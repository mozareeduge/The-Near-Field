# Nearby Field — Processing State Machine and Loader Choreography v3

## 1. Product state machine

```text
idle
searching
locating
anchor_preview
anchored
discovering
enriching?          # sparse only
gathering
routing
synthesizing
complete
error.*
```

---

## 2. State transitions

```text
idle
 ├─ type → searching
 ├─ use-location → locating
 └─ map-point → anchor_preview

searching
 ├─ result-preview → anchor_preview
 └─ cancel/clear → idle

locating
 ├─ success → anchor_preview
 └─ denied/error → idle/search-capable

anchor_preview
 ├─ confirm → anchored
 └─ edit → searching / map

anchored
 └─ start-run → discovering

discovering
 ├─ >=3 useful at 1 km → gathering
 ├─ <3 → 3 km
 ├─ <3 → 10 km
 ├─ <3 at 10 km → enriching
 ├─ no usable material → error.field_empty
 └─ source failure → error.source

enriching
 ├─ usable enrichment or usable 1–2 geo pages → gathering
 ├─ no useful field → error.field_empty
 └─ source failure with usable geo pages → gathering with no enrichment

gathering
 ├─ valid → routing
 ├─ invalid once → retry gathering
 └─ invalid twice → error.gatherer

routing
 ├─ one node → synthesizing (NONE)
 ├─ verified route → synthesizing (VERIFIED)
 ├─ unavailable/no path → synthesizing (RELATIONAL_UNVERIFIED)
 └─ fatal malformed movement → error.route

synthesizing
 ├─ valid paragraph+app metadata → complete
 ├─ invalid once → retry synthesizing
 └─ invalid twice → error.synthesizer

complete
 ├─ again → discovering
 └─ new-place → searching
```

---

## 3. Event stream

Recommended typed event names:

```text
run.started
anchor.confirmed

field.search.started
field.candidates.updated
field.radius.resolved
field.radius.expanded
field.sparse

enrichment.started
enrichment.completed

gatherer.started
gatherer.completed
gatherer.retry

route.started
route.relational
route.verified
route.unavailable

synthesizer.started
synthesizer.retry
synthesizer.completed

run.completed
run.failed
```

The stream communicates state/results, never hidden model reasoning.

Use SSE or streamed fetch from Worker.

---

## 4. Real state → visible behavior

| Runtime event/state | Visual behavior | Microcopy |
|---|---|---|
| anchor confirmed | map settles; registration cross | anchor label |
| search starts | radius appears | `field / 1 km` |
| candidates | real points appear | `8 pages` |
| radius 3 km | circle grows | `field widened / 3 km` |
| radius 10 km | circle grows | `field widened / 10 km` |
| sparse | geography holds | `field sparse` |
| enrichment starts | non-geographic register/quiet measure | `reading local traces` |
| enrichment complete | no extra map points | `2 local references` if useful |
| Gatherer starts | field stays quiet | `reading field` |
| Gatherer complete | chosen indexes resolve; others fade | `4 retained` |
| route starts | provisional relation | `ordering` |
| route verified | real geometry appears | `trace / 1.28 km` |
| route unavailable | dashed relation remains | `route unresolved` only if worth surfacing |
| Synth starts | typographic measure field | `composing` |
| Synth prolonged | low-energy settling | `settling` |
| complete | measure fades; prose enters | none |

---

## 5. Visibility thresholds

Starting rules:
- <250 ms: avoid flashing a text label;
- 250–800 ms: visual state only where possible;
- >800 ms: microcopy may appear;
- >4 s synthesis: `settling` may replace `composing`.

Never artificially hold a completed stage to show its loader.

---

## 6. Candidate arrival

If the API response arrives as a batch:
- place all at correct coordinates;
- slight visual stagger only;
- 120–320 ms total is enough.

Do not animate fake sequential “discovery” if no such streaming occurred.

---

## 7. Enrichment loading — new semantic requirement

Enrichment exists because the **textual local corpus** is sparse, not because the map grew.

Therefore:
- do not move/expand radius past 10 km;
- do not add nodes;
- do not draw source-to-anchor lines suggesting location;
- do not animate article titles like cards.

A restrained textual register/count is enough.

If enrichment finishes very quickly, it can be invisible as a separate label.

---

## 8. Gatherer wait

The Gatherer is one bounded model call.

Before output:
do not visually mark candidates as “currently considered.”

Keep field stable.

After output:
animate only the selection that actually returned.

---

## 9. Route wait

A provisional order/relation is allowed because the software already knows selected coordinates/order candidates.

If route API resolves:
provisional → verified geometry.

If not:
remain relational/unverified.

---

## 10. Synthesis wait

The Synthesizer performs internal event search/revision, but UI does not claim access to those hidden steps.

The typographic-measure field is an **abstract processing register**, not a representation of tokens or thoughts.

No token streaming.

---

## 11. Error states

### `error.field_empty`
Keep anchor/map.

Visible:
`Nothing surfaced here`
`Choose another point`

### `error.source`
Keep anchor.

Offer retry or new point.

### `error.gatherer`
Keep candidate/enrichment field.

`Try again`

### route unavailable
Normally nonfatal:
keep selected nodes and relational trace; continue.

### `error.synthesizer`
Keep field + movement.

`Paragraph interrupted`
`Try again`

### invalid app bindings
Do not expose a broken map/prose interaction.
Retry/correct the Synthesizer metadata stage before revealing complete state.

---

## 12. Accessibility narration

Examples:

Visible:
`4 retained`

ARIA:
`Four nearby Wikipedia places were selected.`

Visible:
`field sparse`

ARIA:
`Fewer than three usable nearby Wikipedia places were found within ten kilometres. The system is checking additional Wikipedia passages explicitly connected to this place.`

Visible:
`trace / 1.28 km`

ARIA:
`A pedestrian route connecting the selected places was verified. Total distance: 1.28 kilometres.`

If unverified:
`The selected places are ordered spatially, but a pedestrian route was not verified.`

The map requires a non-canvas accessible summary of:
- anchor;
- selected place names;
- movement state/order;
- paragraph;
- provenance action.
