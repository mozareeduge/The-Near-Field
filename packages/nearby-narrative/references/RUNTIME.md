# Runtime / Efficiency / Portability

## Preferred profile — P2_DIRECT

Exactly two one-shot model invocations:

1. Gatherer
2. Synthesizer

All retrieval, routing, compaction, and validation happen outside model tool loops.

Recommended:
- cheap/small model for Gatherer if it passes eval;
- stronger literary model for Synthesizer;
- no hard-coded vendor/model names in the canonical skill.

## P2_AGENT

Hosts with subagents may use two fresh subagents.

For coding agents:
- prepare source field before spawning Gatherer;
- each role should need one turn and no tools;
- do not preload the full developer distribution into subagents;
- pass only its role instructions + dynamic packet.

## P1_COMPAT

Same-context hosts may stage Gatherer then Synthesizer with a compact boundary.

Label as non-isolated.

## MANUAL_TWO_CHAT

Run Gatherer in Chat A.
Copy only the compact packet/movement to a new Chat B with Synthesizer instructions.

## Runtime budgets

- max 16 candidate pages × 110 words;
- max 4 enrichment snippets × 80 words;
- compact Gatherer packet;
- one paragraph, normally 80–220 words;
- one retry maximum per invalid model stage.

Do not add a third literary model call for normal execution.
