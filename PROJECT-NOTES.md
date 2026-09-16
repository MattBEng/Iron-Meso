# Lift Daddy — working notes

**Read this first.** It is written for whoever picks the project up next,
including an AI session with no memory of earlier work. It covers what the app
is, how to change it safely, the domain rules that are easy to get wrong, and
the decisions already settled. Keep it current — it is cheaper than re-deriving
everything.

---

## 1. What this is

A single-file, offline-first PWA for hypertrophy training: mesocycle
programming, RIR-based autoregulated progression, and logging. Modelled on the
Renaissance Periodization app but warmer and jargon-free.

It is **one person's personal training tracker** (Matt's), not a product. There
is no backend, no accounts, no users but him. Decisions should favour *his*
workflow over generality.

- **Live:** https://lift-daddy.pages.dev/
- **Hosting:** Cloudflare Pages, git-connected to GitHub (user `mattbeng`).
  Framework preset *None*, build command *blank*, output dir `/`.
  Push to the repo → auto-deploys in about a minute.
- **Install:** Android Chrome → ⋮ → Add to Home screen. Data is `localStorage`
  per-origin, so it lives on one device; move it with Settings → Export/Import.

---

## 2. Repo layout

Everything is flat in the repo root. There are no subfolders and no build step.

| Path | What it is |
|---|---|
| `index.html` | **The entire app.** One self-contained file (~260 KB): HTML, CSS and one big `<script>`. |
| `sw.js` | Service worker. Network-first for the HTML shell so updates propagate. |
| `_headers` | Cloudflare cache headers. |
| `icon-*.png` | App icons (coral "LD"), including maskable variants. |
| `PROJECT-NOTES.md` | This file. |
| `PROGRESSION-MODEL.md` | **The science behind the progression maths** — equations, evidence, worked examples, the "??" band, the jump-aware ceiling. Read before touching the engine. |
| `MESSAGES.txt` | **All the cute/Fun-mode message banks, in plain text.** Edit this, not `index.html`. |
| `MESSAGES_build.js` | Injects `MESSAGES.txt` into `index.html`. Run after editing messages. |
| `TESTS_*.js` | Test suite, flat in the root. `TESTS_lib.js` is the harness, `TESTS_run-all.js` the runner, the rest are suites. See `TESTS_README.md`. |

There is **no `manifest.json`** — the PWA manifest is embedded in `index.html`
as a `data:` URI. Don't go looking for it.

---

## 3. How to work on this

### The loop

1. Make the change in `index.html`.
2. Check the JavaScript still parses (see below) — a syntax error bricks the
   whole app, and it is one file.
3. If you edited `MESSAGES.txt`, run `node MESSAGES_build.js`.
4. Run the tests: `node TESTS_run-all.js`.
5. Bump the `BUILD` stamp in `sw.js`.
6. Hand over `index.html` + `sw.js` (+ any test/doc files) to be committed.

### Checking the JS parses

The app is one `<script>` block. Extract and syntax-check it:

```bash
python3 -c "import re;open('check.js','w').write(re.search(r'<script>(.*)</script>',open('index.html').read(),re.S).group(1))" \
  && node --check check.js && echo "JS OK"
```

### Editing safely

`index.html` is far too large to rewrite wholesale. Use targeted string
replacement, and **never write a partial patch**. The pattern that has worked:

```python
h=open('index.html').read()
misses=[]
def rep(label, old, new):
    global h
    if old not in h: misses.append(label); return
    h=h.replace(old, new, 1)

rep("thing-1", "<exact old text>", "<new text>")
rep("thing-2", "<exact old text>", "<new text>")

if misses: print("MISSES:", misses)          # write nothing
else: open('index.html','w').write(h); print("OK")
```

The all-or-nothing guard matters: a batch that half-applies leaves the file in a
state that is hard to reason about. If a label misses, fix the anchor and re-run
the **whole** batch — don't apply the rest separately and patch the straggler
after, which has caused confusion before.

### Running the tests

```bash
npm install jsdom      # once per environment
node TESTS_run-all.js  # everything
node TESTS_ramp.js     # one suite
```

The harness boots the real `index.html` in jsdom and drives the actual UI.
`TESTS_README.md` documents the helpers and the traps (stale DOM nodes after a
re-render, clearing seeded templates, the three-step finish flow, jsdom not
firing `popstate` asynchronously). **Read it before writing a test.**

