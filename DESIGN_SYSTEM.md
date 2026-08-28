# Design system

This is a summary of what's actually implemented in `apps/web/src/styles.css`
and how it maps to the locked authority in
`NEXT_ROUND_INPUT/authority/12_VISUAL_CARTOGRAPHIC_SYSTEM.md`. That document
is the source of truth; this file exists so a reader doesn't have to diff
CSS against it by hand.

## Governing premise

One map, three regimes, implemented as CSS state rather than three
components:

```text
orientation (light basemap, conventional legibility)
  → field (dark ground, reduced chrome, evidence raised)
    → composite (map settles to a bounded hero; a real reading section
      begins below it — never a floating panel over the map)
```

`.map-stage` is full-viewport during discovery/selection/movement;
`.map-stage.composite` shrinks it to `min(68vh, 720px)` once synthesis
completes, and `.reading-field` — a normal document-flow section, not an
overlay — appears below it. This was the one defect this project's own QA
evidence had already flagged and left unrepaired (the paragraph was a
`backdrop-filter` panel floating on top of the still-fullscreen map,
directly against the locked §16 contract); fixing it was the first thing
done in this release pass.

## Palette

```text
deep ground              #0B0C0C
primary text              #E8E6DF
secondary text             #A3A29C
signal / accent (one)       #A9C7BE
hairline               rgba(232,230,223,.24)
```

One signal family, no category rainbow, no default-indigo/generic-AI accent.
Two elevation registers, each internally consistent (not a coherence
violation — they sit over different map regimes):

- **Light** (orientation/preview overlays — search input, results, anchor
  preview): opaque panel, border + soft shadow.
- **Dark** (field-mode overlays — candidate ledger, inspector, enrichment,
  error surface): tonal surface + hairline border, no shadow, no blur.

## Typography

Self-hosted Recursive variable font (`@fontsource-variable/recursive`), used
across three registers via its own variation axes rather than three
different font families:

| Register | Axes | Size |
|---|---|---|
| Literary paragraph | `CASL .02` | 20px desktop (21px >1440px), 18px mobile, line-height 1.58 |
| UI text (search, results, buttons) | `CASL .15` | 17px desktop / 16px mobile search, 15px result title |
| System microtext (ledger, labels) | `MONO .8` | 9–11px, lowercase, wide tracking |

## Spatial rhythm

Base unit 4px; major rhythm 8/12/16/24/32/48/64/96. Every spacing value in
`styles.css` was audited and snapped onto this grid this release (the
implementation had drifted to odd hand-tuned values — 9, 13, 14, 17, 18,
22px etc. — across several panels; see `FINAL_DEFECT_REGISTER.md`).
Radius is a single value everywhere (`2px`, the "sharp/technical" register
appropriate to an authored instrument, not a consumer app) — no mixed
radius personalities.

## Motion

Quiet ease-out, no bounce/spring. `prefers-reduced-motion` disables all
transitions/animations while preserving semantic state (nothing depends on
an animation completing to be legible). No token-streaming illusion, no
percentage progress, no "AI is thinking" copy — the copy system in §17 of
the authority doc is implemented verbatim in `App.tsx`'s ledger messages.

## StyleSeed as an audit layer

StyleSeed (vendored, see `CLAUDE.md`) was run as a craft-quality gate
against this implementation, not as a replacement design system — this app
predates and doesn't use StyleSeed's Tailwind/shadcn scaffold. `/ss-score`
scored the implementation **86/100** on first pass; both findings it raised
(spacing-grid drift, mixed elevation language) were fixed this release, not
left as noted debt.

## Verification performed

Visual/interaction verification in this environment was done with a
self-hosted Chromium via Playwright, driving the real component tree
through mocked API responses built from this project's own Harpers Ferry
fixtures (`fixtures/harpers-ferry/`), at desktop (1440×1000), mobile
(390×844), narrow (320×568), and `prefers-reduced-motion`. Map tiles
(OpenFreeMap) did not render in any of these checks — this sandbox's
network egress proxy returns 403 on `tiles.openfreemap.org` (confirmed via
direct `curl`, not inferred) — so layout, typography, spacing, and
interaction were verified independent of tile rendering, but the
cartographic layer's actual pixel appearance (§6–§13 of the authority
document: candidate marks, field radius, route rendering) is unverified
here. See `KNOWN_LIMITS.md`.
