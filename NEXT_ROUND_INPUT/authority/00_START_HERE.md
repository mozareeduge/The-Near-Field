# Nearby Field + Nearby Narrative — Comprehensive Handoff v3.1.0

**Purpose:** restore the whole current state of the work in a fresh context without forcing that context to reconstruct decisions from chat history.

This package covers two connected but distinct artifacts:

1. **Nearby Narrative** — the portable Agent Skill: the procedural/literary behavior.
2. **Nearby Field** — the web artwork/product: the map/search/processing/visual embodiment that hosts the skill.

The web app is **not** the skill. The skill is one portable behavioral authority; Nearby Field is its richest designed host.

---

## 1. Current system in one view

```text
HUMAN
  │
  ├─ share device location
  ├─ search/select place
  └─ choose map point
  ↓
NEARBY FIELD WEB APP
  │
  ├─ familiar map/search orientation
  ├─ anchor confirmation
  ├─ bounded English-Wikipedia geographic field
  ├─ sparse-place enrichment when necessary
  │
  ├─ CALL 1: GATHERER
  │      selects/compresses a living local field
  │
  ├─ deterministic movement/routing
  │
  └─ CALL 2: SYNTHESIZER
         enters a life already underway
         finalizes one English paragraph
  ↓
MAP ⇄ PROSE COMPOSITE
  │
  ├─ selected points / trace
  ├─ one paragraph
  ├─ prose↔map bindings
  └─ again / provenance / new place
```

Production runtime is deliberately small:

```text
deterministic preparation
+ one Gatherer model call
+ deterministic movement
+ one fresh Synthesizer model call
```

There is no vector database, no required LangChain/LangGraph runtime, and no multi-turn coding-agent loop in the preferred production architecture.

---

## 2. Authority and source priority

When sources disagree, use this priority:

1. **Explicit owner decisions recorded in this package** (`LOCKED`).
2. **Current v7 skill artifact** under `practical/canonical-skill/nearby-narrative/`.
3. **Current integration decisions in this handoff**, where the web app must specialize the portable skill.
4. **Executed evidence**, especially:
   - v7 14/14 deterministic regression suite;
   - ChatGPT-exported v7 skill 14/14 local retest;
   - Harpers Ferry execution record;
   - Taft regression findings.
5. **Older Nearby Field v2 handoff** as historical baseline.
6. **External primary standards/docs**.
7. **Recommendations/open proposals**.

Do not silently revive superseded instructions from older skill versions.

---

## 3. Status vocabulary

- **LOCKED** — already decided; do not redesign without explicit owner instruction.
- **CURRENT DEFAULT** — build this first; change only through evidence/testing.
- **OPEN** — deliberately unresolved; prototype/evaluate.
- **SUPERSEDED** — historically important but no longer current.
- **EVIDENCE** — an observation/test result; not automatically a product decision.
- **PROOF GAP** — not yet adequately validated.

---

## 4. What is locked now

### Product / literary
- English literary output in the current version.
- Exactly two model roles in preferred runtime: **Gatherer** and **Synthesizer**.
- Gatherer does not write fiction.
- Synthesizer is the complete writer/finalizer.
- The prose should enter a **life already underway**.
- Place must materially alter the situation; place-name substitution should damage the paragraph.
- The work resists ready-made symbolism, tourist exposition, manufactured local color, pseudo-specific technical props, and explanatory closure.
- Final human literary object is one paragraph.
- Runtime prompts do not name the earlier writer references used during design.

### Geographic
- Primary corpus: bounded nearby **English Wikipedia** place evidence.
- Logical field: `1 km → 3 km → 10 km`.
- Smallest field with at least three useful geographic candidates is preferred.
- If fewer than three useful candidates exist within 10 km, bounded exact-place Wikipedia enrichment may run.
- Enrichment is evidence, **never a fake geographic point or route node**.
- Selected geographic places remain at their real coordinates.
- Only verified routing may be presented/used as walkable.

