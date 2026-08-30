# Nearby Field

Nearby Field is a locative literary web artwork: a location becomes a bounded
Wikipedia evidence field, a selected constellation of 1–5 places, an optional
verified walking route, and one English paragraph materially dependent on
that local field. It must not read as AI chat, a trip planner, a GIS
dashboard, or a SaaS product.

## Design authority — read this before touching UI

This project's visual/product design is **already locked**, not a blank
StyleSeed setup. Authority order, highest first:

1. `NEXT_ROUND_INPUT/authority/10_PRODUCT_AND_INTERACTION.md` — product
   behavior and interaction contract.
2. `NEXT_ROUND_INPUT/authority/12_VISUAL_CARTOGRAPHIC_SYSTEM.md` — palette,
   typography, spatial rhythm, map layer grammar, motion timing. Sections
   marked LOCKED are not open to reinterpretation; sections marked OPEN can
   be explored.
3. `NEXT_ROUND_INPUT/authority/13_PROCESSING_AND_LOADER.md`,
   `14_TECHNICAL_ARCHITECTURE.md`, `15_SKILL_INTEGRATION_RUNTIME.md`,
   `16_DATA_CONTRACTS.md`, `17_QA_TEST_MATRIX.md` for their respective areas.

Do not run StyleSeed's Quick Setup wizard against this app, and do not adopt
its Tailwind/shadcn scaffold or component library (`components/ui`,
`components/patterns`) — this app is a hand-authored React + MapLibre
surface with its own CSS, its own type scale (Recursive variable font, not
Inter/Pretendard), and its own spatial system (base 4px, not Tailwind's
8px-utility grid). `STYLESEED.md` in this repo records that explicitly
instead of a brand-recipe/skin selection.

## StyleSeed as a secondary craft gate, not a replacement design system

StyleSeed (`.claude/DESIGN-LANGUAGE.md`, `.claude/VISUAL-CRAFT.md`,
`.claude/BRAND-RECIPES.md`, `.claude/PALETTE-RECIPES.md`, installed skills
under `.claude/skills/ss-*`) is vendored for its **craft judgment**, which is
largely compatible with and useful *on top of* the locked authority above:

- one accent / one signal family, no category rainbow (already the project's
  own rule — see §3 of the visual system doc);
- no default AI-generated tells: no default indigo, no icon-in-a-chip, no
  all-even grid with no focal point, no pure `#000`;
- nested-radius law, layered low-opacity shadows, tabular numbers for values
  that change, real loading/empty/error states, visible focus rings, motion
  scoped by surface (calm for the app itself), `prefers-reduced-motion`
  honored;
- restraint: reveal process without turning it into explanatory spectacle.

Useful for auditing this app: `/ss-score`, `/ss-review`, `/ss-lint`,
`/ss-a11y`, `/ss-verify` (the visual/pixel gate — actually render and
screenshot before claiming a visual pass). Not applicable here: `/ss-setup`,
`/ss-build`, `/ss-restyle`, `/ss-component`/`/ss-page`/`/ss-pattern` (they
assume the Tailwind/shadcn scaffold this app does not use) — read
DESIGN-LANGUAGE.md/VISUAL-CRAFT.md rules and apply them by hand against the
existing CSS/JSX instead.

When StyleSeed's generic rule and this project's locked authority conflict
(for example: authority's map/prose "composite" regime vs. StyleSeed's
default card-grid layout intuitions), **the authority docs win.** Flag the
conflict rather than silently picking one.

## Repo layout

- `apps/web` — the canonical React + TypeScript + MapLibre application.
- `apps/worker` — the Cloudflare Worker backend (search/field/gather/movement/synthesize).
- `packages/nearby-narrative` — the canonical Gatherer/Synthesizer skill
  (role texts, schemas, scripts, deterministic test suite).
- `NEXT_ROUND_INPUT/` — frozen authority and evidence carried into this round.
- `tests/`, `packages/nearby-narrative/tests/` — deterministic/static suites;
  keep these green (18/18 app+worker, 14/14 canonical skill tests) unless a
  change deliberately and correctly moves the oracle.
