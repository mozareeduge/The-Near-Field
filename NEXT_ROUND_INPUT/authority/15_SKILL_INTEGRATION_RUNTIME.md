# Nearby Field — Exact Skill Integration Runtime

This document replaces the older app v2 runtime prompt templates where they conflict with v7.

---

# 1. Important distinction

The **portable skill** is packaged as Agent Skills.

The **web app runtime** should not ask a model to activate/read the whole skill.

The Worker knows exactly which role it needs.

Production:

```text
deterministic source prep
→ Gatherer role file + candidate payload
→ deterministic movement
→ Synthesizer role file + compact payload + app binding extension
```

---

# 2. Call 1 — Gatherer

## Static instruction

Exact file:

`practical/canonical-skill/nearby-narrative/references/GATHERER.md`

No app design/handoff text is included.

## Dynamic input — app profile

```json
{
  "task": "Select and compress the local evidence field for Nearby Field.",
  "run_id": "UUID",
  "current_date": "YYYY-MM-DD",
  "output_language": "English",
  "regional_context": {
    "anchor_label": "Taft",
    "anchor_granularity": "city",
    "settlement_or_city": "Taft",
    "intermediate_region": "Yazd Province",
    "country": "Iran"
  },
  "logical_radius_m": 10000,
  "candidate_pages": [
    {
      "candidate_id": "C01",
      "pageid": 12345,
      "title": "Taft, Iran",
      "url": "https://en.wikipedia.org/...",
      "latitude": 31.74944,
      "longitude": 54.20889,
      "distance_from_anchor_m": 0,
      "extract": "≤110 normalized words"
    }
  ],
  "enrichment": [
    {
      "source_id": "E01",
      "title": "Qanat",
      "url": "https://en.wikipedia.org/...",
      "snippet": "≤80 normalized words explicitly mentioning Taft",
      "explicit_local_term": "Taft"
    }
  ]
}
```

## Excluded

- raw device GPS as personal datum;
- search history;
- map gestures;
- provider relevance scores;
- prior narratives;
- route;
- Synthesizer instructions;
- model/tool logs.

## Output

Use canonical `gatherer-output.schema.json`.

The Worker then performs:
- schema validation;
- source-ID/title/URL identity validation;
- no-fiction invariant validation.

One retry maximum.

---

# 3. Interstage

The Worker computes movement only from selected **geographic** places.

Enrichment never enters route ordering.

Movement object:

```json
{
  "state": "VERIFIED",
  "route_verified": true,
  "order": ["P01", "P03", "P02"],
  "total_distance_m": 1240,
  "legs": [
    {
      "from": "P01",
      "to": "P03",
      "distance_m": 410
    }
  ]
}
```

or:

```json
{
  "state": "RELATIONAL_UNVERIFIED",
  "route_verified": false,
  "order": ["P01", "P03", "P02"],
  "total_distance_m": 980,
  "legs": [...]
}
```

For one node:

```json
{
  "state": "NONE",
  "route_verified": false,
  "order": ["P01"],
  "total_distance_m": 0,
  "legs": []
}
```

---

# 4. Strict Synthesizer payload builder

Build programmatically from validated artifacts.

Example:

```json
{
  "run_id": "same UUID",
  "current_date": "YYYY-MM-DD",
  "output_language": "English",
  "regional_context": {
    "settlement_or_city": "Taft",
    "intermediate_region": "Yazd Province",
    "country": "Iran"
  },
  "selected_places": [
    {
      "place_id": "P01",
      "title": "Taft, Iran",
      "facts": [
        {"evidence_id": "P01-F1", "text": "..."}
      ],
      "particulars": [
        {"evidence_id": "P01-D1", "text": "..."}
      ],
      "affordances": ["..."],
      "semantic_lures": ["..."]
    }
  ],
  "local_material": [
    {
      "evidence_id": "LM1",
      "source_id": "E01",
      "text": "..."
    }
  ],
  "relations": [],
  "unknown_current_conditions": [
    "weather",
    "crowd level",
    "opening status"
  ],
  "movement": {
    "state": "NONE",
    "route_verified": false,
    "order": ["P01"],
    "total_distance_m": 0,
    "legs": []
  }
}
```

### Hard boundary check

The payload must not contain keys/values representing:
- `candidate_pages`;
- raw `extract`;
- raw `enrichment` snippets;
- rejected page IDs;
- search results;
- page ranking;
- exact user GPS;
- route geometry.

The canonical `build_synth_input.py` demonstrates this boundary.

---

# 5. Call 2 — Synthesizer

## Static instruction

Exact canonical:

`references/SYNTHESIZER.md`

plus the **Nearby Field app output metadata extension**:

```text
After finalizing the paragraph, annotate it for the interface.

Return:
- paragraph
- used_place_ids
- bindings

Binding:
- mention: direct named textual reference
- reference: indirect textual reference
- structural: a selected place shapes the event/route without a text span

For mention/reference, start/end are character offsets into the finalized paragraph.
For structural, start/end are null.

Do not alter or pad the paragraph just to create bindings.
A selected place does not have to be named.
```

This extension is interface metadata, not a new literary style prompt.

## Output

The app uses its stricter schema:
`practical/app-contracts/app-synthesizer-output.schema.json`

`bindings` are required.

---

# 6. Validation

## Gatherer
Verify:
- 1–5 selected geographic places;
- each source candidate exists;
- title/URL match;
- evidence IDs unique;
- caps;
- relations only selected place IDs;
- enrichment local-material sources exist;
- no fiction fields.

## Synthesizer
Verify:
- exactly one paragraph;
- no HTML;
- English;
- ≤ configured hard emergency cap (canonical validator 260 words);
- used IDs exist;
- bindings use known place/evidence IDs;
- mention/reference offsets valid;
- structural null offsets.

## Literary
Mechanical validation cannot prove:
- life underway;
- local necessity;
- non-machinic prose;
- symbolic resistance.

Those require evals.

---

# 7. Sampling/model settings

Old app v2 temperature numbers are historical recommendations, not current authority.

Tune per model using frozen evidence packets.

Model/provider configuration should record:
- model ID;
- prompt version/hash;
- sampling/reasoning settings;
- input packet hash;
- output;
- latency;
- token/cost metrics.

---

# 8. Prompt versioning

Recommended:

```ts
const SKILL_VERSION = "7.0.0";
const GATHERER_PROMPT_SHA = "...";
const SYNTH_PROMPT_SHA = "...";
const APP_BINDING_CONTRACT_VERSION = "1";
```

Log these without logging raw user GPS.

The web app and exported portable skill should be traceable to the same role-file version.

---

# 9. Retry policy

Invalid Gatherer:
- retry Gatherer once;
- do not re-query Wikipedia.

Invalid Synthesizer:
- retry Synthesizer once;
- do not rerun Gatherer/route.

Provider/network failure:
- stage-specific retry only where safe and bounded.

Do not create an open-ended self-healing agent loop.
