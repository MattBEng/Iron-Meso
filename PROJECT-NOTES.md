# Lift Daddy — project notes

Working notes for whoever picks this up next (including a future AI session
with no memory of earlier work). Keep this updated; it's cheaper than
re-deriving everything.

---

## What this is

A single-file, offline-first PWA for hypertrophy training — mesocycle
programming, RIR-based autoregulated progression, and logging. Modelled on
the Renaissance Periodization app but warmer and jargon-free.

**Live:** https://lift-daddy.pages.dev/
**Hosting:** Cloudflare Pages, git-connected to GitHub (user `mattbeng`).
Framework preset *None*, build command *blank*, output dir `/`.
Push to the repo → auto-deploys in ~1 min.

---

## Repo layout

| Path | What it is |
|---|---|
| `index.html` | **The entire app.** One self-contained file (~230 KB): HTML, CSS, and one big `<script>`. |
| `sw.js` | Service worker. Network-first for the HTML shell so updates propagate. |
| `_headers` | Cloudflare cache headers. |
| `icon-*.png` | App icons (coral "LD"), incl. maskable variants. |
| `TESTS_*.js` | Automated test suite, in the repo root — see `TESTS_README.md`. Run `node TESTS_run-all.js`. |
| `PROJECT-NOTES.md` | This file. |
| `PROGRESSION-MODEL.md` | **The science behind the progression maths** — equations, evidence, worked examples, the "??" band, the jump-aware ceiling. Read this before touching the engine. |

**Deploying a change:** bump the `BUILD` stamp in `sw.js`, then push
`index.html` + `sw.js`. Without the bump, clients may keep the old shell.

```bash
NEWSTAMP=$(date +%Y%m%d%H%M%S)
sed -i "s/const BUILD = \"[0-9]*\"/const BUILD = \"$NEWSTAMP\"/" sw.js
```

---

## Architecture

Everything lives in one `<script>` in `index.html`.

- **`Store`** — state in `localStorage` under key `ironmeso_v1` (**do not
  rename**; it would orphan existing user data). Debounced save + `flush()`,
  checksummed export/import, `validateState`. Exposed as `window.LiftDaddy`.
- **`SCHEMA_VERSION`** with a migration chain. Add a migration when you change
  the shape of stored data; never mutate old data in place without one.
- **`ProgressionEngine.suggest()`** — the core. RIR-based, whole-workout aware.
  Handles: assisted machines (inverted — less weight = progress), bodyweight
  (progress reps, not load), loaded bodyweight (normal load progression),
  held-weight plateaus (same weight twice → recommend reps), and excludes
  AMRAP/myorep sets from its judgement.
- **Views** — hash-free router `go(name)` against a `VIEWS` registry:
  home, mesos, workout (*Train*), calendar (*History*), exercises,
  analytics (*Stats*), settings. Seven-tab bottom nav.
- **Modes** — Serious vs Fun (`FUN()`). Fun replaces RIR with a feel scale
  (😌/💪/🔥), uses plain language, and adds encouragement. Female + Fun
  additionally unlocks the "cutie" layer on Stats.

---

## Domain rules worth knowing

**Volume ramp.** Sets climb from `startSets` (default 2) to a per-muscle
ceiling, landing on the ceiling in the final *real* week (deload excluded),
spread evenly. Ceiling comes from `endTargetSets` (default 5) stepped down by
priority: **High = target, Normal = target − 1, Low (maintain) = target − 2.**
Priority is set at meso creation and **locked once the meso has any logged
workout** (selects disable; `collectBasics` skips disabled ones so the stored
values survive a re-save). A **repeat run**
(`repeatRun: true`) starts one week in — a repeated 4-real-week High muscle
goes 3,4,5,5. When the set count holds week to week, load/rep progression
carries the session.

**Dates.** `todayISO()` uses **local** date components, never `toISOString()`
(that's UTC and shifts early-morning sessions to the previous day). A session
object is created merely by *opening the Train tab*, so its creation date is
**not** a reliable "start" — `sessionStartDate()` reads the first logged set's
timestamp instead. The finish prompt asks for date + duration.

**Log editability.** Only the 6 most recent logs of the active meso are
editable (`logEditable()`), ordered by **creation order (`loggedAt`)**, never
by the date field — ordering by date created a catch-22 where a wrongly
back-dated log fell out of the window and could never be corrected.

**Notes — three distinct levels:**
1. **Session note** — this workout only (`session.notes`).
2. **Meso slot note** — 📌, specific to that plan.
3. **Setup note** — 🔧, saved to the **exercise in the library**, so it shows
   every time you do that exercise, in any meso. Edited from the workout.

**Progression maths.** Load↔rep conversion uses an **average of Epley and
Brzycki**, applied in both directions (they disagree by ~25% individually at
12-15 reps, and bracket the truth from opposite sides). Predictions outside a
trusted band (reps <3 or >25, or load ≥ estimated 1RM) return `null` and render
as **`??`** — never a fake number. Weight and reps **never both increase**:
held weight → +1 rep; raised weight → fewer reps, predicted. The rep ceiling is
**jump-aware** (`repCeilingFor`), derived from each exercise's own smallest
weight jump — a 5→7.5kg lateral raise (+50%) needs ~20 reps banked before the
jump is even possible, while a 100→102.5kg squat (+2.5%) should jump at ~10.
Set the increment per exercise in the exercise editor. Full reasoning and
evidence in `PROGRESSION-MODEL.md`.

**Exercise flags:** `assisted` (inverted progression), `equipment:"Bodyweight"`
(reps not load when unloaded), `timed` (log seconds, **no progression** — just
shows "Last time: 45s · 42s · 38s"), `step` (smallest real weight jump, drives
the rep ceiling; defaults per equipment via `DEFAULT_STEP`), cardio (ids
prefixed `c_`).

**Cardio** is logged into a separate `cardio` store (never mixed into lifting
volume), written at finish *after* the date is chosen so it matches the log.

---

## Constraints (established, don't re-litigate)

- **No audio, ever.** Rest timer is vibration-only.
- **Background buzz while the app is closed is impossible** in a PWA. Foreground
  buzz plus catch-up-on-return is what exists.
- **No backend.** Data is `localStorage`, per-origin, single-device. Migrate
  between devices via Settings → Export / Import JSON.
- **No browser storage APIs beyond localStorage**, no external runtime deps.
- The app icon only refreshes on remove + re-add (OS limitation); code updates
  propagate automatically.

---

## Product direction

The personal app is Matt's own tracker. A separate **market direction** has been
discussed but not built: a beginner-women-focused version — non-intimidating,
no jargon, cute, done-for-you plans. Highest-leverage first build would be an
**onboarding flow** (goal → equipment → experience → "here's your plan").
Open question: evolve this app vs fork a separate product.

Deliberately *not* built: exercise demo videos, cloud sync/accounts, social
feed, wearable HR, a named trainer/coach persona.

---

## Changelog

Newest first. Add an entry when you ship.

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