Add a suite as `TESTS_<area>.js` in the root; the runner discovers it.

### Changing the cute / Fun-mode messages

All the message banks live in **`MESSAGES.txt`** — rest-over lines, the three
welcome-back tiers, cutie titles, stats messages and footers. Plain text, one
message per line under a `[SECTION]` heading, `#` for comments. Emoji,
apostrophes and quotes all work with no escaping.

```bash
# edit MESSAGES.txt, then:
node MESSAGES_build.js          # writes them into index.html
node MESSAGES_build.js --check  # report drift without changing anything
```

`MESSAGES.txt` is the **source of truth**; `index.html` is generated from it.
Don't hand-edit the banks in `index.html` — the next build overwrites them.

Why a build step rather than loading a text file at runtime: the app is one
self-contained offline file (§7), so it can't fetch anything. The injector keeps
the messages editable without breaking that. **`TESTS_messages.js` fails if you
edit the text and forget to rebuild**, so the gap can't ship silently.

Order only matters for `CUTIE LEVEL TITLES` (they unlock in sequence,
easiest first). Everything else is picked at random.

### Deploying

```bash
NEWSTAMP=$(date +%Y%m%d%H%M%S)
sed -i "s/const BUILD = \"[0-9]*\"/const BUILD = \"$NEWSTAMP\"/" sw.js
```

Without the bump, clients may keep serving the old shell. The app icon only
refreshes on remove + re-add (an OS limitation); code updates propagate
automatically with a ✨ toast.

### Working style that suits this project

- **Reproduce before fixing.** Several "bugs" here turned out to be something
  other than the reported symptom (see §6). Write a probe script, confirm the
  mechanism, then patch.
- **Test the fix, not just the feature.** Every bug fixed has a regression check.
- **Push back on specs that will misbehave.** The flat `+4` rep ceiling and the
  date-field ordering both looked reasonable and were wrong; saying so early
  saved rework.
- Don't add a second way to do something that already exists — consolidate
  (`repeatMeso` was duplicated inline before being extracted).

---

## 4. Architecture

All in one `<script>` in `index.html`.

- **`Store`** — state in `localStorage` under key **`ironmeso_v1`**
  (**do not rename** — it would orphan existing data). Debounced `save()` plus
  `flush()`, checksummed export/import, `validateState`. Exposed as
  `window.LiftDaddy` (alias `window.IronMeso`), which is what the tests drive.
- **`SCHEMA_VERSION`** with a migration chain. Add a migration whenever the shape
  of stored data changes; never mutate old data in place without one.
- **`ProgressionEngine.suggest()`** — the core. RIR-based and whole-workout
  aware. Handles assisted machines (inverted — less weight is progress),
  bodyweight (reps not load), loaded bodyweight (normal load progression),
  held-weight plateaus, and excludes AMRAP/myorep sets from its judgement.
- **Views** — hash-free router `go(name)` against a `VIEWS` registry: home,
  mesos, workout (*Train*), calendar (*History*), exercises, analytics (*Stats*),
  settings, mesosummary. Seven-tab bottom nav.
- **Modes** — Serious vs Fun (`FUN()`). Fun swaps RIR for a feel scale
  (😌/💪/🔥), plain language, encouragement. Fun **+ Female** (`cutieOn()`)
  additionally unlocks the cutie layer: the pink Stats card with its levelling
  title, and the tiered welcome-back card on Home.
- **Charts** — hand-rolled `ChartManager.draw()` on `<canvas>`. Bars are
  slot-centred and inset from the axes (an earlier version clipped the first and
  last bar).

---

## 5. Domain rules worth knowing

