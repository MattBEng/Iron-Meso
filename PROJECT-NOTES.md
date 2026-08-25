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
| `tests/` | Automated test suite — see `tests/README.md`. |
| `PROJECT-NOTES.md` | This file. |

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
Priority is set at meso creation and locked once it starts. A **repeat run**
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

**Exercise flags:** `assisted` (inverted progression), `equipment:"Bodyweight"`
(reps not load when unloaded), `timed` (log seconds, **no progression** — just
shows "Last time: 45s · 42s · 38s"), cardio (ids prefixed `c_`).

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
