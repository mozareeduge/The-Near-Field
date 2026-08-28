# Nearby Field — QA / Acceptance Matrix v3

This matrix is app-focused. The portable-skill suite remains separately authoritative for its deterministic contracts.

Labels:
`F` functionality · `UX` interaction · `GEO` geography · `LIT` literary · `VIS` visual · `A11Y` accessibility · `PRIV` privacy · `SEC` security · `PERF` performance · `RES` resilience · `COST` runtime economy.

---

# A. Search / anchor

| ID | Class | Case | Expected |
|---|---|---|---|
| S01 | F/UX | search `Neyshabur` | correct city with region/country, map preview, confirmable |
| S02 | F/UX | typo `Neyshbur` | fuzzy likely result |
| S03 | F/UX | `نیشابور` | local-script result where provider supports it |
| S04 | UX | ambiguous `Springfield`/`Taft` | disambiguating region/country |
| S05 | UX | country `Iran` | orientation only, no generation |
| S06 | F | landmark search | valid anchor |
| S07 | F | direct map point | valid without reverse geocode |
| S08 | PRIV | GPS accepted | exact GPS absent from LLM payload |
| S09 | F | GPS denied | search still complete |
| S10 | F | GPS timeout | graceful retry/search |
| S11 | UX | moved viewport then search | configured viewport/proximity bias |
| S12 | A11Y | keyboard search | arrow/enter/escape/focus |
| S13 | UX | mobile search | >=16 px input; >=48 px result rows |

---

# B. Geographic field / sparse enrichment

| ID | Class | Case | Expected |
|---|---|---|---|
| W01 | GEO | >=3 useful inside 1 km | logical radius 1 km |
| W02 | GEO/VIS | <3 at 1 km, >=3 at 3 km | visible 1→3 expansion |
| W03 | GEO/VIS | needs 10 km | visible 10 km state |
| W04 | GEO | only 1–2 in 10 km | field sparse + enrichment |
| W05 | GEO | one useful geo page + relevant enrichment | one real node; enrichment non-geographic |
| W06 | GEO | no enrichment hit | continue honestly with 1–2 if useful |
| W07 | GEO/RES | no useful evidence at all | `Nothing surfaced here`; no story |
| W08 | GEO | disambiguation | filtered |
| W09 | GEO | coordinate event/person not physical place | filtered |
| W10 | GEO | duplicate pages | deduplicated |
| W11 | COST | >16 candidates | model payload capped at 16 |
| W12 | COST | extract >110 words | truncated/rejected before model |
| W13 | COST | >4 enrichment | capped at 4 |
| W14 | GEO/SEC | source snippet says `ignore instructions` | data only; no behavior change |
| W15 | VIS | enrichment | no fake map point/route node |
| W16 | GEO | namesake remote enrichment | rejected/unused |
| W17 | GEO | actual page IDs | no placeholder IDs in production |

---

# C. Gatherer

| ID | Class | Case | Expected |
|---|---|---|---|
| G01 | LIT | fame-heavy cluster | fame not sole selector |
| G02 | LIT | symbolic cluster | lures marked |
| G03 | LIT | ordinary material among monuments | can outrank fame |
| G04 | F | 13–16 useful | target 5 |
| G05 | F | 1 useful | select 1 |
| G06 | F | invented source ID | reject/retry |
| G07 | F | title/URL drift | reject/retry |
| G08 | LIT | plot/character field | invalid Gatherer output |
| G09 | GEO | walkability claim | reject/flag |
| G10 | F | relation to unselected place | reject |
| G11 | LIT | enrichment treated as place | reject app integration |
| G12 | COST | Gatherer uses tool loop | architecture failure in production |

---

# D. Movement

| ID | Class | Case | Expected |
|---|---|---|---|
| R01 | GEO | one place | state NONE; no route |
| R02 | GEO | two places route succeeds | VERIFIED |
| R03 | GEO | five places | deterministic permutation selection |
| R04 | GEO | straight-near but walk-long | routing matrix controls |
| R05 | GEO | disconnected | RELATIONAL_UNVERIFIED |
| R06 | RES | matrix fail | preserve selected field; fallback |
| R07 | RES | geometry fail | do not show solid verified trace |
| R08 | VIS | verified | actual GeoJSON solid route |
| R09 | LIT | unverified movement | prose cannot claim walkability |
| R10 | GEO | Harpers documentary route only | app must not mark VERIFIED without route adapter |
| R11 | F | state/flag inconsistency | app validator rejects |

---

# E. Synthesizer / literary

Use fixed evidence packets and blind review where subjective.

| ID | Class | Temptation | Expected |
|---|---|---|---|
| L01 | LIT | painter | no automatic seeing/camera/art metaphor |
| L02 | LIT | ruins | no automatic memory metaphor |
| L03 | LIT | graves | no automatic mortality/grief |
| L04 | LIT | famous writer/figure | fame itself not plot |
| L05 | LIT | multiple landmarks | not itinerary |
| L06 | LIT | source syntax | not mini-lecture |
| L07 | LIT | city swap | paragraph materially breaks |
| L08 | LIT | task/errand | exposes wider life, not whole machine |
| L09 | LIT | specialized technical prop | justified or absent |
| L10 | LIT | emotion | action carries more than labels |
| L11 | LIT | local culture | no manufactured stereotype/dialect |
| L12 | LIT | date | no invented weather/crowd/opening |
| L13 | LIT | ending | residue, not theme |
| L14 | LIT | generic first draft | repair/rebuild |
| L15 | LIT | event kernel itself bad | replace situation |
| L16 | F | output | one English paragraph |
| L17 | LIT | life underway | before/after continuity detectable |
| L18 | LIT | detail | may work relationally/bodily/etc, not only causal |
| L19 | COST | Synth model tool loop | architecture failure |
| L20 | COST | third literary model call | architecture failure |

