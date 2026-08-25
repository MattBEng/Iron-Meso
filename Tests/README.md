# Lift Daddy — test suite

Automated checks that run the real `index.html` in a headless DOM.
They exist so a change in one place can't silently break another.

## Running

```bash
npm install jsdom      # once
node tests/run-all.js  # run everything
node tests/t-ramp.js   # run one suite
```

Run from the repo root — the harness loads `../index.html` relative to
this folder.

## Suites

| File | Covers |
|---|---|
| `t-progression.js` | Load suggestions, bodyweight reps-progression, weighted-bodyweight, held-weight plateau detection, AMRAP/myorep exclusion |
| `t-ramp.js` | Volume ramp: priority ceilings (High/Normal/Low), meso-length awareness, repeat runs, deload, ramp-off, legacy fallback |
| `t-workout.js` | Rendering, logging, finish flow (duration + date), date correctness, cardio capture, editing past logs, the editability window |
| `t-features.js` | Set types, setup notes, workout notes, bodyweight rows, timed holds, gender options, rest-over messages |
| `t-data.js` | Local-date handling (the UTC bug), storage round-trip, meso creation defaults, schema |
| `t-integrity.js` | Export/import round-trip, checksum tampering, legacy imports, schema migration, corrupt-state rejection |
| `t-edge.js` | Empty states, set add/duplicate/delete, input clamping, empty-workout discard, timed exercises not polluting lifting stats |
| `t-flows.js` | "Can't add weight", repeating a meso, the priority lock, feedback-driven progression, cardio zones, workout picker |
| `lib.js` | Shared harness — `boot()`, `ok()`, `run()` and helpers |

## Writing a new suite

```js
const {boot, ok, run}=require("./lib");
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
