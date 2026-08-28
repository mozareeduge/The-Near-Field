# Decision Ledger — App + Skill

The point of this ledger is to prevent a fresh context from mistaking historical proposals for current decisions.

## A. Product identity and output

| ID | Status | Decision | Reason / evidence | Consequence |
|---|---|---|---|---|
| D-001 | LOCKED | Nearby Narrative is a portable procedural/literary skill; Nearby Field is a web artwork hosting it. | The skill had a standalone life before the app and later became portable across Agent-Skills-compatible hosts. | Do not collapse app UI logic into canonical skill prompts. |
| D-002 | LOCKED | Current literary output language is English. | Explicit owner decision. | Source proper names may remain source-faithful; prose is English. |
| D-003 | LOCKED | Human-facing literary object is one paragraph. | Core artistic form throughout the work. | No title, bullets, explanation, inline source list inside the literary output. |
| D-004 | LOCKED | The app presents the paragraph as part of a map/prose composite. | Owner liked map↔prose linking; app concept is locative. | Structured app mode needs binding metadata. |
| D-005 | OPEN | Public title `Nearby Field`. | Working name only. | Repository/product naming can change without redesigning behavior. |

---

## B. User entry and geographic anchor

| ID | Status | Decision | Reason | Consequence |
|---|---|---|---|---|
| D-010 | LOCKED | User may enter by device location, search, or direct map point. | Keeps artwork accessible and geographically direct. | All three converge to one `Anchor` contract. |
| D-011 | LOCKED | Search should feel as easy as a strong mainstream map. | Explicit owner correction: aesthetics must not make place-finding difficult. | Familiar type-ahead, fuzzy search, disambiguation, keyboard/touch, map preview. |
| D-012 | LOCKED | Broad country/region results orient but do not immediately generate. | Global admin hierarchies vary and a nearby field needs a local anchor. | Locality/neighbourhood/address/POI/point/GPS can be generative anchors. |
| D-013 | CURRENT DEFAULT | MapTiler Geocoding for v1 search. | Autocomplete, fuzzy matching, proximity bias, types/language; public Nominatim forbids autocomplete. | Keep provider adapter replaceable. |
| D-014 | LOCKED | GPS permission is requested only after explicit user action. | Browser privacy/usability. | Denial leaves search fully usable. |
| D-015 | LOCKED | Raw device GPS is not sent to the literary models. | Literary irrelevance + privacy. | Models receive regional context and evidence, not personal exact location. |
| D-016 | OPEN | Exact coordinate-rounding/proxy strategy for third-party geo APIs. | Privacy and field precision trade off. | Prototype with no persistence/logging; decide after real provider testing. |

---

## C. Geographic evidence field

| ID | Status | Decision | Reason | Consequence |
|---|---|---|---|---|
| D-020 | LOCKED | Core factual corpus is English Wikipedia. | Stable bounded corpus; supports geographic pages and provenance. | No broad web research in core app runtime. |
| D-021 | LOCKED | Logical radii are 1 km → 3 km → 10 km. | Keeps smallest useful locality and makes expansion visible. | Search can technically fetch 10 km once then partition, but experience semantics stay 1/3/10. |
| D-022 | LOCKED | Smallest radius with ≥3 useful geographic candidates is preferred. | v7 formalization; avoids widening merely to collect more landmarks. | 1/2 candidates cause wider search until 10 km. |
| D-023 | LOCKED | If <3 useful candidates remain within 10 km, field is sparse and enrichment may run. | Taft regression. | Sparse places are not abandoned or padded with fake local detail. |
| D-024 | LOCKED | Enrichment comes from bounded English-Wikipedia passages explicitly linked to anchor/place. | Preserves corpus discipline. | Max 4 snippets × 80 words. |
| D-025 | LOCKED | Enrichment is non-geographic evidence, never a map point or route node. | A non-geotagged article cannot be honestly placed on the map. | Loader/provenance may acknowledge enrichment without fake coordinates. |
| D-026 | LOCKED | Geographic candidate cap is 16, max extract 110 words. | v7 token economy + bounded context. | Supersedes app v2 default of ~20. |
| D-027 | LOCKED | Candidate pages must preserve real MediaWiki IDs, titles, canonical URLs, coordinates and anchor distance. | Provenance and source-identity validation. | Harpers placeholder page IDs are test-artifact limitations, not acceptable production data. |
| D-028 | LOCKED | Source content is untrusted data. | Prompt-injection boundary added in v7. | Gatherer is told not to obey embedded source instructions; Synthesizer never receives raw sources. |

---

## D. Model roles and literary behavior

