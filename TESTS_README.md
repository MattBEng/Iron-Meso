# Lift Daddy — test suite

Automated checks that run the real `index.html` in a headless DOM.
They exist so a change in one place can't silently break another.

All test files live in the **repo root**, prefixed `TESTS_` so they sit
alongside `index.html` and can be copied in one go — no subfolder.

## Running

```bash
npm install jsdom          # once
node TESTS_run-all.js      # run everything
node TESTS_ramp.js         # run one suite
```

## Suites

| File | Covers |
|---|---|
| `TESTS_progression.js` | Load suggestions, bodyweight reps-progression, weighted-bodyweight, held-weight plateau detection, AMRAP/myorep exclusion |
| `TESTS_ramp.js` | Volume ramp: priority ceilings (High/Normal/Low), meso-length awareness, repeat runs, deload, ramp-off, legacy fallback |
| `TESTS_workout.js` | Rendering, logging, finish flow (duration + date), date correctness, cardio capture, editing past logs, the editability window |
| `TESTS_features.js` | Set types, setup notes, workout notes, bodyweight rows, timed holds, gender options, rest-over messages |
| `TESTS_data.js` | Local-date handling (the UTC bug), storage round-trip, meso creation defaults, schema |
| `TESTS_integrity.js` | Export/import round-trip, checksum tampering, legacy imports, schema migration, corrupt-state rejection |
| `TESTS_edge.js` | Empty states, set add/duplicate/delete, input clamping, empty-workout discard, timed exercises not polluting lifting stats |
| `TESTS_loadrep.js` | Load–rep prediction accuracy, the "??" trusted band, per-exercise weight steps, the jump-aware rep ceiling, never-both-at-once, live re-prediction |
| `TESTS_skip.js` | Skipping a workout — meso advances, markers stay out of streaks/stats/editing |
| `TESTS_schemes.js` | Fun colour schemes — four options, single-select, Fun-mode gating, persistence |
| `TESTS_welcome.js` | Welcome-back messages — the 30-message bank, gap tiering, and the Fun+Female gate |
| `TESTS_flows.js` | "Can't add weight", repeating a meso, the priority lock, feedback-driven progression, cardio zones, workout picker |
| `TESTS_lib.js` | Shared harness — `boot()`, `ok()`, `run()` and helpers |

## Writing a new suite

Name it `TESTS_<area>.js` in the repo root — `TESTS_run-all.js` picks it up
automatically.

```js
const {boot, ok, run}=require("./TESTS_lib");
const A=boot();

run("my area", ()=>{
  const {w,$,click,st,ev,makeMeso}=A;
  A.clearTemplates();
  makeMeso([{id:"s1", exerciseId:"b_back_squat", sets:3, reps:10, rir:2, rest:60}]);
  w.go("workout");
  ok("something is true", !!$(".wk-header"));
});
```

Helpers on the object returned by `boot()`:

- `$ / $$ / click / inp / change` — DOM shortcuts
- `st()` — live app state, `save()` — persist
- `ev("expr")` — evaluate an expression inside the app
- `clearTemplates()` — drop the seeded starter templates so `mesocycles[0]` is yours
- `makeMeso(slots, extra)` — build and activate a simple meso
- `logSets(exIdx, kg, reps)` — mark every set logged
- `finish(dateOverride)` — walk the whole finish flow
- `pushLog(exerciseId, sets, opts)` — inject history

## Gotchas learned the hard way

- **Clear the templates first.** Fresh installs seed archived starter mesos, so
  `mesocycles[0]` is not your test meso unless you call `clearTemplates()`.
- **Re-query DOM nodes after any action** that re-renders a card — old
  references go stale.
- **Adding an exercise opens the target editor**, so click `[data-ok]` to dismiss
  it before continuing.
- **The finish flow has three steps**: duration+date prompt → feedback survey →
  Fun-mode celebrate. `finish()` handles all three.
- **jsdom doesn't fire `popstate` asynchronously** by default. For back-button
  tests, override `w.history.back` to dispatch `popstate` in a `setTimeout`.
- Set `activeSession=null` after changing a meso, or you'll test a stale session.
