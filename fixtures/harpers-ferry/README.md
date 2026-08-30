# Harpers Ferry fixture — Round 2 status

This directory contains both the historical v3.1 reconstruction and the current stricter Round-2 fixture.

## Historical files preserved

- `movement.legacy-v3.1.json`
- `synth_input.legacy-v3.1.json`
- `synth_output.legacy-v3.1.json`

The historical candidate field remains manually assembled and its `pageid` values `900001–900003` are placeholders. It is therefore a regression/evaluation fixture, not production source truth.

The historical movement had been marked `VERIFIED` without route-provider distances/geometry. That status is explicitly superseded for current movement truth.

## Current Round-2 files

- `candidate_field.json` — retained historical evidence packet for structural/literary regression;
- `gatherer.json` — retained historical selected material;
- `movement.json` — rebuilt through the Round-2 no-key movement adapter and is `RELATIONAL_UNVERIFIED`;
- `synth_input.json` — rebuilt from the current Gatherer + current movement boundary;
- `synth_output.json` — one paragraph with validated app bindings.

Current `movement.json` must remain unverified unless a live/exact routing-provider result for those ordered points is captured. The legacy status is useful as a negative-control history, not a production oracle.
