# Round 3 model and literary evaluation protocol

This freezes the evaluation method while leaving the final model choice open.

## Purpose

Select a production Gatherer/Synthesizer pair for **this artwork**, not a generally prestigious model pair.

## Frozen packet set

Create **12–20 fixed candidate-field packets** before comparing models. Preserve exact hashes. The set must include:

- Taft sparse regression;
- Harpers Ferry dense multi-node regression;
- Neyshabur symbolic/fame-heavy regression from the canonical suite;
- at least two ordinary/infrastructural fields where famous landmarks are not the only useful material;
- at least two fields with strong symbolic temptations (ruins/graves/famous figure/art object etc.);
- at least two geographically dense urban fields;
- at least two non-Western fields beyond the existing Iranian regression cases;
- at least one field with only one useful geographic place;
- at least one field where routing is disconnected/unverified.

Do not change the packet between model candidates.

## Gatherer comparison

Minimum:

- the current economical provisional model;
- one stronger/different control available at execution time.

Record:

`packet hash | model/provider | settings/seed | prompt SHA | schema SHA | latency | input/output tokens | cost | validator result | selected IDs | failure labels`

Hard failures include invented source identity, fiction/plot leakage, enrichment-as-place, unjustified walkability/current-condition claims, and failure to mark obvious semantic lure.

## Synthesizer comparison

Minimum two materially different current model candidates. Use the **same validated Gatherer/movement packet** for each comparison when isolating Synthesizer quality.

Where model variability matters, use 2–3 seeds/settings per packet.

Blind-review on the existing ten dimensions:

1. life underway;
2. local necessity;
3. human relational density;
4. non-instrumental detail;
5. causal legibility;
6. factual discipline;
7. symbolic resistance;
8. restraint/prose control;
9. ending residue;
10. generic-LLM signal.

Record critical failure labels separately; do not hide them inside an average:

`TOURIST_GAZE | SOURCE_SUMMARY | SYMBOLIC_OVERFIT | REPLACEABLE_GEOGRAPHY | TASK_MACHINE | PSEUDO_SPECIFICITY | FALSE_LOCAL_COLOR | CURRENT_FACT_SMUGGLING | CAUSAL_THINNESS | ARBITRARY_OPACITY | OVER_EXPLANATION | THEMATIC_ENDING | GENERIC_LLM_PROSE`

## Selection rule

Choose the lowest-cost/latency pair that satisfies the epistemic hard gates and materially wins or remains non-inferior on literary behavior. A cheaper Gatherer + stronger Synthesizer is expected to be plausible but is not pre-decided.

Record:

`WHY THIS → IMPORTANT REJECTED ALTERNATIVE → WHAT WOULD MAKE THIS WRONG`

## Anti-bias rule

Do not let model reputation, reasoning benchmarks, marketing tier, or this Round-2 provisional default count as literary evidence.
