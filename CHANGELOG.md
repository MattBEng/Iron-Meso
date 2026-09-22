# Lift Daddy — changelog

Newest first. Every entry: **what changed, why, and what it touches** — written
for another AI (or Matt) picking this up with zero memory of the session that
made it. Add yours before you consider a change finished; see the loop in
`PROJECT-NOTES.md` §3. If this file is ever missing, recreate it — don't fold
history back into `PROJECT-NOTES.md`.

---

### 2026-09-22 (fix — rep targets that could never be met, and unearned deloads)
- **Bodyweight targets could never rebuild.** Hanging Leg Raise, plan 3×10, did
  8/8/8: the card said *"drop a rep and rebuild"* and asked for **9** — every
  session, forever. The rebuild was `plan target − 1`, and the plan's target is
  fixed for the block, so it never came down to meet the reps actually managed
  (and the message contradicted the number it showed). Now it rebuilds from
  `avgReps` — 8/8/8 asks for 8, and completing that climbs again.
- **Clearing the plan's target triggered a deload.** Machine Hip Thrust, plan
  3×10, held 20kg, ghost asked 13, did 12/12/12 @2RIR → *"sets fell short — back
  off 5%"*, dropping to 18.8kg for beating the plan by two reps. Now: every set
  clearing the plan's target holds the load and sets `repeatReps`, so the next
  ghost repeats those reps instead of demanding +1 again. Genuinely missing the
  plan's target still backs off.
- **"Most sets hit target" was unreachable.** The threshold `ceil(sets × 0.67)`
  is 3-of-3 for a 3-set exercise, so one short rep on the last set skipped
  straight to the backoff. Now `ceil(sets × 2/3)`: 2 of 3, 3 of 4, 4 of 5.
- **The card hid what it was asking for.** It showed the plan ("target 3×10")
  while the rows were prefilled with the ghost (13). It now reads
  "target 3×10 · aiming 12" when the two differ.
- Touches: `index.html` (`ProgressionEngine.suggest` bodyweight + short-of-target
  branches, `hitMost`, `buildGhostRows` repeat, the exercise card subtitle),
  `sw.js` (BUILD). `PROGRESSION-MODEL.md` §6b added; `PROJECT-NOTES.md` §5
  updated.
- Tests: new `TESTS_repprog.js` (20 — fails 11 on the old app). Suite now
  **431 / 21 suites**, all passing.

### 2026-09-19 (fix — Replace exercise kept the old exercise's shape)
- **Bug:** replacing push-ups with a dumbbell movement mid-workout left the card
  in bodyweight mode — "BW" in every weight box and "Bodyweight — aim for 9 good
  reps" — because *Replace exercise* only swapped `exerciseId` and re-ran the
  suggestion. Everything else derived from the old exercise (`bodyweight`,
  `timed`, `cardio`, the rows themselves) stayed put. The same swap in the other
  direction was wrong too: to bodyweight, to a timed hold, or to a cardio item.
- **Fix:** new `retargetSessionExercise(ses, newId, edit)` rebuilds the row from
  the new exercise — bodyweight rows, timed rows with seconds, the cardio card
  with its log fields, or normal ghost rows with a fresh suggestion. Set count,
  RIR, rest and notes carry over. *Replace exercise* now calls it, and warns
  before clearing logged sets.
- **Self-heal:** `upgradeSession()` now rebuilds any session row whose flags
  disagree with the library (a swap made before this fix, or an exercise edited
  since), so a workout already open repairs itself when reopened — unless it has
  logged sets, which are never silently rebuilt.
- Touches: `index.html` (`retargetSessionExercise`, `upgradeSession`, the
  `replace` menu action), `sw.js` (BUILD). `PROJECT-NOTES.md` §5 rule added.
- Tests: new `TESTS_swapex.js` (24 — fails 13 on the old app). Suite now
  **411 / 20 suites**, all passing. Checked visually at phone width.

### 2026-09-17 (Stats — wrong numbers fixed, screen decluttered)
- **Numbers that were wrong:**
  - *Completion %* counted skipped workouts as done (it used the position
    count, which skips advance). Now `done − skipped`, with "N skipped" shown.
  - *PRs* for a previous block included later blocks' sessions (filtered by
    date ≥ start with no end). Now only that block's own sessions, compared
    with everything before it.
  - *Block comparison* counted skip markers as workouts, diluting avg volume.
  - *Per-week averages* (cardio min/wk, the Cardio row) divided by weeks that
    had data, capped at 12. Now divided by every week in the scope's span.
  - *Scope leaks:* monthly trends, zone chart, "this meso by zone" (always the
    active block), cardio fitness and bodyweight ignored the dropdown. All now
    read the scoped lists. "Sets per muscle (all time)" was scoped but
    mislabelled.
  - *Weekly sets per muscle* averaged in the week still in progress, so you
    looked behind target mid-week. It's left out (and says so) when earlier
    weeks exist.
  - *lb users:* volume showed kg numbers with an lb label. Converted now.
  - *Bar charts:* the axis could dip below 0 and an empty week drew a stub.
    Axis now starts at 0; zero bars aren't drawn. (Showed up once empty weeks
    started appearing — see below.)
