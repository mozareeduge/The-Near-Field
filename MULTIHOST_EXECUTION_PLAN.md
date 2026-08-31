# Multihost Execution Plan — Nearby Field R3

Status: **PLANNED — verified against repository state, handoff package, and skill master package on 2026-08-31.**
Execution environment: **Hermes (GLM 5.3 flash, high effort), this machine.** Claude Code, ChatGPT,
Claude, Codex, and Hermes are treated strictly as *distribution hosts / QA targets* — never as the
place where this work is performed.

Authority precedence (inherited from the multihost handoff, `12_DELIVERY_CONTRACT.md` and
`00_START_HERE.md`):

1. Current explicit owner goal (this plan's §"Owner model").
2. The repository's locked product/design authority under `NEXT_ROUND_INPUT/authority/` and root `CLAUDE.md`.
3. The current repository implementation at the verified base commit, as evidence of what exists.
4. The multihost handoff's target-state decisions and acceptance criteria.
5. The prior ChatGPT MCP prototype (`reference/` in the handoff) as implementation evidence only.
6. Current official platform documentation.
7. History and other proposals.

Conflicts are flagged to the owner, never silently resolved.

---

## 1. Verified ground state (all facts checked on this machine, 2026-08-31)

### 1.1 Repository

- Local `main` at `3fe3d7c` ("Fix Wikipedia 403: use the real User-Agent header"), clean tree,
  synced with `origin/main` (`github.com/mozareeduge/The-Near-Field`).
- GitHub Actions green on the latest push: CI, Deploy worker, Deploy Pages all `success`
  (runs `33368731138`, `33368731051`, 2026-08-31).
- Three workflows present and proven: `ci.yml`, `deploy-pages.yml`, `deploy-worker.yml`.
- Release verdict on record: `READY_WITH_KNOWN_RISKS` (`RELEASE_STATE.md`).

### 1.2 Live deployment (verified directly by fetch from this machine — closing gaps the
building sandbox could never verify)

- Web: `https://mozareeduge.github.io/The-Near-Field/` → 200.
- MapLibre post-deploy fix shipped: `assets/maplibre-gl-worker.mjs` and
  `assets/maplibre-gl-shared.mjs` both → 200 on Pages.
- API: `https://nearby-field-r2.mozareeduge.workers.dev/health` →
  `{"ok":true,"round":2,"ai":true,"routing":false,"rateLimited":true}`.
- Wikipedia User-Agent fix working live: `/api/search?q=Tehran` returns real Wikipedia
  coordinate results (provider `wikipedia-coordinate-fallback`).
- Validation paths live: `POST /api/field` without coordinates → clean `{"error":"Invalid coordinates"}`.

### 1.3 Skill versions — a confirmed gap

- Repository carries `packages/nearby-narrative` **v7.0.0** (14 canonical tests).
- The master package (`Downloads/nearby-narrative-v7.1.0-master-package.zip`, extracted and
  read) freezes **v7.1.0** as the selected release: 18/18 tests, 8/8 frozen oracle matches
  (v7.0.0 scores 1/8 on the same eight deterministic comparison points).
- v7.1.0 changes (from its `CHANGELOG.md`): Gatherer validator enforces `local_material ≤ 4`
  and `relations ≤ 8`; synth provenance requires ≥1 `used_place_id`; movement schema constrains
  `NONE`/`VERIFIED`/`RELATIONAL_UNVERIFIED` verification semantics; Synthesizer gains a positive
  local-necessity rule and real-local predicate boundaries; four new regression guards.
- v7.1.0 explicitly unchanged: two-call architecture, retrieval/radius/enrichment logic,
  Gatherer role, deterministic movement generator, compact synth payload, no third model role,
  **no host-specific behavior in the canonical skill** (this is a v7.1.0 changelog guarantee and
  an owner requirement — both).
- Its literary improvement is evidence-motivated but **not independently proved** (isolated fresh
  model contexts unavailable in the packaging environment) — hence its verdict
  `READY_WITH_KNOWN_RISKS`. This plan carries that gap forward rather than asserting it away.

### 1.4 Handoff package

