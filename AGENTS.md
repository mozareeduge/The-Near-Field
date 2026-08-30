# Nearby Field — agent entry point (Codex / Amp / Gemini CLI / other AGENTS.md tools)

Claude Code reads `CLAUDE.md` at the repo root; that file is authoritative
for this project and this file mirrors it. Read `CLAUDE.md` first.

Short version: this app's product and visual design are already locked in
`NEXT_ROUND_INPUT/authority/10_PRODUCT_AND_INTERACTION.md` and
`12_VISUAL_CARTOGRAPHIC_SYSTEM.md` — read those before changing UI. StyleSeed
(vendored under `.claude/` and `.agents/skills/ss-*`) is available as a
craft/coherence quality gate (`$ss-score`, `$ss-review`, `$ss-lint`,
`$ss-a11y`, `$ss-verify`), not as a replacement design system: this app does
not use StyleSeed's Tailwind/shadcn scaffold, so `$ss-setup`/`$ss-build`/
`$ss-restyle`/component-generation skills do not apply here. `STYLESEED.md`
records that explicitly. Where StyleSeed's generic rules and the project's
own locked authority conflict, the authority docs win.
