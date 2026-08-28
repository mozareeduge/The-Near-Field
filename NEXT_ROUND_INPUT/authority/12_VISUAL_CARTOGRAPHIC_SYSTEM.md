# Nearby Field — Visual, Cartographic, Typographic, and Motion System v3

## 1. Governing visual premise — LOCKED

The same map changes role over time:

```text
orientation map
→ geographic evidence field
→ selected constellation
→ movement diagram
→ map/prose composite
```

The work should not look like:
- a vendor basemap with custom pins;
- a GIS dashboard;
- a cyber/sci-fi map skin;
- a collection of floating cards.

It should feel like an authored cartographic instrument whose visual hierarchy changes as the system learns enough to make the work.

---

# 2. The two visual regimes

## 2.1 ORIENTATION
Purpose:
help the user find and verify the place quickly.

Keep enough familiar information:
- settlement labels;
- major roads;
- some local roads;
- water;
- broad urban/land distinction;
- restrained POIs when useful.

Controls behave conventionally.

## 2.2 FIELD
Begins only after anchor confirmation.

Reduce:
- ordinary POI hierarchy;
- unnecessary labels;
- generic map chrome;
- minor road dominance.

Raise:
- anchor;
- field radius;
- candidate places;
- selected nodes;
- movement;
- map/prose bindings.

The user should remain geographically oriented.

---

# 3. Prototype palette — CURRENT DEFAULT

```text
deep ground                 #0B0C0C
primary text                #E8E6DF
secondary text              #A3A29C
inactive cartography        #5E605D
deep inactive               #343633
candidate point             #777A75
selected / active signal    #A9C7BE
hairline                    rgba(232,230,223,.24)
verified route              rgba(232,230,223,.78)
unverified relation         rgba(232,230,223,.36)
```

Open:
accent family.

Test current pale-cool accent against one dry warm/mineral alternative.

Rules:
- one signal family;
- no category rainbow;
- no default Google/Mapbox marker colors;
- active state also differs structurally/opacity-wise, not hue alone.

---

# 4. Typography — CURRENT DEFAULT

## Primary family
Recursive Sans & Mono.

Reason:
one open-source variable family can keep prose and system notation related while changing register.

### Literary paragraph

```css
font-family: "Recursive", sans-serif;
font-variation-settings:
  "MONO" 0,
  "CASL" 0.02,
  "CRSV" 0;
font-weight: 400;
```

Desktop starting point:
- 20 px;
- line-height 1.58;
- letter-spacing -0.005em;
- width 42–48rem.

Large desktop:
- 21 px possible >1440 px.

Mobile:
- 18 px;
- line-height 1.58;
- horizontal padding 20–24 px.

Do not animate the final paragraph's axes after reveal.

### Search input
- ≥16 px on mobile;
- ~17 px desktop;
- proportional Sans;
- weight 400–450.

### Result primary
- 15–16 px;
- weight 500.

### Result secondary
- 12–13 px;
- muted.

### Loader / system microtext
Semi-mono/mono:

```css
font-variation-settings:
  "MONO" .8,
  "CASL" 0,
  "CRSV" 0;
```

- 11 px desktop;
- 11–12 px mobile;
- line-height ~1.2;
- letter-spacing ~0.055em;
- lower-case often appropriate.

Examples:
`field / 1 km`
`field sparse`
`3 retained`
`trace / 1.28 km`
`composing`

### Node index
- 10–11 px mono;
- two digits `01`, `02`, …;
- 6–8 px from visual point center.

---

# 5. Spatial rhythm

Base unit:
`4 px`

Major rhythm:
`8 / 12 / 16 / 24 / 32 / 48 / 64 / 96`

### Search surface
Desktop:
- max width ~520 px;
- height 48–52 px;
- 24–40 px from map/viewport edge.

Mobile:
- 16 px side inset;
- 12–16 px safe-area-aware top inset;
- 48–52 px height.

Search may be visually contained, but avoid heavy card shadow.

### Results
- max ~6 visible;
- row min 48 px;
- 8–12 px vertical / 12–16 px horizontal padding.

---

# 6. Cartographic layer grammar

```text
L0  ground / water
L1  reduced road/path network
L2  sparse labels
L3  anchor
L4  active field radius
L5  geographic Wikipedia candidates
L6  selected node/index
L7  provisional / relational order
L8  verified pedestrian route
L9  linked interaction state
L10 optional procedural texture
```

**Enrichment evidence is intentionally absent from this geographic layer stack.**

It has no map coordinate.

---

# 7. Map marks

## Anchor
Registration cross:
- 8–12 px line extent;
- 1 px stroke;
- off-white or signal accent.

## Candidate
- 2–3 px radius;
- hollow or quiet fill;
- no default label.

## Selected
- 4–5 px radius/ring;
- indexed;
- no category icon.

## Interaction hit area
Visual size can stay delicate.

Actual target:
- ≥24 px desktop;
- ≥40 px touch.

---

# 8. Field radius

Real circle centered on anchor.

- ~1 px stroke;
- dashed/sparse;
- 12–24% opacity.

Expansion:
- geographic interpolation;
- ~500–900 ms;
- only when the logical field actually expands.

Copy:
`field / 1 km`
`field widened / 3 km`
`field widened / 10 km`

No radar sweep.

---

# 9. Sparse enrichment visual rule — NEW

When the geographic field stays sparse at 10 km:

1. the existing real candidate points remain where they are;
2. **no enrichment point appears**;
3. the radius does not falsely expand beyond 10 km;
4. processing notation can shift to a non-geographic register.