- **Decluttered:** the page is now collapsible sections — *This plan* (block
  scope only), *Training*, *Plans compared* (block or all-time scope, 2+
  blocks), *Cardio*, *Body*. Empty cards and empty sections aren't drawn
  (no zone chart without HR, no fitness chart without distance, no bodyweight
  without entries). The four weekly charts (volume, sets, frequency,
  duration) are **one chart with a toggle** and a per-week average. The
  weekly axis is continuous, so weeks you didn't train show as gaps. The total
  sets-per-muscle list only appears in date-range scopes (block scope already
  has the weekly version). Collapsed sections are remembered
  (`settings.statsClosed`). A cardio-only period now shows totals instead of
  "nothing logged".
- Touches: `index.html` (`VIEWS.analytics` rewritten; new `statsClosed`,
  `weekKeysBetween`, `_weeklyMetric`; `.stat-sec` CSS; `ChartManager.draw`
  bar baseline), `sw.js` (BUILD). `PROJECT-NOTES.md` §5 Stats rule updated.
  Removed canvases: `#cv #cs #cf #cd` → `#cweek`. Checked visually at phone
  width with seeded data.
- Tests: new `TESTS_statsfix.js` (32). Suite now **387 / 19 suites**, all
  passing.

### 2026-09-17 (fix — cardio logged when it wasn't done)
- **Bug:** cardio inside a workout got logged even when you didn't do it.
  Two paths: (1) *Skip exercise* on a cardio card greyed it out, but finishing
  ignored `skipped` and logged it anyway; (2) a card you never touched still
  logged, because the minutes box is **prefilled with the target** and finish
  auto-captured any card with minutes > 0. Skipping the whole workout was
  already fine (marker log, no cardio).
- **Fix:** typing into any cardio field sets `ses.touched`. Finish now
  auto-captures only touched cards, and never logs a skipped card (even one
  ticked before being skipped). Tapping *Log this cardio* still logs the
  prefilled target. Editing a past workout follows the same rules — skipping a
  cardio card there removes it.
- **Behaviour change to know:** if you do the cardio exactly as planned and
  neither type nor tap Log, it won't be recorded. Tap *Log this cardio*.
- Touches: `index.html` (`finishWorkout`, `saveLogEdit` cardio filter, the
  `data-card-in` input handler), `sw.js` (BUILD). `PROJECT-NOTES.md` §5 Cardio
  rule updated. `TESTS_workout.js` now types the minutes instead of setting
  them directly (it was relying on the old auto-capture).
- Tests: new `TESTS_cardioskip.js` (16 — fails 5 on the old app). Suite now
  **355 / 18 suites**, all passing.

### 2026-09-16 (fix — assisted pull-up progressing backwards)
- **Bug:** on older installs, Assisted Pull-Up was treated as a normal lift.
  After a short session (30kg × 10/8/7 vs target 10) it said *"back off 5%"*
  and suggested 28.8kg — less assistance, i.e. **harder**. A strong session
  would have added assistance (easier). Reported from the phone.
- **Cause:** the engine's assisted logic was fine; the stored exercise had no
  `assisted` flag. Fresh installs get it from `STARTER_EXERCISES`, and the v6
  migration backfills it — but that backfill line was added to v6 *after* most
  installs had already passed v6, so it never ran for them. `load()` only adds
  missing starter exercises; it never refreshes fields on existing ones.
- **Fix:** new migration **v7 → v8** (`SCHEMA_VERSION = 8`) flags any non-timed
  exercise whose name contains the word "assisted" (built-in or custom, e.g.
  "Band Assisted Dip"). Runs once, so unticking *Assisted* in the exercise
  editor afterwards sticks. Same session now suggests **31.25kg — "add 5%
  assistance and rebuild."**
- Touches: `index.html` (`SCHEMA_VERSION`, `MIGRATIONS[7]`), `sw.js` (BUILD).
  Added a trap to `PROJECT-NOTES.md` §6 about editing shipped migrations.
- Tests: new `TESTS_assisted.js` (13 — fails 7 on the old app). Suite now
  **339 / 17 suites**, all passing.

### 2026-09-16 (repo audit — restored a missing test suite)
- **`TESTS_cardiostats.js` had gone missing from the repo** despite being
  referenced as shipped in the fourth-pass entry below — the file just wasn't
  there, so `TESTS_run-all.js` (which discovers suites from the folder) had
  been silently running one suite short with zero coverage on cardio-in-Stats.
  Rewrote it: weekly cardio minutes including HR-less sessions and cardio
  logged inside a workout, the weekly-minutes card appearing/disappearing
  correctly, scope filtering (current/previous meso, month, year, all-time,
  including a cardio session with no `mesoId`), skip markers never touching
  cardio totals, and the sets/minutes-mixing regression (a cardio slot must
  never leak into the per-muscle sets panel as a sets-based "Cardio" row).
- Tests: `TESTS_cardiostats.js` restored (15 checks). Suite is genuinely
  **326 / 16 suites** now — corrects the check count in the entry below,
  which was written assuming this file already existed.

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
