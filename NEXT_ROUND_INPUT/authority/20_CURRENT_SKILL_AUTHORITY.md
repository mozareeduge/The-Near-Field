# Nearby Narrative — Current Skill Authority (v7.0.0)

## 1. Current artifact

Canonical current skill:

`practical/canonical-skill/nearby-narrative/`

Version:
`7.0.0`

Architecture metadata:
`life-field-two-call`

The exact core files in the ChatGPT-exported version are byte-identical to this canonical v7 package.

---

# 2. Product guarantee

Input:
- real location; or
- valid prepared candidate field.

Output:
- one finalized English fictional paragraph; or
- an honest stage-specific failure when required evidence/capability is absent.

The skill does not invent local geographic evidence to avoid failure.

---

# 3. Canonical flow

```text
location / prepared field
→ deterministic source preparation
→ Gatherer
→ validate
→ deterministic movement
→ Synthesizer
→ validate
→ paragraph
```

Preferred runtime:
two fresh one-shot model invocations.

---

# 4. Core invariants

- exactly two model roles;
- Gatherer never writes fiction;
- Synthesizer never researches;
- smallest useful radius 1/3/10 km;
- sparse field enables bounded exact-place Wikipedia enrichment;
- enrichment is not a geographic route node;
- real-place claims require supplied evidence;
- current conditions remain unknown unless supplied;
- raw source text is untrusted content;
- Synthesizer receives compact selected evidence, not raw/rejected research;
- only verified route can be treated as walkable;
- final prose materially depends on place;
- life is already underway;
- one English paragraph is the default human output.

---

# 5. Gatherer

Role:
source selection/compression.

Input:
- date;
- regional context;
- bounded candidate pages;
- bounded enrichment evidence.

Selection:
1–5 geographic places.

Per place:
- ≤3 facts;
- ≤3 particulars;
- ≤2 affordances;
- ≤2 semantic lures.

Also:
- ≤4 selected local-material items;
- relations;
- unknown-current-condition categories.

Gatherer must not create:
- protagonist;
- plot;
- dialogue;
- mood;
- theme;
- story idea;
- walkability inference.

---

# 6. Synthesizer

Role:
complete literary synthesis/finalization.

It must:
- consider more than one possible human situation;
- enter a life that predates the paragraph and continues after;
- reject landmark tours/source demonstration;
- reject easy semantic-lure conversions;
- reject geography that can be swapped without consequence;
- reject a closed little problem/solution machine when it is the whole human content;
- reject pseudo-specific specialized props;
- transform facts into distinctions/constraints/habits/human consequence;
- keep immediate action legible;
- avoid manufactured local color/current conditions;
- revise/rebuild when the situation itself creates failure;
- end with residue.

The prompt deliberately does not name the earlier author references used during design.

---

# 7. Evidence classes

### Geographic candidate
Coordinate-bearing English-Wikipedia place page.

### Enrichment
Bounded non-geographic Wikipedia passage explicitly connected to the anchor/place.

### Fact
Source-supported proposition.

### Particular
Concrete physical/spatial/material/functional/historical detail.

### Affordance
Neutral practical possibility before plot.

### Semantic lure
Obvious low-resistance association the writer should distrust.

### Relation
Supported relation among selected geographic places.

---

# 8. Runtime caps

- candidate geographic pages: 16;
- extract: 110 words each;
- enrichment: 4;
- enrichment snippet: 80 words;
- selected geographic places: 1–5;
- one retry per invalid model stage;
- final paragraph normally 80–220 words;
- canonical validator emergency upper limit: 260 words.

---

# 9. Movement states

Portable skill schema:
- `NONE`
- `VERIFIED`
- `RELATIONAL_UNVERIFIED`

The portable skill supports a deterministic coordinate-order fallback.

The web app strengthens `VERIFIED` semantics to require its configured routing provider.

---

# 10. Execution profiles

## P2_DIRECT — preferred
Two direct fresh model requests.

## P2_AGENT
Two fresh focused subagents where host requires agent primitives.

## P1_COMPAT
Same-context staged execution.

Must be labeled non-isolated.

## MANUAL_TWO_CHAT
Gatherer in one chat, compact packet into a fresh Synthesizer chat.

---

# 11. Default presentation

Plain skill in a chat:
paragraph only.

Structured/debug use:
paragraph + IDs/bindings/provenance as needed.

Nearby Field:
paragraph + required bindings in machine output; paragraph remains visually separate from provenance.