Recommended sequence:

```text
field / 10 km
1 page
field sparse
reading local traces
2 local references
```

Visual possibility:
a small typographic tick/register near the field label or lower map edge, not a line pointing to a false location.

Enrichment may later appear only in provenance.

This rule protects the map's ontological truth.

---

# 10. Orientation → field transformation

Starting total duration:
~700–1100 ms, overlapping.

Possible sequence:
1. search surface recedes 180–260 ms;
2. generic POI labels fade toward 0–10% over 350–600 ms;
3. minor roads reduce over 400–700 ms;
4. anchor becomes registration `×`;
5. field radius appears.

Easing:
quiet ease-out; no bounce/spring spectacle.

---

# 11. Candidate appearance

Candidate nodes arrive at real coordinates.

If returned as one batch:
- slight 120–320 ms total stagger is enough;
- purpose is legibility, not simulation of “thinking.”

Never animate candidate competition or neural-style evaluation.

---

# 12. Gatherer selection

Before result:
field stays alive but non-committal.

After result:
- selected nodes resolve into indexed rings;
- rejected nodes fade over ~350–650 ms;
- rejected nodes remain faintly present.

Starting final opacity targets:
- ordinary road network 12–26%;
- ordinary labels 8–22%;
- rejected candidates 5–9%;
- selected nodes 80–100%.

---

# 13. Movement graphics

## NONE
One selected point.

No route line.

## RELATIONAL_UNVERIFIED
- straight/minimally curved relation;
- 1 px;
- dashed;
- 20–40% opacity.

This is a relation/order, not a walking claim.

## VERIFIED
Actual routing GeoJSON:
- 1–1.5 px desktop;
- 1.5–2 px mobile;
- 70–90% opacity;
- solid continuous geometry.

### Resolution animation
While route is pending:
provisional relation may appear.

When verified geometry arrives:
- keep provisional briefly;
- draw/morph actual route into place;
- fade provisional.

Message:
`relation became verified geographic movement`

### Reveal duration
~900–2200 ms depending visual length.

Do not delay a completed result merely to finish animation.

Reduced-motion:
opacity replacement.

---

# 14. Synthesis loader: cartography → typographic measure

Once movement is stable, spatial registration can extend toward the prose zone:

```text
01        02        03
│         │         │
└─────────┴─────────┘

──────────────────
──────────────
────────────────────
───────────────
```

These lines are **not tokens** and do not represent hidden reasoning.

Starting parameters:
- 4–6 lines;
- 0.5–1 px stroke;
- 10–22% opacity;
- approximate relation to eventual text column.

While Synthesizer runs:
- very slow shortening/re-spacing;
- one line may disappear;
- mutation every ~700–1600 ms;
- no twitching.

After ~800 ms:
`composing`

If prolonged >4 s:
`settling`

On validated result:
- measure field fades 250–450 ms;
- paragraph fades 300–500 ms.

No token streaming.

---

# 15. Map ⇄ prose binding states

## Text
No blue hyperlink.

Hover/focus:
- quiet underline 35–55% or subtle weight change;
- no reflow.

## Map node
- luminance/opacity rises;
- related route segment may rise 10–20%.

Transition:
100–180 ms.

## Mobile
tap toggles state.

## Structural binding
No invented text span.
The node remains spatially meaningful without forced prose mention.

---

# 16. Final composition

## Desktop ≥1024 px
Starting point:
- outer horizontal margin `clamp(24px, 4vw, 64px)`;
- map full available width;
- map height `min(68vh, 720px)`, min ~520 px;
- place/date microtext inside lower map edge or immediately below;
- paragraph begins 64–88 px below map;
- paragraph width ~680–760 px / ≤48rem;
- bottom whitespace ≥120 px.

Open:
paragraph centered vs aligned to cartographic grid.

## Mobile <768 px
- map ~58–64svh;
- edge-to-edge or 8–12 px inset;
- paragraph 20–24 px side padding;
- 40–56 px gap after map;
- `again` after paragraph with generous air.

No persistent sidebar/bottom sheet unless provenance/selected-node action explicitly needs it.

---

# 17. Copy system

### Search/control
- `Search a place…`
- `Use my location`
- `Use this place`
- `Use this point`
- `again`
- `new place`

### Processing
- `field / 1 km`
- `8 pages`
- `field widened / 3 km`
- `field widened / 10 km`
- `field sparse`
- `reading local traces`
- `2 local references`
- `reading field`
- `4 retained`
- `ordering`
- `trace / 1.28 km`
- `composing`
- `settling`

### Failure
- `Nothing surfaced here`
- `Choose another point`
- `Route unresolved`
- `Paragraph interrupted`
- `Try again`

Avoid:
- `AI is thinking`
- percentage progress;
- “generating magic”;
- hidden-reasoning theatre.

---

# 18. Procedural texture — OPEN

The first prototype should be visually complete without it.

If added:
- map-attached or controlled rendering;
- extremely low opacity;
- sparse dither/hatching;
- scale/state-aware if possible;
- not stock film grain;
- not distressed paper.

Tangram/TRON is a mechanism benchmark, not a skin.

---

# 19. Reduced motion

For `prefers-reduced-motion`:
- no camera glide;
- no route travel draw;
- no animated radius growth;
- no continuous typographic mutation.

Use:
- immediate camera/state updates;
- 100–180 ms fades where safe.

All semantic sequencing survives.