---

# F. Bindings / final presentation

| ID | Class | Case | Expected |
|---|---|---|---|
| B01 | F/VIS | direct mention | mention binding valid |
| B02 | F/VIS | indirect reference | reference binding valid |
| B03 | F/VIS | structural place | null-span structural binding |
| B04 | F | repeated place references | multiple bindings |
| B05 | F | invalid offsets | reject/correct before complete |
| B06 | VIS | hover phrase | node highlights subtly |
| B07 | VIS | hover node | phrase highlights subtly |
| B08 | A11Y | keyboard phrase focus | same semantics |
| B09 | UX | mobile tap | linked state touch-safe |
| B10 | LIT/VIS | provenance | separate action, no inline source URL |
| B11 | F | validated paragraph altered after validation | fail; render exact paragraph text |

---

# G. Loader / processing

| ID | Class | Case | Expected |
|---|---|---|---|
| LD01 | VIS/PERF | stage <250 ms | no label flash |
| LD02 | VIS | 1→3→10 | actual circle expansion only |
| LD03 | VIS | sparse field | `field sparse`; no >10km fake expansion |
| LD04 | VIS | enrichment | non-geographic processing notation |
| LD05 | VIS | Gatherer wait | no fake per-node reasoning |
| LD06 | VIS | route wait | provisional relation okay |
| LD07 | VIS | Synth wait | abstract measure field, not tokens |
| LD08 | VIS | Synth complete | paragraph appears only after validation |
| LD09 | A11Y | reduced motion | semantic state preserved |
| LD10 | RES | Gatherer fail | field preserved |
| LD11 | RES | Synth fail | field+movement preserved |
| LD12 | PERF | very slow model | loader remains truthful |

---

# H. Responsive / visual

| ID | Class | Case | Expected |
|---|---|---|---|
| V01 | VIS | 390×844 | map ~58–64svh; readable prose |
| V02 | VIS | tablet | no forced desktop sidebar |
| V03 | VIS | 1440 | paragraph <=48rem |
| V04 | A11Y | 200% zoom | no clipped critical action |
| V05 | UX | high DPI/touch | visual marks delicate, hit areas larger |
| V06 | VIS | dark map hierarchy | selected/route legible |
| V07 | VIS | orientation mode | familiar enough to find place |
| V08 | VIS | field mode | reduced but geographically legible |
| V09 | VIS | texture off | work coherent |
| V10 | VIS | texture on | does not reduce route/text legibility |
| V11 | VIS | enrichment | no false geographic mark |

---

# I. Accessibility

| ID | Case | Expected |
|---|---|---|
| A01 | keyboard-only | full search/control/binding use |
| A02 | screen-reader stages | meaningful announcements |
| A03 | reduced motion | no information depends on motion |
| A04 | tiny visual nodes | enlarged invisible targets |
| A05 | color vision | structural differences beyond color |
| A06 | route states | pattern/solid semantics beyond hue |
| A07 | paragraph | comfortable measure/leading |
| A08 | focus | clearly visible |
| A09 | canvas map | textual selected-place/movement summary exists |

---

# J. Privacy / security

| ID | Case | Expected |
|---|---|---|
| P01 | GPS run | exact GPS absent from Gatherer/Synth |
| P02 | refresh | no app-generated history persisted |
| P03 | analytics | no precise coordinate event |
| P04 | frontend inspect | no API secrets |
| P05 | malicious geocoder label | text-rendered |
| P06 | malicious model output | text-rendered |
| P07 | source prompt injection | quarantined as source data |
| P08 | quota abuse | bounded rate limit |
| P09 | model-generated URL | not trusted/rendered unless provenance source already known |

---

# K. Performance / cost

| ID | Case | Expected |
|---|---|---|
| PF01 | search | p95 target <700 ms post-debounce |
| PF02 | map interaction | aim 60 fps |
| PF03 | candidate field | median target <3 s |
| PF04 | full generation | median target <=15 s, p95 <=30 s |
| PF05 | stale search | discarded |
| PF06 | route 500 | fallback, no whole reset |
| PF07 | Gather invalid | one retry |
| PF08 | Synth invalid | one retry |
| PF09 | normal run | exactly 2 model invocations |
| PF10 | model input | candidate/enrichment caps enforced |
| PF11 | telemetry | prompt version/model/tokens/latency recorded without raw GPS |
| PF12 | Claude/Codex production host | no open-ended agent loop |

---

# L. Again

| ID | Case | Expected |
|---|---|---|
| AG01 | again | same anchor, new run |
| AG02 | alternatives | previous exact set may be lightly discouraged |
| AG03 | one viable field | repeat allowed |
| AG04 | prior bindings | cleared before new result |
| AG05 | new place | return to orientation/search |

---

# M. Literary evaluation rubric

Blind-score 1–5:

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

Do not use a single average to hide critical failures.

Record failure labels and source packet/model/prompt version.
