# Round 2 — findings from making

These are observations that changed the candidate, not explanations invented before construction.

## F01 — `VERIFIED` is an evidential object

The old Harpers Ferry fixture looked coherent but encoded `VERIFIED` without runtime route evidence. Implementing the actual movement adapter exposed the category error: a plausible ordered relation is not a verified pedestrian route.

**Change:** `VERIFIED` now requires an exact provider Matrix + Directions chain and a LineString. All other multi-node runs are visibly `RELATIONAL_UNVERIFIED`.

## F02 — JSON schema does not close epistemic identity

Structured model output can still cite a syntactically valid but nonexistent candidate or use a stale title/coordinate.

**Change:** the Worker validates candidate identity after the model and only then promotes the Gatherer packet.

## F03 — map⇄prose is one object relation, not two hover effects

The first UI implementation used an active-state shortcut. A map hover could update candidate focus without guaranteeing that the corresponding prose object was the same active `place_id`.

**Change:** transient hover and pinned activation are separated; both surfaces now resolve through the same selected-place address.

## F04 — stage separation improves the artwork, not only debugging

With one opaque pipeline a prose failure would make the participant experience the whole encounter as failed. Three stage endpoints allow geography and selection to remain as material facts even when a later literary operation fails.

**Change:** retry is stage-local and valid prior work persists.

## F05 — sparse enrichment must remain materially weaker than geography

Once literary generation is introduced, it becomes easy for a text-only local reference to acquire apparent spatial certainty through prose or route logic.

**Change:** enrichment can contribute local material to Gatherer/Synthesizer evidence but cannot enter selected geographic movement and never gains a map point.
