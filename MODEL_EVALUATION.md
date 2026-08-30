# Model evaluation

## Status: not executed in this environment. Documented as a proof gap, not simulated.

`NEXT_ROUND_INPUT/ROUND3_MODEL_EVAL_PROTOCOL.md` defines the required
comparative evaluation: 12–20 frozen candidate-field packets, at least two
Gatherer model candidates and two Synthesizer model candidates run against
the same packets, blind-reviewed on ten literary dimensions with explicit
failure labels, selected by the lowest-cost pair that clears the epistemic
gates and is non-inferior on literary behavior.

That protocol requires live Workers AI calls. This session has:

- no `CLOUDFLARE_API_TOKEN`/account credentials configured, and
- this sandbox's network egress proxy blocks outbound calls to Cloudflare's
  API surface for that purpose regardless.

`wrangler dev --local` does present an `env.AI` binding object locally, but
invoking it makes a real remote call to Cloudflare's AI service — the
sandbox network policy blocks that call before it would ever reach a model.
No live Gatherer or Synthesizer call was made. No comparative literary
judgment was made or fabricated to fill this gap.

## What *was* verified about the model layer

- **Prompts unchanged.** `GATHERER_PROMPT` and `SYNTHESIZER_PROMPT` in
  `apps/worker/src/round2.ts` are the canonical role texts, embedded
  verbatim — `tests/prompt-fidelity.test.mjs` (`embedded Gatherer role
  matches canonical skill reference`, `embedded Synthesizer role matches
  canonical skill reference`) asserts this by hash comparison against
  `packages/nearby-narrative/references/`.
- **Schema validation is real and adversarially tested.** The canonical
  skill's own suite (`packages/nearby-narrative/tests/run_tests.py`, 14/14)
  includes six negative canaries that must fail validation: extract budget
  overrun, enrichment missing an explicit local term, fiction/plot leaking
  into the Gatherer, an unknown selected source, multiple paragraphs, and
  invalid binding offsets. All six correctly produce `INVALID`.
- **The one-retry repair loop is tested against a real model-shaped
  failure**, not just a schema shape: `tests/round2-pipeline.test.mjs`
  feeds a Gatherer response with an unknown `source_candidate_id`, confirms
  the Worker retries once with the validation error fed back to the model,
  and confirms it accepts the corrected response on the second attempt (and
  fails cleanly, never silently, if the second attempt is still bad).
- **Provisional model pair is untouched**: `GATHERER_MODEL=@cf/zai-org/glm-4.7-flash`,
  `SYNTHESIZER_MODEL=@cf/meta/llama-4-scout-17b-16e-instruct` (`.env.example`).
  This release did not change the model selection — that decision is exactly
  what the Round-3 protocol above exists to make, and nothing here
  substitutes for it.

## To close this gap

Run `apps/worker` with a real `CLOUDFLARE_API_TOKEN`/account and Workers AI
access, in an environment whose network isn't blocked to Cloudflare's API,
against the frozen packet set the protocol requires, and record the table
format it specifies. Nothing else in this codebase needs to change to make
that possible — the endpoints, schemas, and validators are already the
production shape.