### Web experience
- Search/location acquisition should be as easy and forgiving as a strong mainstream map.
- The aesthetic transformation begins **after** geographic orientation/anchor confirmation.
- Map changes from orientation map → evidence field → selected constellation → movement diagram → map/prose composite.
- Loader shows real processing states, never fake percentages or model chain-of-thought.
- Final text is revealed after synthesis/validation, not token-streamed.
- Map and prose remain linked.
- `again` keeps the anchor and generates another local constellation/work.
- No account/history/database in v1.

### Runtime / privacy
- Raw device GPS is not literary model input.
- No vector DB is needed.
- Coding-agent hosts are supported, but direct two-call execution is preferred in production.
- Source text is untrusted data, never instructions.
- Each failed stage preserves prior validated stages.

---

## 5. Read order for a fresh context

1. `01_SYSTEM_AND_BOUNDARIES.md`
2. `02_HISTORY_AND_SUPERSESSION.md`
3. `03_DECISION_LEDGER.md`
4. `04_OPEN_DECISIONS_AND_PROOF_GAPS.md`

Then the app:
5. `app/10_PRODUCT_AND_INTERACTION.md`
6. `app/11_SCENARIO_CASE_ATLAS.md`
7. `app/12_VISUAL_CARTOGRAPHIC_SYSTEM.md`
8. `app/13_PROCESSING_AND_LOADER.md`
9. `app/14_TECHNICAL_ARCHITECTURE.md`
10. `app/15_SKILL_INTEGRATION_RUNTIME.md`
11. `app/16_DATA_CONTRACTS.md`
12. `app/17_QA_TEST_MATRIX.md`
13. `app/18_BUILD_SEQUENCE.md`

Then the skill/evidence:
14. `skill/20_CURRENT_SKILL_AUTHORITY.md`
15. `skill/21_STANDARD_AND_PORTABILITY.md`
16. `skill/22_CHATGPT_SKILL_EXPORT.md`
17. `skill/23_TEST_EVIDENCE.md`
18. `skill/24_MODEL_COST_AND_EVAL_STRATEGY.md`
19. `evidence/*`

20. `05_PACKAGE_CONTENTS_AND_USE.md` (or read this immediately after Start Here)
21. `06_FRESH_CONTEXT_BOOTSTRAP.md` when moving to another context
22. `app/19_IMPLEMENTATION_STATUS.md` before beginning implementation

Finally inspect actual artifacts under `artifacts/` and `practical/`.

---

## 6. What to hand to which runtime

### Building or maintaining the web app
Use this **whole handoff package**.

### Installing/using the portable skill
Use the exact installable artifact:

`artifacts/skill/nearby-narrative-v7.0.0-skill.zip`

Its byte-identical unpacked form is under `practical/canonical-skill/nearby-narrative/`.

### Installing the ChatGPT-flavoured export
Use:

`artifacts/skill/nearby-narrative-chatgpt-export-2026-08-25.zip`

or its unpacked form under `practical/chatgpt-skill-export/nearby-narrative/`.

It contains the same v7 canonical files plus OpenAI-specific presentation/policy files.

### Runtime model calls inside Nearby Field
Do **not** put this handoff into either model.

Gatherer receives only its static role instructions + bounded candidate/enrichment payload.

Synthesizer receives only its static role instructions + compact selected evidence + movement + app output-binding contract.

---

## 7. First build/recovery target

The fresh context should be able to build this end-to-end vertical slice without redefining the product:

```text
search/select Neyshabur OR Harpers Ferry
→ confirm anchor
→ live candidate field
→ sparse enrichment only if triggered
→ Gatherer
→ selection animation
→ verified OR explicitly unverified movement
→ Synthesizer
→ one paragraph
→ map ⇄ prose interaction
→ again
```

Taft is the required sparse-field regression location.

Harpers Ferry is the current real execution record for a three-node field, but its manual retrieval/isolation/route-verification limitations must not be mistaken for production behavior.