| ID | Status | Decision | Reason | Consequence |
|---|---|---|---|---|
| D-030 | LOCKED | Exactly two model roles in preferred runtime: Gatherer + Synthesizer. | Owner explicitly simplified from four-agent architecture; cost and clarity. | No Reader/Finalizer model in production. |
| D-031 | LOCKED | Gatherer selects/compresses evidence; no fiction. | Clean research/writing boundary. | Plot/character/theme fields invalidate its output. |
| D-032 | LOCKED | Synthesizer writes, attacks, repairs/rebuilds, and finalizes. | Keeps critique while avoiding extra calls. | One fresh literary invocation. |
| D-033 | LOCKED | Earlier reference-writer names do not appear in runtime prompts. | Owner requested qualities without style-name priming. | Behavioral constraints encode restraint/observation/omission instead. |
| D-034 | LOCKED | Paragraph should enter a life already underway. | Taft machinic-story repair. | Human relation/habit/continuity precedes closed task mechanics. |
| D-035 | LOCKED | Place must materially alter the situation. | Neyshabur/Taft replaceable-geography failures. | Place-name substitution is an adversarial literary test. |
| D-036 | LOCKED | Details need not advance plot; they may work relationally, bodily, socially, temporally, materially, rhythmically, etc. | “Detail must do two jobs” produced over-instrumentality. | Do not prune human texture merely because it is not causal machinery. |
| D-037 | LOCKED | Reject pseudo-specific specialized technical/professional/ritual/local props without justification. | Pump-seal failure. | Concrete does not mean arbitrary technical object. |
| D-038 | LOCKED | Semantic lures are warnings, not bans. | Avoid obvious painter→vision, grave→mortality, ruins→memory, road→journey shortcuts without forbidding earned use. | Gatherer marks them; Synthesizer distrusts low-resistance meaning. |
| D-039 | LOCKED | Causality must be legible before omission. | Avoid arbitrary literary opacity. | Motive/emotion/aftermath may remain unstated; basic event should remain readable. |
| D-040 | LOCKED | Ending should leave residue, not explain theme. | Repeated failure of “meaningful” LLM endings. | Stop after a material/social/practical shift. |
| D-041 | LOCKED | Current date/location do not authorize current weather, crowds, openings, prices, traffic, events or customs. | Factual-discipline rule. | Unknown conditions remain unknown. |

---

## E. Context and token architecture

| ID | Status | Decision | Reason | Consequence |
|---|---|---|---|---|
| D-050 | LOCKED | Preferred production is two one-shot direct model calls. | Claude Code token-burn evidence + token-optimization analysis. | No LLM tool loop in normal run. |
| D-051 | LOCKED | Gatherer and Synthesizer do not share model history in strict mode. | Research contamination/factual boundary. | Create new model request/context for Synthesizer. |
| D-052 | LOCKED | Synthesizer does not receive raw/rejected candidates, source snippets, tool traces or Gatherer reasoning. | Information topology is part of the method. | Build compact payload deterministically. |
| D-053 | LOCKED | No vector DB. | Static role files are known exactly; there is no semantic retrieval problem. | Store/load role files directly. |
| D-054 | LOCKED | LangChain/LangGraph are not required for the web app. | Workflow is small and deterministic; plain TypeScript suffices. | Frameworks remain optional integration hosts for the portable skill. |
| D-055 | CURRENT DEFAULT | Gatherer may use a cheaper/smaller model if evals pass; Synthesizer may use stronger model. | Asymmetric task difficulty/cost. | Model IDs remain provider-configurable. |
| D-056 | SUPERSEDED | Fixed temperature ranges from app handoff v2. | Not validated across models/providers and less meaningful than eval-based tuning. | Treat sampling/model settings as evaluation variables. |
| D-057 | LOCKED | One retry maximum for invalid Gatherer/Synthesizer stage. | Bound cost and preserve causality. | Retry only failed stage. |
| D-058 | LOCKED | Coding-agent hosts are supported but not preferred production runtime. | Massive host context can dominate token cost. | Claude/Codex/Hermes adapters should use lean one-turn child calls. |

---

## F. Movement and route

| ID | Status | Decision | Reason | Consequence |
|---|---|---|---|---|
| D-060 | LOCKED | Movement is deterministic software work. | Geometry/routing should not be language-model inference. | App obtains matrix/directions. |
| D-061 | LOCKED | One selected place → movement state `NONE`. | No reason to fabricate route. | No route line. |
| D-062 | LOCKED | Multiple points without confirmed pedestrian route → `RELATIONAL_UNVERIFIED`. | Truthful fallback. | Dashed/faint relation only; Synthesizer cannot claim walkability. |
| D-063 | LOCKED FOR APP | `VERIFIED` in Nearby Field requires successful routing-provider evidence for exact ordered points. | Harpers manual `VERIFIED` exposed ambiguity; app has a real router available. | Solid route only from route adapter response. |
| D-064 | CURRENT DEFAULT | Start at selected place nearest anchor; compare all open permutations for ≤5 points. | Small N makes exhaustive comparison trivial and deterministic. | Use route matrix cost, then final geometry. |
| D-065 | OPEN | Optimize primary cost by distance vs duration. | Both are defensible. | Initial default remains distance; evaluate. |
| D-066 | CURRENT DEFAULT | openrouteservice for v1, Valhalla as future/self-host option. | Explicit pedestrian profiles and usable matrix/directions APIs. | Provider adapter required. |

