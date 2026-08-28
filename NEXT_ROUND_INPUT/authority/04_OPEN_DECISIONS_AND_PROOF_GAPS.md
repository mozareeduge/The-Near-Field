# Open Decisions and Proof Gaps

This file distinguishes **design choices intentionally open** from **claims that simply have not been proven**.

---

# A. Open app/product decisions

## OPEN-001 — Public name
Working title: `Nearby Field`.

Needs:
- naming/identity decision;
- repository/public URL naming.

Does not affect runtime.

## OPEN-002 — Accent
Current prototype default: pale desaturated cool signal.

Compare:
- current cool pale;
- dry amber/mineral ochre;
- possibly low-saturation chartreuse.

Evaluate at real map sizes and dark-mode contrast.

## OPEN-003 — Paragraph alignment
Compare:
- centered under map;
- aligned to meaningful cartographic/grid axis.

Decision should be made after actual responsive prototype.

## OPEN-004 — Procedural texture
Optional.

It must:
- belong to cartographic scale/state;
- remain extremely quiet;
- not look like generic film grain/paper distress.

Build without it first.

## OPEN-005 — Route objective
Distance vs duration.

Both can be tested with identical fields.

## OPEN-006 — `again` anti-repeat strength
Current idea:
lightly discourage exact immediately previous selected set when enough alternatives exist.

Needs testing:
- whether repetition is sometimes artistically useful;
- whether anti-repeat distorts Gatherer selection.

## OPEN-007 — Provenance presentation
Options:
- discreet drawer;
- separate source mode;
- quiet source layer below work.

Locked:
never append source links into prose itself.

## OPEN-008 — Exact privacy topology for location APIs
Choices include:
- browser → public API directly;
- browser → Worker proxy with logging disabled;
- coordinate rounding before external calls.

Locked:
raw GPS never enters LLM prompts and should not be persisted as analytics.

## OPEN-009 — Model provider/model pair
Evaluate actual Gatherer/Synthesizer pairs.

Do not choose based on reasoning benchmark reputation alone.

## OPEN-010 — Basemap/geocoder/routing providers after prototype
Current defaults are practical, not permanent.

Keep interfaces replaceable.

---

# B. Integration decisions that should be confirmed during implementation

## OPEN-011 — App-required binding strictness
Map⇄prose is locked, therefore Nearby Field should require bindings in app mode.

Recommended contract:
- `bindings` required in app output;
- mention/reference spans use valid character offsets;
- structural binding may have null offsets;
- never rewrite prose merely to force all points into text.

Need implementation test with real model structured-output support.

## OPEN-012 — Enrichment loader visibility
Semantic rule is locked:
enrichment never becomes a map point.

Recommended visual:
- `field sparse`
- `reading local traces`
- optionally `2 local references`
- no article cards during generation.

Whether the count remains visible after completion is open.

## OPEN-013 — Enrichment trigger semantics after normalization
v7 formal rule is `<3 useful geographic candidates`.

Implementation needs a deterministic definition of “useful” before Gatherer:
- non-disambiguation;
- usable extract;
- place-like;
- deduplicated.

The heuristic can be refined without changing the threshold.

---

# C. Proof gaps from v7 QA

## PROOF-001 — Live `prepare_field.py`
Still unproven in this sandbox because direct DNS/network execution is blocked.

Required external proof:
- Taft;
- one dense city/town;
- one ambiguous named place.

Capture raw output, validation, latency, source IDs.

## PROOF-002 — Independent Gatherer execution
v7's prompt/schema has deterministic fixture tests but not an independent frozen multi-model run in the v7 QA campaign.

Required:
run fixtures through at least one economical model.

## PROOF-003 — Independent literary evaluation
Taft sample was same-context simulation.

Required:
blind fixture matrix across 12–20 geographic fields, 2–3 seeds, at least two Synthesizer candidates.

## PROOF-004 — v7 token economy in coding-agent host
The expensive Claude Code run belonged to an earlier architecture.

Required:
run lean v7 adapter once and record:
- model calls/turns;
- cache read/write;
- wall time;
- output;
- tool usage.

## PROOF-005 — Framework adapters
LangGraph/Deep Agents/ADK/OpenAI Agents SDK/Hermes adapters are documentation-level mappings, not all runtime-tested.

Only test those actually needed.

---

# D. Findings introduced by Harpers Ferry execution

## HF-GAP-001 — Native ChatGPT skill activation was not demonstrated
The test started with a plugin search that returned no matching plugin, then located the v7 ZIP in the file/library and manually used it.

Therefore the run proves manual package execution in ChatGPT, **not** implicit installed-skill activation.

The separately downloaded ChatGPT skill export is packaging evidence, not the same as an activation trace.

## HF-GAP-002 — Live bundled retrieval not executed
`candidate_field.json` was manually constructed from web research.

`pageid` values `900001–900003` were placeholders.

Do not treat this as proof of MediaWiki source-identity flow.

## HF-GAP-003 — Strict context isolation not executed
Gatherer and Synthesizer were staged in the same overall ChatGPT context.

Classify run as `P1_COMPAT`.

## HF-GAP-004 — Route `VERIFIED` was too permissive for app semantics
Movement was manually set to `VERIFIED` after documentary route research; numeric route legs were not obtained.

For Nearby Field production:
`VERIFIED` requires the configured pedestrian routing adapter to successfully verify the exact ordered points.

## HF-GAP-005 — Outer answer added presentation around the validated work
The validated paragraph was one 141-word paragraph; the outer demonstration added images/process explanation and a source link.

For Nearby Field:
the paragraph remains verbatim; provenance/process are separate layers.