**Volume ramp.** Sets climb from `startSets` (default 2) to a per-muscle ceiling,
landing on the ceiling in the final *real* week (deload excluded), spread evenly.
The ceiling comes from `endTargetSets` (default 5) stepped down by priority:
**High = target, Normal = target − 1, Low (maintain) = target − 2.** Priority is
set at meso creation and **locked once the meso has any logged workout** (selects
disable; `collectBasics` skips disabled ones so a re-save can't clobber them). A
**repeat run** (`repeatRun: true`) starts one week in — a repeated 4-real-week
High muscle goes 3,4,5,5. When the set count holds week to week, load/rep
progression carries the session.

**Progression maths.** Load↔rep conversion averages **Epley and Brzycki**, applied
in both directions (individually they disagree ~25% at 12–15 reps and bracket the
truth from opposite sides). Predictions outside a trusted band (reps <3 or >25, or
load ≥ estimated 1RM) return `null` and render as **`??`** — never a fake number.
Weight and reps **never both increase**: held weight → +1 rep; raised weight →
fewer reps, predicted. The rep ceiling is **jump-aware** (`repCeilingFor`), derived
from each exercise's own smallest weight jump: a 5→7.5 kg lateral raise (+50%)
needs ~20 reps banked before the jump is possible, while a 100→102.5 kg squat
(+2.5%) should jump at ~10. Set the increment per exercise in the exercise editor.
Full reasoning and evidence in **`PROGRESSION-MODEL.md`**.

**Dates.** `todayISO()` uses **local** date components, never `toISOString()`
(that is UTC and shifts early-morning sessions to the previous day). A session
object is created merely by *opening the Train tab*, so its creation date is
**not** a reliable "start" — `sessionStartDate()` reads the first logged set's
timestamp instead. The finish prompt asks for date and duration together.

**Log editability.** Only the 6 most recent logs of the active meso are editable
(`logEditable()`), ordered by **creation order (`loggedAt`)**, never by the date
field — ordering by date created a catch-22 where a wrongly back-dated log fell
out of the window and could never be corrected.

**Skipped workouts.** Position in a meso is derived from its log count, so a skip
records a **marker log** (`skipped: true`, no exercises) to advance. Markers are
filtered out of streaks, the welcome-back gap, Stats, monthly rollups and the
progression history index; they can't be edited, show as a muted calendar dot,
and never appear as the Home "Last workout".

**Notes — three distinct levels.** (1) **Session note**, this workout only
(`session.notes`); (2) **Meso slot note**, 📌, specific to that plan;
(3) **Setup note**, 🔧, saved to the **exercise in the library** so it shows every
time you do that exercise in any meso, edited from the workout.

**Exercise flags.** `assisted` (inverted progression), `equipment:"Bodyweight"`
(reps not load when unloaded), `timed` (log seconds, **no progression** — just
shows "Last time: 45s · 42s · 38s"), `step` (smallest real weight jump, drives
the rep ceiling; defaults per equipment via `DEFAULT_STEP`), `setup` (the 🔧
note), cardio (ids prefixed `c_`, `muscle: "Cardio"`).

**Cardio** lives in a separate `cardio` store, never mixed into lifting volume.
It is written at finish *after* the date is chosen so it matches the log. In Stats
it is measured in **minutes per week**, not sets — it is excluded from the
sets-per-muscle maps and gets its own row and chart.

**Stats scope.** A dropdown (`statScopes()`, `_statScope`) picks current meso /
any previous meso / this month / this year / all time. A **meso** scope keeps the
meso-specific panels (adherence, weekly targets, week-by-week, PRs); a **date
range** turns them off, because they are meaningless outside a single block.

**Mesocycle completion.** Finishing shows a summary (totals, progression, PRs,
muscle split) with three ways out: repeat, new, archive. The same view opens for
any past block from the Mesos tab (`showMesoSummary`, `VIEWS.mesosummary`,
`renderMesoComplete(meso, pos, standalone)`). The volume comparison uses the last
**non-deload** week so a deload doesn't read as regression.

---

## 6. Traps that have already bitten

Each of these cost real debugging time. Don't re-learn them.

- **`toISOString()` is UTC.** It shifted early-morning Sydney workouts to the
  previous day. Always build dates from local components.
- **Opening the Train tab creates a session.** Its creation timestamp is not when
  training started. Use the first logged set.
- **Sorting logs by a user-editable date** created an un-fixable state. Order by
  creation.
- **A `??` hint must never hide real data.** An out-of-band prediction once
  blanked reps the user had typed and logged. Hints are for empty fields only.
- **jsdom does not fire `popstate` asynchronously** by default, which hid a real
  back-button bug. Override `history.back` in tests that care.
- **DOM nodes go stale** after any action that re-renders a card. Re-query.
- **Fresh installs seed archived starter templates**, so `mesocycles[0]` is not
  your test meso — call `clearTemplates()`.
- **Adding an exercise opens the target editor**, so test flows must dismiss it.
- **Cardio slots have no `sets`**, and were silently polluting the
  sets-per-muscle targets with a junk row.
- **The container wipes between sessions.** The tests live in the repo precisely
  because they were lost once already.

---

## 7. Settled constraints — don't re-litigate

- **No audio, ever.** The rest timer is vibration-only.
- **Background buzz while the app is closed is impossible** in a PWA. Foreground
  buzz plus catch-up-on-return is what exists.
- **No backend, no accounts.** Data is `localStorage`, single-device. Migration is
  Settings → Export/Import JSON.
- **No browser storage beyond `localStorage`**, no external runtime dependencies,
  no build step. One file, opens offline, instantly.
- **Bulk exercise importer: cancelled.**
- **XSS/CSP hardening: parked** — single-user, no sharing. Revisit only if it
  goes multi-user.

---

## 8. Product direction

The app above is the personal tracker. A separate **market direction** has been
discussed at length but not built: a beginner-women-focused version —
non-intimidating, no jargon, cute, done-for-you plans. The thesis is
"RP-grade autoregulation in a warm, jargon-free wrapper", because the market
rewards *feeling coached*, not the best algorithm.

The highest-leverage first build would be an **onboarding flow** (goal →
equipment → experience → "here's your plan, press start"). Open and unresolved:
**evolve this app or fork a separate product**, since the two want different
things (the movement-first naming convention below is great for Matt and slightly
clinical for a nervous beginner).

Deliberately *not* built: exercise demo videos, cloud sync/accounts, a social
feed, wearable HR, a named trainer persona. The app must never imply it is
personalised expert coaching when it is algorithmic defaults.

---

## 9. Parked ideas

- **Exercise naming convention** → movement-first, `Movement - Variation -
  Equipment` (segments omitted when absent, so "Plank" stays "Plank"), sorted by
  movement so variations cluster. Structural: add `movement`/`variation`/
  `equipment` fields and generate the display name. Matt confirmed the format but
  put it on hold.
- **RP exercise-library comparison** — a partial list was pasted (cut off at
  "Back Raise (45 degree)"); the full list is needed. Overlaps with the naming
  work.
- **Cardio progression** — cardio is pure logging today; even "last time 25 min
  @ Z2, try 27" would make it feel programmed.
- **Bodyweight trend** — tracked and charted, but no trend line or link to
  training performance.
- **Exercise demos / setup cues** — the biggest gap for any market version.

---

## Changelog

Newest first. Add an entry when you ship.

### 2026-09-16
- **Message banks moved to `MESSAGES.txt`.** All 315 Fun-mode messages (rest-over,
  the three welcome-back tiers, cutie titles/messages/footers) now live in a plain
  text file, one per line under `[SECTION]` headings. `MESSAGES_build.js` injects
  them into `index.html`; `--check` reports drift. The app stays a single
  self-contained offline file, so a runtime fetch wasn't an option.
- **`TESTS_messages.js` (27 checks)** guards it: fails if the text file and the app
  drift apart, and validates every bank for blanks and duplicates.
- **`PROJECT-NOTES.md` rewritten as a handover doc** — added *How to work on this*
  (the patch recipe with its all-or-nothing guard, the JS syntax check, the test
  and deploy loop) and *Traps that have already bitten*. Verified by following it
  from a folder containing only the repo files.
- Suite now **345 / 16 suites**.

### 2026-09-01 (fifth pass — mesocycle completion)
- **Finishing a block now has an ending.** It used to dead-end on one line
  ("Meso complete — duplicate it from the Mesos tab"). The Train tab now shows a
  **completion summary**: totals (workouts, sets, reps, volume, hours, cardio),
  completion % with skips reported separately, **how it progressed** (volume
  change from the first week to the last *non-deload* week, and sets/week
  added), **PRs set during the block**, and **where the work went** by muscle.
- **Three ways out**, right there: *Run it again*, *Build a new meso*,
  *Archive & finish here*.
- **`repeatMeso(id)` extracted** so the completion screen and the Mesos ⋯ menu
  share one implementation. Repeating now also **archives the finished run** and
  drops you straight into the first workout.
- Deload-aware on purpose: the volume comparison uses the last non-deload week,
  so a deload week doesn't read as "you got weaker".
- **Previous blocks are reviewable.** The same summary opens for any past
  mesocycle: tap an archived block in the Mesos tab (it now shows its workout
  count and "view summary ›"), or use *View block summary* in the ⋯ menu. In
  that mode the header reads "Block summary", there's a back route, and the
  archive action is dropped — but *Run it again* stays. `showMesoSummary(id)`,
  `VIEWS.mesosummary`, `renderMesoComplete(meso, pos, standalone)`.
- Tests: new `TESTS_mesocomplete.js` (40). Suite now **318 / 15 suites**.

### 2026-09-01 (fourth pass — cardio in Stats)
- **Fixed: cardio logged inside a workout was nearly invisible in Stats.** It
  reached the cardio store correctly, but the only weekly cardio view was the
  zone chart — which counts sessions **with a heart rate**. Log 25 minutes with
  no HR and nothing appeared.
- **Added "Cardio minutes per week"** chart alongside the other weekly charts,
  counting all cardio in the selected scope regardless of HR, with a min/week
  average. Hidden entirely when there's no cardio.
- **Cardio now appears in the weekly muscle panel as minutes**, on its own row
  below the muscles, because cardio has no "sets per muscle" — that mismatch is
  why it never showed up there.
- **Fixed a pre-existing duplicate:** cardio slots in a meso were being counted
  into `targetPerMuscle` (with `sl.sets` undefined), producing a junk "Cardio"
  sets row. Cardio is now excluded from both the target and actual sets maps.
- Tests: new `TESTS_cardiostats.js` (17). Suite now **278 / 14 suites**.

### 2026-09-01 (third pass — Stats scope)
- **Stats now has a scope dropdown** at the top: **Current meso**, each
  **previous meso** that has logged workouts (newest first), **This month**,
  **This year**, **All time**. Selecting one re-scopes the whole page.
- **Totals card** under the dropdown for whatever is selected: workouts, sets,
  reps, volume, hours lifting, cardio minutes. Empty periods say so plainly
  rather than showing zeros everywhere.
- A **meso scope** keeps the meso-specific panels (completion/adherence, weekly
  targets, week-by-week, PRs); a **date range** turns those off — they have no
  meaning outside a single block — and shows the plain totals instead.
- Skipped markers are excluded from every scope. Scope is held in memory
  (`_statScope`), so it survives navigation but always opens on the current
  meso. `statScopes()` builds the list.
- Tests: new `TESTS_statscope.js` (24 checks). Suite now **261 / 13 suites**.

### 2026-09-01 (second pass)
- **Skip a whole workout.** The ✕ in the workout header now offers
  *Skip this workout* alongside Keep & leave / Discard, with a confirmation that
  warns if you'd be discarding logged sets. Position in a meso is derived from
  its log count, so a skip records a **marker log** (`skipped:true`, no
  exercises) to advance without inventing training data. Skip markers are
  filtered out of streaks, the welcome-back gap, Stats, monthly rollups and the
  progression history index; they can't be opened for editing, show as a muted
  dot on the calendar and read "skipped" in the day sheet, and never appear as
  the Home "Last workout".
- **Fun colour schemes.** Four options in Settings (Fun mode only): **Coral**
  (default, unchanged), **Pastel** (lilac/mint), **Super pink**, **Peach
  sorbet**. Each has light and dark palettes and is applied via
  `body[data-fun="1"][data-scheme="…"]`, so Serious mode always stays neutral.
  They render as checkboxes per the request but behave as a single choice —
  one is always selected. `FUN_SCHEMES`, `settings.funScheme`.
- Tests: new `TESTS_skip.js` (18) and `TESTS_schemes.js` (25).
  Suite now **237 checks / 12 suites**.

### 2026-09-01
- **Fixed: logging a set wiped the reps to "??".** When a typed weight produced
  an out-of-band prediction (`predReps === null`), `setRowHTML` blanked the reps
  input and showed the `??` hint — even for a set the user had filled in and
  logged. The value was stored correctly but invisible. `??` is now only ever a
  hint for an *un-entered* set; an entered or logged value always displays.
  Also added `touchedReps` so editing the weight can't overwrite reps the user
  typed. Regression covered in `TESTS_loadrep.js`.

### 2026-08-25 (fourth pass — welcome-back messages)
- **Added tiered welcome-back messages** for the cutie layer (Fun mode +
  Female). Shown as a card on Home when there's a gap since the last logged
  workout. 30 messages across three tiers: **3-5 days** (playful, "even
  princesses need a rest"), **6-13 days** (encouraging comeback), **14+ days**
  (deliberately the kindest — no guilt, just glad you're back). Under 3 days
  shows nothing, and a brand-new user with no history never sees it.
  `RETURN_MSGS_SHORT/MID/LONG`, `daysSinceLastWorkout()`, `returnMessage()`.
- Tests: new `TESTS_welcome.js` (22 checks). Suite now **188 checks / 10 suites**.

### 2026-08-25 (third pass — progression overhaul)
- **PR popups gated to Fun mode.** `checkPR()` had no mode check at all (only
  `maybeCelebrate` did), so Serious mode still got e1RM PR toasts.
- **Weight and reps no longer both increase.** `buildGhostRows` used to carry
  last week's reps onto a heavier load — a double increase. Now: held weight →
  +1 rep; raised weight → fewer reps, predicted from the load–rep model.
- **Added the load–rep model** (`e1rmAvg`, `repsAtLoad`) — averaged
  Epley + Brzycki, both directions. 15kg×15/14/12 → 17.5kg now suggests
  **10/9/7** instead of demanding the same reps at a heavier load.
- **Live re-prediction**: typing a weight different from the suggestion
  re-aims the rep targets for that exercise, per set.
- **"??" for out-of-band predictions** — reps <3 or >25, or a load at/above the
  estimated 1RM. Better than printing a confident wrong number.
- **Jump-aware rep ceiling** replaces the flat `target+4`, which was broken for
  small-muscle work (a 5→7.5kg lateral raise is +50% and needs ~20 reps banked;
  +4 could never get there). Ceiling now derived from each exercise's own
  smallest jump.
- **Per-exercise "smallest weight jump"** field added to the exercise editor,
  defaulting by equipment. This is what makes microloading work properly.
- Reasoning, evidence and worked examples documented in `PROGRESSION-MODEL.md`.
- Tests: new `TESTS_loadrep.js` (25 checks). Suite now **166 checks / 9 suites**.

### 2026-08-25 (second pass — audit)
- **Audited the codebase** against edge cases, data integrity, and cross-feature
  interactions. Two findings:
  - **Fixed: muscle priorities were never locked** once a meso started, though
    that was the agreed rule. Priorities now disable (with a 🔒 note) as soon as
    the meso has a logged workout, and `collectBasics` skips disabled selects so
    a started meso keeps its settings.
  - **Fixed earlier the same day: cardio kept the stale date** (see below).
- Test suite grown to **138 checks across 8 suites** — added `TESTS_integrity.js`
  (export/import, checksums, migrations), `TESTS_edge.js` (empty states, set ops,
  input clamping), `TESTS_flows.js` (multi-feature user journeys).
- Verified clean, no action needed: timed exercises don't pollute lifting
  volume or PRs; negative/absurd inputs are clamped; empty workouts are
  discarded rather than logged as phantoms; all views render on an empty
  install and with a completed meso; the rest timer survives navigation;
  `scopePrompt` escapes user text.

### 2026-08-25
- **Fixed: wrong date on completed workouts.** The date was stamped when the
  session object was created — which happens just by opening the Train tab —
  so peeking Monday and training Thursday logged Monday. Now the finish prompt
  asks for the date, defaulting to the first logged set's day.
- **Fixed: manual date corrections wouldn't stick.** Editability was ordered by
  the date field, so a wrongly back-dated log sorted out of the 6-log window and
  became read-only — the bad date locked you out of fixing it. Now ordered by
  creation order.
- **Fixed: cardio kept the stale date** — it was written to the store before the
  date prompt ran. Now written after, matching the log.
- **Added the test suite** (`tests/`) and this notes file.

### Earlier (undated, in rough order)
- Time-based holds: `timed` exercises log sets × seconds, no progression, show
  "Last time: 45s · 42s · 38s".
- Bodyweight fix: exercises added mid-workout weren't flagged bodyweight;
  added backfill for existing sessions.
- Workout header redesign (day name + compact meta line + 📅/📝/✕ icons);
  workout note now displays as a pinned bar (it saved before but was invisible).
- 100 Fun-mode "rest over" messages; Serious mode stays plain.
- Volume ramp overhaul + per-muscle priority + "Repeat this meso".
- Rep range set per-exercise at add time (adding now opens the target editor).
- "Can't add weight → progress reps" with a rep ceiling (target + 4).
- Setup notes (library-level), gender options reduced to three.
- Set types: Regular / AMRAP / MY / MM, badges, excluded from progression.
- Scaled sets-per-muscle chart; bar-chart axis clipping fix.
- Tabata on cardio cards mid-workout; timezone/local-date fix.
