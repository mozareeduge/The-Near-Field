# StyleSeed — Design Lock

<!-- This project does not use a StyleSeed brand recipe / skin / Tailwind
     scaffold. The real design lock is the frozen authority documentation.
     This file exists so StyleSeed skills (ss-score, ss-review, ss-lint,
     ss-a11y, ss-verify) don't assume an unlocked default and don't try to
     apply a brand-recipe/skin that doesn't fit a bespoke, non-Tailwind app. -->

- App domain: locative literary artwork (not fintech/SaaS/e-commerce)
- Surface: desktop-web + mobile-web, single responsive React app
- Output grammar: none of the built-in grammars fit; this is a one-off
  authored cartographic instrument — see
  `NEXT_ROUND_INPUT/authority/10_PRODUCT_AND_INTERACTION.md` §1
- Brand recipe: custom (not one of the 9 maintained recipes) — see
  `NEXT_ROUND_INPUT/authority/12_VISUAL_CARTOGRAPHIC_SYSTEM.md`
- Palette recipe: custom, LOCKED — ground `#0B0C0C`, primary text `#E8E6DF`,
  secondary text `#A3A29C`, signal/accent `#A9C7BE` (one signal family, no
  category rainbow; accent family itself is still open per §3)
- Skin: none of Toss/Stripe/Linear/Notion/Raycast/Arc/Vercel — custom
- Primary action: signal `#A9C7BE` on dark ground; explicitly NOT the
  StyleSeed-forbidden default indigo (`#5E6AD2`/`#4F46E5`)
- Font: Recursive (variable, self-hosted) — literary paragraph uses the
  CASL axis, UI text uses the base axis, microtext uses the MONO axis; see
  §4 of the visual system doc. Not Inter/Pretendard/Geist.
- Radius personality: sharp/minimal (~2px controls) — technical, restrained,
  matches an "authored instrument" not a consumer app
- Elevation: dark tonal layering + hairlines, no drop shadows on the map
- Type scale: desktop-larger (body text starts at 18–21px for the literary
  paragraph; microtext/system notation is intentionally much smaller, 9–11px
  — this is a deliberate two-register system, not an accident)
- Density: sparse/quiet — restraint is a named product quality, not a
  StyleSeed density dial
- Motion: quiet ease-out, no bounce/spring spectacle, calm everywhere (this
  product has no "cinematic tier" marketing surface)
- Locked: 2026-08-28 (import + design pass, see PR #1)

If a future task genuinely needs a new visual surface that fits a StyleSeed
brand recipe (e.g. a marketing/about page that is NOT the cartographic
instrument itself), that surface may get its own StyleSeed setup — do not
retrofit the core app into a recipe it was never designed against.