---

## G. App visual/experiential system

| ID | Status | Decision | Reason | Consequence |
|---|---|---|---|---|
| D-070 | LOCKED | Two visual regimes: orientation → field. | Search must stay easy; artwork can transform afterward. | Do not make entry map cryptic. |
| D-071 | LOCKED | Candidate field is visibly geographic. | Selection process is part of artwork. | Radius and candidate points appear at real coordinates. |
| D-072 | LOCKED | Rejected candidates remain barely visible after selection. | Field should not collapse into only chosen landmarks. | Final opacity ~5–9% starting range. |
| D-073 | LOCKED | Provisional/unverified relation and verified route have distinct line grammar. | Truthful cartographic semantics. | Dashed/faint vs solid/continuous. |
| D-074 | LOCKED | Loader reflects actual system events and never exposes chain-of-thought. | Processing itself is artistic material, but must be truthful. | Real state copy only. |
| D-075 | LOCKED | Synthesizer text is not token-streamed. | Final text should arrive as a composed object. | Typographic-measure loader occupies synthesis wait. |
| D-076 | LOCKED | Map⇄prose links are subtle and bidirectional. | Owner explicitly liked this. | App structured output requires bindings. |
| D-077 | LOCKED | Provenance is separate from prose. | Avoid Wikipedia-link contamination and dashboard/exposition. | Discreet provenance mode/action. |
| D-078 | CURRENT DEFAULT | Near-black, reduced off-white cartography, one restrained signal accent. | Fits established artwork direction and benchmark study. | No multi-color POI zoo. |
| D-079 | CURRENT DEFAULT | Recursive variable Sans/Mono prototype typography. | One open-source family can differentiate literary prose vs system microtext. | Must be tested on actual screens. |
| D-080 | OPEN | Accent color family. | Cool pale default vs dry warm/other low-saturation alternatives not tested. | A/B visually. |
| D-081 | OPEN | Procedural texture. | Could deepen cartographic authorship but must not become decoration/noise. | First prototype must succeed without it. |
| D-082 | OPEN | Paragraph alignment. | Centered vs map-grid-aligned both plausible. | Prototype. |

---

## H. App technology / deployment

| ID | Status | Decision | Reason | Consequence |
|---|---|---|---|---|
| D-090 | CURRENT DEFAULT | React + TypeScript + Vite. | Clear async/state/component organization; aesthetic is custom, not framework-derived. | Avoid generic component library visual defaults. |
| D-091 | CURRENT DEFAULT | Explicit state machine: XState or typed equivalent. | Many recoverable async states. | Do not scatter state across booleans. |
| D-092 | CURRENT DEFAULT | MapLibre GL JS. | Open vector rendering with style/layer/camera/GeoJSON control. | Custom authored cartography. |
| D-093 | CURRENT DEFAULT | Maputnik for style authoring. | Visual editing of MapLibre style JSON. | Development-time only. |
| D-094 | CURRENT DEFAULT | OpenFreeMap prototype basemap. | Easy MapLibre-compatible start. | Keep basemap provider replaceable. |
| D-095 | CURRENT DEFAULT | Cloudflare Worker edge/API. | Secrets, model calls, route/geocode adapters, validation, stream events. | No secrets in browser bundle. |
| D-096 | LOCKED | GitHub Pages hosts static frontend. | Original product target. | Worker is separate backend. |
| D-097 | LOCKED | No persistent DB/account/history in v1. | Keep artwork immediate/minimal. | Optional caches only. |
| D-098 | CURRENT DEFAULT | SSE or streamed fetch for stage events. | UI needs true processing states, not token streaming. | Events carry stage/state, not reasoning. |

---

## I. Agent Skills / portability

| ID | Status | Decision | Reason | Consequence |
|---|---|---|---|---|
| D-100 | LOCKED | Canonical skill follows Agent Skills open standard. | Cross-product reuse and current convention. | `SKILL.md` + focused references/scripts/schemas. |
| D-101 | LOCKED | Canonical skill stays host-neutral. | Portability. | Host-specific adapter files remain outside core or as host-added extras. |
| D-102 | EVIDENCE | ChatGPT export preserves all 21 v7 core files byte-identically and adds `agents/openai.yaml` + icon. | Direct artifact comparison. | OpenAI wrapper is an adapter, not a behavioral fork. |
| D-103 | LOCKED | Nearby Field does not need runtime skill discovery/progressive activation. | The app knows one skill exactly; discovery overhead has no value. | Load/compile role instructions directly. |
| D-104 | CURRENT DEFAULT | `.agents/skills/` is a cross-client installation convention, not part of the formal directory-content spec. | Current Agent Skills client implementation guide. | Mention in portability docs, do not encode into skill behavior. |
