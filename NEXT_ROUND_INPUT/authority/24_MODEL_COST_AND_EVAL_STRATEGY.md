# Model Choice, Cost, and Evaluation Strategy

## 1. The Claude Code finding

An earlier Claude Code run reported:

```text
Sonnet 5
396 input
547 output
8.9M cache read
356.1K cache write
~10 min API / wall
reported cost $3.44
```

This does **not** mean the Nearby Narrative prompt itself was millions of tokens.

It indicates large repeated coding-agent host context/cache activity around a very small artistic task.

---

# 2. Architectural response

Production Nearby Field should avoid:

```text
coding-agent session
→ discover files
→ inspect repo
→ multiple tools
→ subagent loops
→ one paragraph
```

Prefer:

```text
deterministic source prep
→ Gatherer call
→ deterministic movement
→ Synthesizer call
```

The skill package remains useful for portable agent hosts, but the web app knows its behavior already.

---

# 3. Hard context budget

Current skill bounds:

### Geographic evidence
- 16 candidates max;
- 110 words max each.

### Enrichment
- 4 max;
- 80 words max each.

### Static prompts
- compact `SKILL.md`;
- Gatherer reference;
- Synthesizer reference.

### Calls
- exactly 2 normal model invocations;
- one retry max per invalid stage.

The Worker should record actual prompt-token/output-token values.

---

# 4. Model asymmetry

Gatherer:
- bounded classification/selection/compression;
- candidate for cheaper/smaller model.

Synthesizer:
- literary judgment and prose;
- likely deserves more capable model.

Do not assume “maximum reasoning effort” produces better literary writing.

The Taft failure showed that a highly capable model can diligently follow a bad search space and produce an efficient but dead incident.

Harness quality and source quality matter.

---

# 5. Do not hard-code model names in canonical skill

Keep configuration outside:

```ts
{
  gathererModel: "...",
  synthesizerModel: "...",
  gathererSettings: {...},
  synthesizerSettings: {...}
}
```

Version/evaluate them.

---

# 6. Evaluation matrix

For each frozen input packet, record:

```text
fixture ID
candidate-field hash
Gatherer prompt SHA
Synth prompt SHA
model ID
provider
sampling/reasoning settings
seed if supported
input tokens
output tokens
latency
cost
output
validator result
human scores
failure labels
```

---

# 7. Required model comparison

### Gatherer
At least:
- one economical model;
- optionally one stronger control.

Check:
- source identity;
- useful selection;
- no plot leakage;
- lure detection;
- no invented facts.

### Synthesizer
At least two candidates with different cost/capability.

Do not choose solely by:
- general reasoning benchmark;
- marketing tier;
- “high effort” setting.

Choose by blind literary eval + cost/latency.

---

# 8. Useful failure labels

```text
TOURIST_GAZE
SOURCE_SUMMARY
SYMBOLIC_OVERFIT
REPLACEABLE_GEOGRAPHY
TASK_MACHINE
PSEUDO_SPECIFICITY
FALSE_LOCAL_COLOR
CURRENT_FACT_SMUGGLING
CAUSAL_THINNESS
ARBITRARY_OPACITY
OVER_EXPLANATION
THEMATIC_ENDING
GENERIC_LLM_PROSE
```

Model choice should minimize critical failure frequency, not merely maximize average reviewer score.

---

# 9. Claude/Codex/Hermes lean-host rule

If a coding/agent host is used to execute rather than develop:

1. deterministic source field first;
2. role child gets only role prompt + payload;
3. no tool access inside role unless absolutely unavoidable;
4. max one role turn;
5. fresh Synthesizer;
6. no full repo/handoff injection;
7. capture telemetry.

This preserves portability while avoiding the earlier token-burn pattern.