- `Nearby_Field_Multihost_Claude_Code_Handoff_v1.0.zip` and its `(1)` copy verified
  **byte-identical** (`diff -rq` empty).
- Prepared against base commit `a74027a`; `main` has since moved two commits ahead
  (`3d492ff` MapLibre worker-asset fix, `3fe3d7c` Wikipedia UA fix). Both touch
  `apps/web/vite.config.ts` and the worker's `wiki()` helper only — no conflict with any
  multihost assumption. The rebase is recorded here per the handoff's own rule
  ("inspect the diff from the base commit first; rebase semantically").

**Phase 0.1 verification record (executed on this machine, 2026-08-31).** The full delta
`a74027a..3fe3d7c` is five commits (`671d625`, `e4d62d2`, `b9f93f7`, `3d492ff`, `3fe3d7c`)
touching exactly: `.github/workflows/deploy-worker.yml`, `NEXT_STEPS.md`, `RELEASE_STATE.md`,
`apps/web/vite.config.ts`, and `apps/worker/src/index.ts` (2 lines — the `wiki()` User-Agent
fix). `git diff --stat a74027a 3fe3d7c`: 5 files, +190/−138. None touch `packages/`,
`packages/contracts`, or any schema/contract the multihost architecture consumes.
**Conflicts: none (verified against the actual diff, not the handoff's two-commit summary).**

### 1.5 Known limits carried forward (from `KNOWN_LIMITS.md`, updated by live checks)

- CSP ceiling on GitHub Pages is permanent for that host (`<meta>` CSP cannot carry
  `frame-ancestors`; no security response headers at all). `_headers` retained for a future
  Cloudflare Pages move.
- Rate limiter deployed and bound but never load-tested under real concurrent edge traffic.
- Map tile pixels (OpenFreeMap) never eyeballed live from any sandbox; layout/typography/
  interaction verified independent of tiles.
- ORS/MapTiler keys deliberately unset; the tested fallbacks (Wikipedia coordinate search,
  `RELATIONAL_UNVERIFIED` movement) are what is live — a quality decision, not a defect.

---

## 2. Owner model (stated by the owner, 2026-08-31 — governs everything below)

Two artifacts, one authority:

1. **The skill — pure, host-agnostic literary apparatus.**
   - Runs on Claude Code, Codex, Hermes, Gemini CLI, no-code agent tools, and any client of the
     open agentskills.io format. No MCP dependency, no plugin dependency, no server dependency.
   - The host's own model performs the two roles (Gatherer, Synthesizer); the bundled Python
     scripts do the deterministic work (field preparation, validation, payload boundaries) where
     script execution is available; network-optional via prepared fields (fixtures ship in the
     skill).
   - Execution profiles from `references/RUNTIME.md` are the portability contract:
     `P2_DIRECT` (two fresh one-shot calls), `P2_AGENT` (two fresh subagents on coding harnesses),
     `P1_COMPAT` (same-context staging, labeled non-isolated), `MANUAL_TWO_CHAT` (the no-code,
     copy-paste path — a person with any chat tool can run the work by hand).
   - No host names in the canonical skill, ever (`RUNTIME.md`: no hard-coded vendor/model names;
     v7.1.0 changelog: no Codex/Hermes/Claude-specific behavior).

2. **The plugin — the web-app experience on the user's account.**
   - Works just like the web app: the locked design (map ⇄ prose composite, not a chat window),
     its own page/UI, per `10_PRODUCT_AND_INTERACTION.md` and `12_VISUAL_CARTOGRAPHIC_SYSTEM.md`.
   - The LLM is **the user's own host account** — GPT in ChatGPT, Claude in Claude, the active
     model in Claude Code / Codex / Hermes / any MCP-capable harness. No OpenAI/Anthropic API keys
     anywhere in the audience flow (handoff hard rule).
   - The host model performs Gatherer/Synthesizer; the remote MCP Worker supplies deterministic
     truth: search, field preparation, schema validation, movement/routing verdicts, provenance,
     commit integrity.
   - **Distribution is by capability, not by vendor list**: hosts with MCP App UI get the full
     interface; harnesses with MCP but no app-UI rendering get the same five tools with
     capability-probed UI (tool correctness mandatory, rich UI optional) and gain the full
     interface with zero code change as MCP App UI adoption spreads.

One artwork, multiple hosts/distributions:

```text
Nearby Field
├─ Standalone Web        live GitHub Pages + Cloudflare Worker + Workers AI (preserved, untouched)
├─ Plugin via MCP        remote MCP server + MCP App UI + host model from the user's account
│                        (ChatGPT, Claude Chat/Desktop, Claude Code, Codex, Hermes, any MCP harness)
└─ Portable skill        agentskills.io package; the apparatus alone, any host or no host tooling
```

---

## 3. Target architecture (from the handoff `03_TARGET_MULTIHOST_ARCHITECTURE.md`, adopted)

```text
apps/
  web/                 existing standalone UI (preserved)
  worker/              existing REST + Workers AI adapter (preserved; AI stays here)
  mcp/                 NEW remote Streamable HTTP MCP server (host-neutral, no model calls)
  mcp-ui/              NEW MCP App packaging/runtime adapter (current design authority)

packages/
  contracts/           existing/shared wire contracts
  nearby-narrative/    canonical literary procedure (upgraded to v7.1.0 — Phase 0)
  encounter-core/      NEW deterministic host-neutral logic (extraction — Phase 1)

distributions/
  chatgpt/             metadata, reviewer cases, setup docs
  claude/              connector metadata/setup docs
  claude-code/         .claude-plugin, .mcp.json, host-orchestration skill
  generic/             vendor-neutral MCP registration doc (server URL + manifest + per-host notes)
```

- Separate `apps/mcp/` Worker first (blast-radius isolation); consolidation into one Worker only
  if materially simpler **and** provably risk-neutral — an implementation decision made on
  evidence, not by default.
- `encounter-core` contains exactly: contracts/types, Gatherer + Synthesizer schemas,
  `validateGatherer`/`validateSynthesis`, payload builders, movement truth/ordering, the routing
  verification adapter boundary, commit-selection validation, render-binding validation.
- `encounter-core` must NOT contain: `env.AI.run(...)` (standalone model adapter), any MCP/host
  bridge, any model provider call.

---

## 4. Phases

Each phase's green suite is the entry condition for the next. Evidence binds to the exact
candidate commit; nothing merges across builds.

### Phase 0 — Reconciliation and baseline freeze

| # | Task | Acceptance |
|---|---|---|
| 0.1 | Record the `a74027a → 3fe3d7c` delta in the multihost brief | documented; conflicts: none (verified) |
| 0.2 | Verify v7.1.0 package SHA256s against `SHA256SUMS.txt` | all match |
| 0.3 | Adopt v7.1.0 into `packages/nearby-narrative` from the master package's skill directory | byte-faithful; `SKILL.md` frontmatter passes the agentskills.io conformance check (name matches dir, description ≤1024 chars, body <500 lines) |
| 0.4 | Sync the worker to v7.1.0 validators/schemas (new caps, `used_place_id` required, movement semantics) per authority §15 exact-file rule | `qa-release.sh` green: 30/30 Node tests + 18/18 canonical; both builds clean |
| 0.5 | Run the external test kit (`EXTERNAL_TEST_KIT/`: deterministic baseline comparison, portability protocol) against the integrated copy | reproducible in situ |
| 0.6 | Commit as the `NF-R3-0.3.0` baseline; update the QA evidence register | frozen identity recorded |

### Phase 1 — Shared deterministic core (`packages/encounter-core/`)

| # | Task | Acceptance |
|---|---|---|
| 1.1 | Extract the frozen core list (§3) from `apps/worker`; refactor the worker to consume it | pure refactor; behavior identical; existing suites green |
| 1.2 | The ten mandated shared-core tests (handoff `10_QA_AND_ACCEPTANCE.md` §B): candidate identity mismatch rejection; enrichment-as-place rejection; duplicate selection rejection; unknown place/evidence rejection; invalid binding offsets; raw/rejected extracts absent from `synth_input`; commit-tamper rejection; no `VERIFIED` without real route proof; standalone and MCP paths share validators; **no model provider call in the core** | 10/10 pass |
| 1.3 | Gate: full `npm run qa` unchanged in behavior | green |

### Phase 2 — Remote MCP server (`apps/mcp/`)

| # | Task | Acceptance |
|---|---|---|
| 2.1 | Implement the five host-neutral tools with frozen semantics (handoff `05_MCP_TOOL_CONTRACT.md`): `open_field`, `search_place`, `prepare_field`, `commit_selection`, `render_field` | schemas derived from repo contracts + canonical skill schemas |
| 2.2 | Server-verifiable opaque commit tokens (integrity-protected; client-supplied field copies never trusted — same tampering class the v1.0.0 security pass fixed on `/api/movement`) | tamper-rejection regression tested |
| 2.3 | Truthful MCP tool annotations (`readOnlyHint`, `openWorldHint`, `destructiveHint`); provider secrets never reach UI; source text stays untrusted data; Taft sparse-field regression preserved | conformance checks pass |
| 2.4 | Deploy as its own Worker (repo Cloudflare secrets already configured — proven pipeline) | MCP conformance: initialize, tools/list (5), resource read, valid/invalid calls, MCP Inspector pass |
| 2.5 | Anything requiring a live host is labeled `UNPROVED`, never `PASS` | recorded in QA state |

### Phase 3 — MCP App UI (`apps/mcp-ui/`)

| # | Task | Acceptance |
|---|---|---|
| 3.1 | Package the current artwork's visual/interaction authority as the MCP App resource — LOCKED sections non-negotiable; no fork into three visual codebases; one runtime adapter interface consumed by the MCP UI | matches `10_`/`12_` authority |
| 3.2 | **UI fallback ladder**, specified up front so the artwork degrades legibly: (a) full MCP App UI → (b) structured-text rendering: paragraph + bindings + provenance in the design vocabulary → (c) bare tool I/O | each rung defined; (b) and (c) never read as chat |
| 3.3 | Playwright checks against the real component tree, reusing the existing fixture set (Taft, Harpers Ferry) | viewport/reduced-motion checks pass |

### Phase 4 — Distributions

| # | Deliverable | Content |
|---|---|---|
| 4.1 | `distributions/claude-code/` | `.claude-plugin/plugin.json`, `.mcp.json`, host-orchestration skill (`nearby-field-host`): teaches harnesses when/how to invoke the five tools — an orchestration hint, **not** a second literary apparatus |
| 4.2 | `packages/nearby-narrative/INSTALL.md` | the zero-friction bare-skill path: copy-to-skills-directory for any agentskills.io client; includes the no-code `MANUAL_TWO_CHAT` walkthrough |
| 4.3 | `distributions/chatgpt/` | metadata, reviewer cases, setup docs per handoff `06_` |
| 4.4 | `distributions/claude/` | connector metadata/setup docs per handoff `07_` |
| 4.5 | `distributions/generic/` | vendor-neutral registration: one server URL + manifest; per-host notes for Claude Code, Codex, Hermes, Gemini CLI, and generic MCP clients |
| 4.6 | Skill trigger evals | ~20 should/should-not-trigger queries; must include no-code phrasings ("write a story about where I am", "nearby places paragraph") as well as agent phrasings |
| 4.7 | License field | **owner gate G1** — set in `SKILL.md` frontmatter before publish |

### Phase 5 — Deploy and live-host QA campaigns

| # | Task | Acceptance |
|---|---|---|
| 5.1 | Baseline non-regression on the live standalone edition: Pages build, REST contracts, Workers AI isolation to the standalone path, privacy/security repairs intact, stale-run/abort behavior intact, visual authority undrifted | handoff §A checklist, all green |
| 5.2 | Live-host campaigns, per candidate/host, strict evidence provenance: Taft sparse case; Harpers Ferry multi-node case; provider-failure recovery | handoff §D |
| 5.3 | Harness conformance: Codex MCP registration, Hermes MCP registration (executable directly from this machine), generic MCP Inspector as vendor-neutral oracle | handoff §C + owner's capability-not-vendor requirement |
| 5.4 | **Host literary-equivalence comparison**: the same frozen packets through Workers AI (standalone) vs ChatGPT host vs Claude host vs harness host | handoff §12 rule: a meaningful procedural/aesthetic difference is surfaced as **owner gate G3 with comparative evidence** — never silently resolved |

### Phase 6 — Release, documentation, archive

| # | Task | Acceptance |
|---|---|---|
| 6.1 | Required docs: `MULTIHOST_ARCHITECTURE.md`, `MULTIHOST_HOST_MATRIX.md`, `MULTIHOST_QA_STATE.md`, `MULTIHOST_DEPLOYMENT.md`, `MULTIHOST_KNOWN_LIMITS.md` | same honesty discipline as `RELEASE_STATE.md` |
| 6.2 | Host matrix (handoff `12_`, extended by the owner's model): capability columns for Standalone / ChatGPT / Claude Chat+Desktop / Claude Code / Codex / Hermes / generic MCP; rows include "host subscription supplies prose: no/yes…", "audience LLM API key: no everywhere", "full map/prose UI required: yes / yes / capability-probed…", "canonical epistemic boundary: yes everywhere" | delivered |
| 6.3 | Candidate identity freeze: git SHA, lockfile identity, MCP server version, MCP App resource version, canonical Nearby Narrative digest, plugin metadata versions — the traceability chain authority §8 requires | frozen and recorded |
| 6.4 | Final verdict in the project's own vocabulary: `READY` / `READY_WITH_KNOWN_RISKS` / `VERIFICATION_INCOMPLETE` — never invented readiness | delivered |
| 6.5 | **Mozare-wiki registration — owner gate G4**: register the multihost release in the project-family records (a documented instance of the genre-translation mechanism: one invariant set — two-call roles, evidence caps, honest movement — instantiated as portable skill, cartographic web artwork, and host-mediated conversation) | only with explicit owner approval, per wiki governance |

---

## 5. QA protocol (consolidated)

- Deterministic-first: every phase gates on suites that run without credentials/network
  (`qa-release.sh`, canonical 18-test suite, static UI contracts, shared-core tests, MCP
  conformance against the local server).
- Real runtime over mocks where the environment allows: local HTTP against a real running
  Worker, Playwright against the real component tree, MCP Inspector against the deployed server.
- Evidence provenance: per candidate, per host, per commit; screenshots/logs never merged across
  builds.
- Unverifiable ≠ failed: live-host items that cannot be executed from here are `UNPROVED` with
  the exact closing condition named — never silently promoted.
- Host-neutrality test: the shared core and MCP server contain no model provider call and no
  host-specific branch (tested, not asserted — §B10).

## 6. Owner gates (the plan pauses here; it does not guess)

| Gate | Decision | When |
|---|---|---|
| G1 | License for the portable skill/schemas/role texts (the most portable, copyable artifact Mozare has published — attribution is an artistic decision) | before 4.7 publish |
| G2 | Provider keys: do MapTiler/ORS ever ship, or is the fallback state (Wikipedia coordinate search, `RELATIONAL_UNVERIFIED`) the released aesthetic? Also binds the MCP path | before Phase 5 verdict |
| G3 | Host literary-equivalence verdict after the Phase 5 comparison | after 5.4 |
| G4 | Mozare-wiki registration | Phase 6.5 |

## 7. External dependencies (bound the *verdict*, never the code work — per the delivery contract)

- ChatGPT workspace/app access: ChatGPT live campaign + submission.
- Claude connector publication: Claude interactive live campaign.
- Nothing else; Cloudflare credentials exist in the repo.

## 8. Risk register

| Risk | Response |
|---|---|
| v7.1.0 literary improvement unproved (its own verdict) | carried as a named proof gap; Phase 5.4 comparison is the closing instrument; never asserted away |
| Single-Worker consolidation temptation | only on evidence of material simplicity + zero regression risk; default is separate `apps/mcp/` |
| Host drift (a host's UI conventions pulling the design) | the authority docs win; conflicts flagged, never silently picked — inherited rule |
| MCP App UI spec volatility across hosts | fallback ladder (3.2) makes rich UI a capability, not a dependency |
| Repo regression during core extraction | pure-refactor discipline + full suite gate before any new surface |

---

*This plan is the single source of sequencing truth for R3. Amendments go through this file, with
the changed line and reason recorded, matching the project's own decision-ledger practice.*
