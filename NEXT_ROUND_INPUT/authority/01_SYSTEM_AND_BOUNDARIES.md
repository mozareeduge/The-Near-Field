# System and Boundary Map

## 1. Two artifacts, one behavioral lineage

### Nearby Narrative
A portable Agent Skill.

It answers:

> Given a real location or prepared local evidence field, how should an agent construct one grounded fictional paragraph?

It owns:
- evidence selection behavior;
- literary transformation rules;
- context separation;
- portable schemas/scripts;
- failure semantics;
- model-role boundaries.

It does not own:
- map visuals;
- place-search UI;
- animation;
- browser location permission;
- route rendering;
- web layout.

### Nearby Field
A location-driven web artwork/product.

It answers:

> How does a person find a place, watch the local field constitute itself, and encounter the generated paragraph as a spatial/temporal work?

It owns:
- map/search/geolocation;
- visible geographic field;
- processing choreography;
- movement visualization;
- map⇄prose binding interaction;
- visual/typographic system;
- browser/edge architecture;
- app-specific validation and privacy.

---

## 2. The integration boundary

```text
WEB APP / ORCHESTRATOR
    │
    ├─ anchor
    ├─ regional context
    ├─ candidate pages
    └─ enrichment evidence
    │
    ▼
GATHERER CALL
    │
    ▼
validated Gatherer packet
    │
    ├─ deterministic movement
    ▼
SYNTHESIZER CALL
    │
    ▼
paragraph + app metadata
```

The portable skill stays host-neutral.

The app is allowed to make the portable contract **stricter** where its experience needs it—for example, requiring prose/map bindings—but must not weaken factual/literary boundaries.

---

## 3. Model/context topology

Preferred strict runtime:

```text
CALL 1
static = exact v7 Gatherer instructions
dynamic = bounded geographic field + optional enrichment

CALL 2
static = exact v7 Synthesizer instructions
       + tiny Nearby Field output-metadata extension
dynamic = selected evidence + movement + date/region

NO SHARED CHAT HISTORY
```

The app orchestrator owns:
- tool/API calls;
- retries;
- schema validation;
- route computation;
- source capping;
- UI state events.

The model does not decide which API to call.

---

## 4. Geographic truth boundary

Three distinct spatial object classes must never be collapsed:

### Anchor
The user's confirmed place/point.

### Geographic candidate / selected place
A coordinate-bearing nearby Wikipedia page that can appear as a real map node.

### Enrichment evidence
A non-route Wikipedia passage explicitly linked to the anchor/place. It enriches literary material but **has no invented map coordinate**.

This distinction was formalized after the Taft test.

---

## 5. Movement truth boundary

App movement states:

```text
NONE
  exactly one selected geographic place

VERIFIED
  pedestrian routing provider returned a successful route for the exact ordered points

RELATIONAL_UNVERIFIED
  coordinate/order relationship exists but no verified pedestrian route
```

For the web app, `VERIFIED` should be stricter than the manual Harpers Ferry demonstration: documentary route research or coordinate proximity alone is insufficient for the solid verified route state.

---

## 6. Literary truth boundary

### Supplied real-place evidence
May support factual statements about the place.

### Fictional connective tissue
May invent:
- people;
- ordinary objects;
- dialogue;
- relationships;
- events.

It may not invent:
- current weather/crowds/opening;
- unsupported local customs;
- fake regional authenticity;
- specialized technical/local practices solely to sound specific.

---

## 7. Presentation boundary

The validated paragraph is the literary object.

Provenance, sources, process data, and links are separate interface layers.

Do not append Wikipedia links into the paragraph itself.

This matters because the Harpers Ferry demonstration's outer ChatGPT response added a source link after the validated paragraph; that wrapper was not the validated narrative artifact.

---

## 8. Agent Skills standard boundary

The current open Agent Skills standard defines a portable folder with `SKILL.md` plus optional scripts/references/assets and other directories.

Nearby Narrative uses that as interchange packaging.

Nearby Field does **not** need to implement skill discovery/progressive activation at runtime because it already knows exactly which skill it hosts. It can compile/load the two role files directly.

This avoids unnecessary model/token overhead while preserving the same canonical behavior.
