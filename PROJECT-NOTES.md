# Lift Daddy — working notes

**Read this first.** It is written for whoever picks the project up next,
including an AI session with no memory of earlier work. It covers what the app
is, how to change it safely, the domain rules that are easy to get wrong, and
the decisions already settled. Keep it current — it is cheaper than re-deriving
everything. For what's changed recently, read **`CHANGELOG.md`**, not this file.

**Trust but verify.** This file and `CHANGELOG.md` can drift out of sync with
the actual code — notes have been updated here without the matching code
landing, and the reverse. Before relying on a claim in either one (a suite
count, a "shipped" feature, a file's existence), confirm it against the real
repo: list the folder, run the tests, grep the code. Don't assume the notes
are current just because they read confidently.

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
| `PROJECT-NOTES.md` | This file — architecture, domain rules, working style. |
| `CHANGELOG.md` | **Dated log of every change**, newest first — what shipped, why, what it touches. Update it every time you ship, before handing over. If it's missing, create it; don't fold history back into this file. |
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
6. **Add a dated entry to `CHANGELOG.md`** — newest first, what changed, why,
   what it touches. Do this before handing over, not after; an undocumented
   change is the thing that caused the audit in the newest entry there. If
   `CHANGELOG.md` doesn't exist, create it.
7. Hand over `index.html` + `sw.js` (+ any test/doc/changelog files) to be
   committed — together, not split across separate copies. A doc update that
   lands before or after its matching code is how the notes end up claiming
   something that isn't actually true yet.

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

Moved to **`CHANGELOG.md`** — read it for what's shipped recently, and add a
dated entry there (newest first) every time you ship, before handing over. If
`CHANGELOG.md` is ever missing, create it — don't rebuild history here.

