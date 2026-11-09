# DESIGN-LOG: Ages of Rule (PoliticalMapApp redesign)

Bounded DADA run, 9 Nov 2026. **Incomplete under the bound:** no Traversal Plan, Decision Records or Anchor Ledger were
written, the seed graph was not walked, and one panel round was convened (3 seats, not the Landing minimum of 4).
Everything below is what was actually done. Human grade: **B** ("pretty good").

## Brief and run type

Redesign the site "with dada" to be a much better timeline of governance systems. Mode: **Adaptive** (public audience).
Run type: **Full** (redesign) with the **Landing** rule applied to the first screen. Tools: Playwright (headless
Chromium) for measurement, three subagent seats filing to a panel directory, no graph or workflow tooling used.

## R0 premortem (by measurement, not by panel)

The inherited site did not load: `index.html` linked `style.css` (the file is `styles.css`) and fetched
`political_systems.json` (the file is `dead-political.json`). The data held 9 ended systems and stored Athens
(508 to 322) and the Roman Republic (509 to 27) as positive years, so those bars ran backwards.

## Moves taken (no Decision Records were written; see Compliance)

| Move | Type | Measured |
|---|---|---|
| Multi-page structure: home, timeline, index, system pages, about | BREAK | 5 pages, 0 console errors, no horizontal overflow at 1280 and 375 |
| Landing graphic: stacked skyline of systems alive per year, draggable year marker | BREAK | #sky + #legend bottom edge y=471 at 1280x800 and y=622 at 375x812, both above the fold |
| Data from 9 to 56 systems, ongoing systems, BCE years fixed | KEEP-THE-RULE | `scripts/check-data.mjs` OK |
| Dependency-free SVG instead of the D3 CDN script | KEEP-THE-RULE | works offline |

## Panel Reports

### Panel, WHOLE, round R1  (artifact examined: http://localhost:8123 index, timeline, systems, system, about)
| Critic | Anchor used | Observed in the work | Verdict PASS/OBJECT | Requested change |
|---|---|---|---|---|
| Critic: Usability (Krug) | Don't Make Me Think | five-second test and legibility probe pass on index; timeline key colours do not match bars | PASS with objections F1 F3 F4 F7 | fix key, mobile CTA, unlabeled bars |
| Critic: Evidence (Cairo) | The Truthful Art | first screen, contrast 4.58:1 worst, figures recompute; "Peak (1790)" sampled by decade, true peak 1795 | OBJECT | compute the peak at the data's resolution |
| Critic: Provocateur (Debord) | The Society of the Spectacle | hero states no limits; types mixed with states; one family per system flatters | OBJECT | print limits on the landing; relabel families |

Seats were briefed from short hand-written prompts, not from `seats/<id>.md`, so persona hashes are not recorded.
All three verdict files landed in the panel directory (3 of 3 REPORTED). Arnheim, the Landing run's fourth seat, did not sit.

## Resolutions

| Seat(s): finding | Outcome |
|---|---|
| Cairo: "Peak (1790)" is a decade-sampling artefact, true peak is 1795 | ADAPT: peak and printed figures computed at step 1 |
| Cairo: Egypt duration should be 3,121 (no year 0) | OVERRULE (premise refuted: both dates are BCE, so the span does not cross year 0 and 3,120 is correct) |
| Cairo: "systems alive" counts presence, not size, and should say so | ADAPT: caveat printed beside the chart |
| Cairo: bars are below the 44px comfort target | DEFERRED: meets the 24px AA minimum |
| Debord: limits (Europe-heavy, types mixed with states) are one click from the hero | ADAPT: caveat line on the landing |
| Debord: unsourced characterisations in the data | ADAPT: three softened |
| Debord: one family per system flatters (Confederacy, apartheid, Athens) | DEFERRED: descriptions reworded, categories unchanged, objection still open |
| Debord: family id `federal` disagrees with its label | DEFERRED |
| Krug: timeline key shows blue for red and orange bars | ADAPT: key drawn in a neutral ink |
| Krug: bars clipped and unlabeled at whole-record zoom | ADAPT: packing reserves room for outside labels |
| Krug: duplicated words (family name twice, logo and H1) | ADAPT: breadcrumb trimmed |
| Krug: mobile CTA buttons below the fold | DEFERRED: the graphic, not the CTA, is the first-screen rule |
| Krug: marker is a thin drag target | DEFERRED: jump buttons and keyboard control are the alternative |

## Extend step, not panel-judged

After the grade, 166 countries from CountryData (148 current, 18 historical) were added behind a one-click toggle by
`scripts/import-countrydata.py`. Landing bottom edge stayed at y=437 and y=502 for the chart with the toggle off. This
step had no panel round and is not in the ledger.

## Stop test

S1 not met (deferred items open). S2 not met (Debord OBJECT stands). S3 not met (one round). S4 not met as logged: the
Breaker was not escalated in a recorded move. S5 not checked.

## Double loop

The panel failed the work less than the process did: the three seats found one real defect (the sampled peak) and one
framing problem, and nothing judged the fixes afterwards. Graph amendment: none proposed.

## Carry-Forward Ledger

- A figure that names an extremum ("peak", "longest", "most") is computed at the data's resolution, not the chart's.
- Adding a large dataset to a signature graphic flattens it; keep the calm default and make density one click.
- A legend or key is drawn from the same tokens as the marks, never from hand-picked colours.
- An importer that cannot read a field skips the record and lists it; it never fills in a plausible value.

## Compliance Check

- [ ] Tooling inventory done: Playwright only; no graph tooling checked
- [x] Mode stated with the reason (Adaptive: public audience)
- [ ] Panel seated from `pick_panel.py`: not run, seats chosen by hand from the Landing minimum
- [ ] Seed with exact labels and a dotted-edge counterpoint: not done
- [x] Run type stated (Full + Landing), no freeze broken
- [x] Landing leads with one bold graphic, complete above the fold at 1280x800 and 375x812
- [ ] BREAK move recorded in a Decision Record: moves taken, records not written
- [ ] Decision Record per move: not written
- [x] Panel Report with observable evidence per critic
- [x] Every OBJECT resolved ADAPT, OVERRULE or DEFERRED
- [ ] WHOLE rounds and S1 to S5: one round, stop test not met
- [x] Printed figures re-measured at the final state (Cairo F5 recomputed them; peak corrected afterwards)
- [ ] Anchor Ledger and live graph: not done
- [x] Double-loop paragraph written
- [ ] Run recorded in the ledger: done afterwards from this file with the grade
- [x] Final reply states mode, tools, stop conditions and what was skipped
