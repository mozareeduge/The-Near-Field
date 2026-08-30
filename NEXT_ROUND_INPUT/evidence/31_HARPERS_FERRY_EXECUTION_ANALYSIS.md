# Harpers Ferry — Execution Record Analysis

Primary attached record:
`archive/nearby-narrative-v7_harpers-ferry_test_execution_record_2026-08-25.md`

This file separates **what the run executed** from **what it demonstrates**.

---

# 1. Requested demonstration

The user asked the newly added Nearby Narrative skill to:
- invent a realistic example prompt;
- choose a small town in the US;
- run the full skill.

Town chosen:
**Harpers Ferry, West Virginia**.

---

# 2. Skill discovery actually observed

The run first searched for a plugin/app matching Nearby Narrative and did not find one.

It then searched the file/library, encountered old loose skill versions, and finally found/materialized:

`nearby-narrative-v7.0.0-skill.zip`

Therefore:
the run did **not** start from proven native implicit skill activation.

It manually recovered and used the package.

---

# 3. Canonical v7 files were inspected

The run read:
- `SKILL.md`;
- `RUNTIME.md`;
- `RETRIEVAL.md`;
- `GATHERER.md`;
- `SYNTHESIZER.md`;
- schemas/scripts.

`static_check.py` returned:
`VALID`.

The combined package test command timed out in that ChatGPT run.

Separately, the v7 package had earlier 14/14 exact-ZIP tests, and the ChatGPT-exported package was retested during this handoff at 14/14.

---

# 4. Candidate field actually used

Three geographic places:

```text
P01 Harpers Ferry station
P02 Jefferson Rock
P03 Lockwood House
```

Distances from manual anchor were calculated with Haversine math.

But the final `candidate_field.json` was manually assembled from web research.

Important limitation:
the `pageid` values `900001–900003` were placeholders, not retrieved MediaWiki page IDs.

Therefore candidate structural validation passed, but source-identity retrieval was not proven.

---

# 5. Gatherer stage

A structured Gatherer packet was manually produced in the same ChatGPT runtime.

It included:
- source-backed facts/particulars;
- affordances;
- semantic lures;
- unknown current conditions.

Candidate validator:
`VALID`

Gatherer validator:
`VALID`

But no fresh isolated Gatherer model context existed.

---

# 6. Movement

The run researched route relations using Wikipedia/NPS material and produced:

```json
{
  "state": "VERIFIED",
  "route_verified": true,
  "order": ["P01", "P02", "P03"],
  "total_distance_m": null,
  "legs": [
    {"from": "P01", "to": "P02", "distance_m": null},
    {"from": "P02", "to": "P03", "distance_m": null}
  ]
}
```

Schema:
`VALID movement`.

However no real walking-routing API produced numeric legs/route geometry.

### Current app interpretation

This is a useful finding:
the portable schema accepted the object, but Nearby Field should use a stricter verification oracle.

For app:
`VERIFIED` means the configured pedestrian router successfully verifies the exact points/order.

Documentary relation research should be `RELATIONAL_UNVERIFIED` unless the product explicitly defines another verified-evidence class.

---

# 7. Synthesizer boundary

`build_synth_input.py` executed.

Observed payload size:
`4220 bytes`.

Raw candidate extracts did not cross.

This is meaningful evidence for the compact boundary.

But narrative generation remained in the same overall ChatGPT context.

Execution profile:
`P1_COMPAT`.

---

# 8. Validated paragraph

The structured output was one 141-word paragraph:

> Since their mother moved out, Mara and Eli had been passing the same cardboard box back and forth, each removing what they claimed and returning what they did not. Eli brought it to Harpers Ferry station and held it up from the other side platform until Mara noticed him across the two tracks. When they met, he took the red thermos, put three canning jars into the box, and said the measuring spoons were still hers. Mara started back with the box against her hip. At Jefferson Rock she set it down long enough to retape the bottom, looking at the split seam instead of the Shenandoah below. She kept going toward Camp Hill. By Lockwood House, one jar had worked loose again; she moved it into her tote and carried the box one-handed while the jar knocked against her keys.

Synthesizer validator:
`VALID`.

Mechanical:
- 141 words;
- 1 paragraph.

---

# 9. Observable literary properties

These are handoff observations, not independent blind scores.

### Life underway
Strong evidence:
the mother's move and repeated box-passing predate the paragraph.

### Non-technical human material
The fictional objects are ordinary household/moving objects rather than arbitrary specialized machinery.

### Geographic use
- two station platforms become a separation/reunion condition;
- Jefferson Rock becomes a place to set down/repair the box;
- movement continues toward Camp Hill/Lockwood House.

### Current-condition discipline
The paragraph does not invent listed unknown current conditions.

### Symbolic lure resistance
The overlook is not treated as revelation; the rock is not turned into permanence/memory; railroad is not a life-transition metaphor.

### Remaining eval question
How locally necessary is the human structure?
The geographic facts shape the event, but a full blind place-substitution evaluation was not performed.

---

# 10. Presentation mismatch

The validated JSON paragraph ended at:

`...knocked against her keys.`

The outer demonstration response then added:
- explanations;
- images;
- a source link after the narrative.

Those were **not** part of the validated Synthesizer result.

For Nearby Field:
- render paragraph verbatim;
- keep provenance separate.

---

# 11. What Harpers Ferry proves

Strongest claims supported:

- v7 package could be inspected and mechanically executed in ChatGPT;
- validators/boundary builder worked on the manually staged artifacts;
- compact Synthesizer boundary was exercised;
- one structured paragraph passed validation;
- the current literary harness can produce a less machinic life-underway result in this case.

It does **not** prove:
- native implicit ChatGPT skill activation;
- live `prepare_field.py`;
- real MediaWiki page-ID flow;
- strict fresh-context two-call runtime;
- real routing-provider verification;
- independent literary quality.

These distinctions must stay visible in future work.
