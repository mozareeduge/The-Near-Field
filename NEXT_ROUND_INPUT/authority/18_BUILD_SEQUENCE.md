# Nearby Field — Build Sequence v3

The web app should be built as testable vertical slices. Do not start by wiring the LLM.

---

# M0 — Repository / contract baseline

Deliver:
- React/Vite/TypeScript web app;
- Worker app;
- shared contracts package;
- canonical v7 role files copied/imported with checksums;
- test runner;
- GitHub Pages config;
- Worker local dev config.

Acceptance:
- local web+Worker;
- typecheck/tests;
- no secrets in client.

---

# M1 — Orientation map + search

Deliver:
- MapLibre map;
- readable orientation style;
- MapTiler autocomplete adapter;
- typo/local-language search;
- result map preview;
- GPS;
- map-point selection;
- anchor confirmation.

Acceptance:
APP-SCN-001..008 + search QA.

The app should already feel easy here.

---

# M2 — Geographic field

Deliver:
- MediaWiki GeoSearch/extract path;
- normalization;
- real page IDs/URLs;
- logical 1/3/10 km selection;
- candidate cap 16 × 110 words;
- field circle + candidate layer;
- state events.

No LLM yet.

Use fixtures to test visual density.

---

# M2.5 — Sparse enrichment

Deliver:
- `<3 within 10 km` trigger;
- bounded exact-place Wikipedia enrichment;
- max 4 × 80-word snippets;
- region consistency;
- non-geographic loader semantics;
- Taft regression fixture.

Acceptance:
Taft-like sparse case does not invent map points.

---

# M3 — Gatherer live

Deliver:
- exact v7 Gatherer prompt;
- structured-output adapter;
- source-ID validation;
- one retry;
- selection animation;
- model telemetry.

Evaluate at least one economical Gatherer candidate.

---

# M4 — Movement

Deliver:
- ORS matrix;
- deterministic sequence;
- ORS directions;
- movement states NONE/VERIFIED/RELATIONAL_UNVERIFIED;
- strong app verification semantics;
- provisional→verified drawing.

Harpers documentary-only route case is a negative control for `VERIFIED`.

---

# M5 — Synthesizer live

Deliver:
- exact v7 Synth prompt;
- app binding extension;
- stricter app output schema;
- one retry;
- no token streaming;
- prompt/model version telemetry.

Run frozen literary fixtures before model lock.

---

# M6 — Loader choreography

Deliver:
- streamed stage events;
- radius states;
- sparse-enrichment state;
- selection;
- movement transition;
- typographic synthesis measure;
- reduced motion;
- failure-preserving retries.

---

# M7 — Map ⇄ prose

Deliver:
- mention/reference/structural binding rendering;
- mouse/keyboard/touch;
- route emphasis;
- accessible summary;
- provenance mode.

Do not append source links into paragraph.

---

# M8 — Authored cartography / typography

Deliver:
- Maputnik-authored orientation style;
- field-reduced style;
- Recursive prototype typography;
- current palette tokens;
- mobile/desktop refinement;
- optional accent experiments.

Texture remains off until this stage is strong without it.

---

# M9 — Privacy / security / performance

Deliver:
- Worker secrets;
- CSP;
- rate limits;
- no precise GPS analytics;
- cache policy;
- performance telemetry;
- stage-cost telemetry;
- production error reporting without source/user leakage.

---

# M10 — Literary/model evaluation

Before public-ready model lock:
- 12–20 frozen evidence packets;
- sparse/dense/symbolic/ordinary/non-Western/infrastructure cases;
- one cheap Gatherer candidate;
- ≥2 Synth candidates;
- 2–3 seeds;
- blind review;
- token/latency/cost capture.

Choose model pair from evidence.

---

# Public-ready definition

A user can:

1. open the site;
2. find a place easily;
3. confirm it;
4. see truthful nearby Wikipedia geography;
5. see sparse enrichment without fake geography where needed;
6. see real Gatherer selection;
7. see verified or explicitly unverified movement;
8. receive one high-quality English paragraph;
9. explore map⇄prose links;
10. run again;
11. recover from ordinary failures without losing prior valid stages;
12. do all this in a bounded two-call runtime.
