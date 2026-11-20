# Lift Daddy — changelog

Newest first, headed with the app version it shipped in (`APP_VERSION` in
`index.html`). Every entry: **what changed, why, and what it touches** — written
for another AI (or Matt) picking this up with zero memory of the session that
made it. Add yours before you consider a change finished; see the loop in
`PROJECT-NOTES.md` §3. If this file is ever missing, recreate it — don't fold
history back into `PROJECT-NOTES.md`.

---

### v1.14.2 — 2026-11-20 (dress redrawn, breeze flap)

- **Dress art:** the old dress was a band over the bottom half of the body (read as undies). Now `outfit()` draws a `<g class="dk-dress">`: shoulder strap, bodice from mid-body, A-line skirt that hangs 2 units past the body over the tops of the legs, scalloped hem (`dressHem()`), darker sash, bow at the back, daisy print (`dressFlowers()`). Shows in every pose she wears it.
- **Dress move:** `twirl` pose is now just the breeze: wind lines plus `dkFlap` (skewX/scale on `.dk-dress`, origin at the top), then it settles. Curtsy and hearts removed. Waddling: `dkSwish` on the skirt.
- **Tests:** `TESTS_duckwear.js` checks the skirt hangs below the body.
- **Why:** Matt: curtsy no good, dress looked like undies; wants it to hang and flap like a dress. Picked from a preview.

---

### v1.14.1 — 2026-11-20 (dress move: breeze and curtsy)

- **What:** the `twirl` pose no longer spins (the scaleX flip made her look flat). Now a breeze (`.dk-breeze` wind lines) sways the skirt (`dkSway`, skewX on `.dk-dress`), then she curtsies (`dkCurtsy` tilts `.dk-top` only, so her feet stay planted) and hearts float up. Pose name unchanged.
- **Why:** Matt: the spin looked 2D and broke the fourth wall.

---

### v1.14.0 — 2026-11-20 (outfit animations)

- **What:** five new poses in `petSVG`: `wink` (sunglasses slide down, wink, back up, glint), `capflip` (cap spins up and lands), `daisies` (bends via `.dk-top`, picks daisies, holds the bunch, one tucked in the sun hat, gust lifts the hat), `twirl` (two spins via `.dk-spinner` scaleX, dress flares, hearts, curtsy), `wizard` (runs across like the skate, cape flying, wand with sparkles, says "Oculus Reparo! ✨"). One-shot CSS animations (`1 both`), reduced-motion turns them off.
- **Pool:** `WEAR_ANIMS` maps item -> pose. `wornPoses(train)` returns the poses for what she's wearing (from `petWear()`, so locked items never count); `duckPlace` adds them to the random pool, so every move has equal odds and the no-repeat rule makes hat and outfit take turns. Train excludes `wizard`. `wizard` uses the walk spot (`dkWalk`, 6s).
- **Tap:** `duckTap` adds "wear" to its random reactions when she's wearing something (not mid-walk); plays one of her worn moves in place (`data-still` stops the running legs), with its line if it has one.
- **duckSVG** always draws the item for an outfit pose (dev buttons can play one she isn't wearing). Dev panel: Wink, Cap flip, Daisies, Twirl, Wizard buttons.
- **Tests:** `TESTS_duckwear.js`. Docs: `CUTIE-POINTS.md` duck section.
- **Why:** Matt: every accessory should unlock its own animation; random, evenly weighted, hat and outfit alternate.

---

### v1.13.2 — 2026-11-20 (skateboard wheels)

- **What:** the duck sits at `bottom:64px`, but the nav bar is a little taller than that, so it covered the bottom of the skateboard and the wheels (they also sat mostly behind the board's thick outline). Skate pose now sits at `bottom:72px` (`#duck[data-pose="skate"]`), and the wheels are bigger and lower (cy 62, r 2.8) so they clearly hang under the board.
- **Tests:** `TESTS_skate.js`.
- **Why:** Matt: the skateboard looked like a snowboard.

---

### v1.13.1 — 2026-11-20 (refresh keeps tab, More keeps scroll)

- **Refresh:** boot always did `go(activeSession? "workout":"home")`, and opening Train creates a session, so a pull-to-refresh on Home landed on Train. `go()` now saves the tab name in localStorage key `liftdaddy_view`; boot calls `startView(wasReload(), saved, hasSession)`. On a reload (Navigation Timing type "reload") it reopens the saved tab if it's in `RESTORABLE_VIEWS`; a fresh launch behaves as before.
- **More scroll:** `go()` always scrolled to the top, and every tick in Settings re-renders with `go("settings")`. Now when re-drawing settings from settings (no args) it restores `scrollY` after the render. Every other navigation still starts at the top.
- **Tests:** `TESTS_reloadview.js`.
- **Why:** Matt: refresh jumped to Train; ticking Daisy's outfits jumped to the top each time.

---

### v1.13.0 — 2026-11-20 (band exercises, warm-up slots)

- **Band equipment:** `EQUIP` gains "Band". `BANDS` = Yellow, Red, Green, Blue, Black (lightest to heaviest). `repsOnly(ex)` (Bodyweight or Band) replaces the old `equipment==="Bodyweight"` checks in the progression engine, session build, retarget, upgradeSession, add-exercise and bonus builders, so bands progress by reps with kg 0. Session exercises carry `band:true`; set rows render `bandSelectHTML()` (`data-f="band"`, coloured left border) instead of the BW cell, and store `set.band`. `fillBands()` (called from `upgradeSession`) starts each row on last session's band at the same warm-up/working position, else the last band used, else Yellow. Picking a band updates later unlogged rows. Last-time hint shows "last Red ×15". Column header reads "Band" and the first-time line reads "Band — aim for N good reps."
- **Warm-up slots:** slot flag `warmup`, set by "All sets are warm-ups" in the slot editor. Session build marks every row `type:"warmup"` via `warmRows()` and uses `slot.sets` (no ramp, no deload halving). Warm-up slots are skipped in `mesoVolume` (target and grey "left"), `bonusPool`, and the stats target-per-muscle. Workout card and meso day list show "Warm-up ·".
- **Library:** Band Pull-Apart, Band External Rotation (Shoulders, Band), Arm Circles (Shoulders, Bodyweight).
- **Lisa templates:** shared warm-up text removed from slot notes. `lisaKit()` now has `WARMUP()` = Arm Circles 1x10 (forwards only note), Band Pull-Apart 2x15, Band External Rotation 2x12, prepended to every day of both templates.
- **Migration 10** (`SCHEMA_VERSION` 10 -> 11): tops up library, then `refreshLisaTemplates()` swaps in the new days for any Lisa template that has no logs, isn't the open workout, has no warm-up slots yet, and still matches the seeded lifts/sets/reps. Anything edited or used is left alone.
- **Tests:** `TESTS_band.js` (new); `TESTS_lisameso.js` updated for the warm-up slots.
- **Why:** Matt found the warm-up text on every first lift confusing; asked for a real warm-up with a band colour picker.

---

### v1.12.0 — 2026-11-20 (Lisa's New Meso, 3-day version)

- **What:** second archived template "Lisa's New Meso (3 day)", built by `seedLisa3Template(st)`. Same 4-week block, notes, warm-up, Pallof and 5-min bike as the 4-day one. Days: (1) hip thrust, leg ext, lat pulldown, chest press, rear delt fly; (2) Bulgarian split squat, leg curl, assisted pull-up, push-up, DB curl, dead bug; (3) back raise, hip thrust, leg curl + leg ext superset, neutral-grip pulldown 2 sets, pec dec, overhead cable ext. Hanging knee raise dropped to keep day 3 a sane length.
- **Refactor:** shared helpers moved into `lisaKit(st)`; 4-day output unchanged.
- **Seeding:** fresh installs via `defaults()`; existing installs via new migration 9 (`SCHEMA_VERSION` 9 -> 10), guarded by `st._lisa3Seeded`.
- **Tests:** `TESTS_lisameso.js` extended: 3-day on fresh, v8 and v9 installs, no duplicate of the 4-day, deletes stick.
- **Why:** Matt first asked for 3 days; the 4-day came from Lisa's notes. Both kept.

---

### v1.11.0 — 2026-11-19 (Lisa's New Meso template)

- **What:** new archived template "Lisa's New Meso", built by `seedLisaTemplate(st)` (next to `seedTemplates`). 4 days, 4 weeks, deload on, ramp off. Every day: warm-up note on the first lift, Pallof Press 2x10, 5-min Stationary Bike cardio slot (Tabata note). Slot notes carry rep ranges, RIR, stretch and doming cautions. Back extension uses "45° Back Raise", chest fly uses "Pec Dec Flye", close-grip pulldown uses "Neutral-Grip Pulldown".
- **Library:** added Dead Bug and Hanging Knee Raise (Abs, Bodyweight).
- **Seeding:** fresh installs via `defaults()`. Existing installs via new migration 8 (`SCHEMA_VERSION` 8 -> 9), which tops up missing built-in exercises first, because the `load()` top-up runs after `migrate()` and the new lifts would be dropped. Guarded by `st._lisaSeeded`, so a deleted template stays deleted.
- **Tests:** `TESTS_lisameso.js` (fresh + migrated v8 state, no slot dropped, no duplicate on reload, delete sticks).
- **Why:** Matt asked for Lisa's plan (Project doc `lisas-new-meso.md`) as a template.

---

### v1.10.0 — 2026-11-19 (duck add-ons, bonus picker, daily line)

- **Duck add-ons:** `PET_ADDONS` now has `slot` = head / outfit / act. Worn items (shades@1, cap@2, sunhat@4, dress@5, cape@9) are drawn by `petSVG(pose, skin, wear)` in every pose via `head()`/`body()`; choice saved in `settings.petWear={head,outfit}`, read by `petWear()`, picked with `[data-wear]` buttons in the pet card. Acts (skate@3, lounge@6, bath@7 Certified Powerpuff, lift@8) are new poses in `DUCK_POSES`, gated by `addonOn()` like skate. Dev buttons Dumbbells/Lounge/Bath.
- **Bonus picker:** `confirmBonusWorkout()` is now a 3-option sheet. Catch up = `bonusCatchUpPlan()` (target x share of workouts done minus sets done, gap >=2, top 3, up to 4 sets). Recovered = `bonusRecoveredPicker()`, muscles from this meso minus `bonusTiredMuscles()` (next workout + logged in last 48h), 3 sets each, max 4. Exercises come from the meso's own slots via `bonusPool()`, built by `bonusExercise()`. `startBonusWorkout(plan, label)`; blank still works with no args.
- **Daily line:** `[DAILY LINES]` in MESSAGES.txt -> `DAILY_LINES`. `dailyLineHTML()` on Home top, one line per date (hash). Only Fun mode, Cutie off, and dev toggle `DEV.daily` for now.
- **Why:** Matt approved #2, #3, #5 from the future-updates doc.

### v1.9.3 — 2026-11-19 (live meso volume)

- **What:** Home "Meso volume" card. `mesoVolume()` now adds a `left` count per muscle. With a workout open (`activeSession` for this meso or its bonus), ticked working sets count straight away and unticking takes them back; unticked sets show as a grey tail. With no workout open, the next planned day (`mesoPosition().day`, ramped sets) shows as the grey tail.
- **Card:** removed the per-muscle numbers on the right, kept one colour for all bars, no target marker. Scale = biggest done + left. New CSS `.spm-left`.
- **Why:** Matt asked for live volume with a dark grey preview of today, without clutter.

### v1.9.2 — 2026-11-18 (duck tap timings)
- Knife was too hard to reach. Timings now constants by `_duckAway`: `DUCK_TRICK_EVERY` 3 (was 5),
  `DUCK_KNIFE_TAPS` 5 (was 10), `DUCK_QUICK_MS` 1500 (was 1000), `DUCK_SULK_WINDOW` 30s, `DUCK_AWAY_MS` 2 min.
- Tricks no longer move her. After the knife `duckStabEnd`: first time she moves corner (`duckMove`); a second
  knife on the same page within 30s (`_duckKnifeAt[view]`) and she leaves the page (`duckLeave`). Test: `TESTS_duck.js` (85).

### v1.9.1 — 2026-11-18 (duck: tappable on Train, gets out of the way)
- Bug: on Train the duck had `pointer-events:none` (`dk-notap`), so tapping her hit the card underneath. Removed;
  she is tappable everywhere. To stay out of the way: after each fifth-tap trick `duckMove` swaps her bl/br corner,
  and after the knife `duckLeave` sends her off and `_duckAway[view]` keeps her off that page for 2 min (not saved).
  Dev panel duck buttons clear `_duckAway`. Test: `TESTS_duck.js` (81).

### v1.9.0 — 2026-11-17 (the duck goes live, Cutie only)
- **Live:** `duckOn()` is now `cutieOn() && petPick()` (was dev mode + a dev switch, now removed). Daisy is there
  from the start for Fun mode + Female; never in Serious mode or for other profiles.
- **Pages:** every page except Plans (`DUCK_VIEWS` drops `mesos`), every visit.
- **Add-ons:** `PET_ADDONS` (first: `skate`, `at:3` = Strong Sweetheart). `addonOn(id)` = title earned and not
  switched off. The skate pose only enters the rotation when it is on; that title's unlock popup announces it.
- **Settings:** "Your duck" card (`petsCardHTML`, `#petcard`) between App personality and Your profile: show/hide
  Daisy (`settings.pet`: undefined/"daisy" = on, "" = off) and a switch per add-on (`settings.petAddons[id]===false`
  = off). Locked add-ons show their title; ones past the visible titles stay hidden.
- Dev panel: Skate / Egg / Flock / Knife buttons; "Show unfinished pets" still reveals the nine wip birds.
- Built earlier today as dev-only (tap tricks, Train reactions, skateboard art): see the entry below. Test: `TESTS_duck.js` (76).

### v1.8.1 (dev-only groundwork, no version bump) — 2026-11-17 (duck / pets)
- **Pet duck** ("Daisy"): `petSVG(pose, skin)` is one bird rig drawn as inline SVG (original art); `duckSVG(pose)`
  draws the active pet. `duckPlace(view)` runs from `go()`: fixed safe spots above the nav. Poses: sit, stand,
  sleep, peek, waddle, skate. All motion respects reduce-motion.
- **Taps** (`duckTap`): a random say / hop / spin / heart / wiggle; every 5th tap `duckEgg` (lays an egg, max 3) or
  `duckFlock` (18 ducks rain down, `.pet-rain`); 10 taps each under 1s apart `duckStab` (cross, little knife, ~3.5s).
- **Train tab:** bottom-left, still poses, not tappable (`dk-notap`). `duckCheer(ses)` fires where "Exercise done"
  is toasted: `flex` / `tired` / `cool` for ~3s, hard exercises (avg 1 RIR or less) mostly `tired`.
- **Pets framework, hidden:** `PETS` has 10 birds, one per title (`at`), but only Daisy is live; the rest are
  `wip:1` and ignored by `petsLive()` unless the dev panel's "Show unfinished pets" (`DEV.allPets`) is on.

### v1.8.1 — 2026-11-17 (theme colours, Feel label)
- `--cutie` = `--accent` on every Fun scheme; the 17 fixed rgba(224,85,156) tints now `color-mix` of `--cutie`.
- Set-row Feel select: `FEELS_SHORT` (Easy/OK/Hard/Max) and a 76px column in Fun mode (was cut off as "Cha").
- Matt's standing rules, now guarded by comments and `TESTS_themecolours.js`: the LIFT DADDY logo is always
  `--brand-coral` (branding), and `MUSCLE_COLORS` never change or follow the theme (recognition by colour).

### v1.8.0 — 2026-11-17 (share cards, Cutie only)
- `shareZoneHTML(make)` adds a Share button + `#sharezone` to the finish screen, title/badge popups, the finale
  and `cutieWorkoutModal`; returns "" unless `cutieOn()`. Cards are data (`shareWorkoutCard`, `shareTitleCard`,
  `shareBadgeCard`), drawn by `shareDraw` on a 1200x800 canvas in the current scheme's colours, sent by
  `shareSend` (Web Share with a PNG file, else download). Preview is inline in the popup, not a second modal.
- `funFact` split into `funPick` + `funFact(total, pick)` so the card shows the same comparison as the screen;
  the lifted total now follows the unit setting. Card never shows kilos. Test: `TESTS_share.js` (26, canvas stubbed).

### v1.7.5 — 2026-11-17 (review fixes: assisted points, meso delete, past pause, reveal, ledger cache)
- `cutieLedger` is now a cache over `cutieLedgerBuild` (key: `_stateRev` bumped in `Store.save` + sizes + state object).
  Assisted lifts: PR = lowest assistance yet, beat = less assistance or same with more reps (was reversed).
- Full-workout bonus reads `log.planned` (lift count, stamped at finish and on meso delete via `plannedLifts`),
  so deleting a meso no longer drops 30 pts per full workout. Older logs still read the live meso day.
- Holiday pause: past dates accepted; Settings lists pauses from the last 90 days. Secret reveal is only spent
  while the Stats "cutie" section is open (toggle handler swaps `#cjourney`). Test: `TESTS_cutie175.js` (20).

### v1.7.4 — 2026-11-17 (special unlocks)
- Scheme effects via `CUTIE_FX` layer + CSS (lavender hearts, bubblegum bubbles, ocean wave, midnight neon,
  angel halo, rose-gold sheen, goddess crown); `CUTIE_RAIN_BY_TITLE` showers; `cutieFrame` bronze/silver/gold.
- Secret reveal: `S().cutie.revealed` + `cutieRevealCheck()` (real progress only). `[TITLE LINES]` in MESSAGES.txt
  (9th section) mixed into `restOverMsg`/`cheerLine` via `cutieLine`. Goddess finale once (`S().cutie.finaleShown`),
  then crown on Home brand + gold points. Dev: Goddess finale, Secret reveal. Test: `TESTS_cutie174.js`.

### v1.7.3 — 2026-11-17 (incremental titles, secrets, a colour per title)
- `CUTIE_THRESHOLDS` now 0/2,000/5,000/7,800/9,500/11,700/14,400/17,700/21,600/26,000: from her 6,704 at
  ~550/week each title takes ~1 week longer (2..8 weeks, ~35 total). Only reached + next 3 titles show
  (`CUTIE_REVEAL`, `cutieVisibleMax`) in Stats, the titles list and the scheme picker; the rest are counted
  as secret. No week estimates. 3 new schemes (Cherry Bomb, Lavender Haze, Ocean Babe): one per title 1-9.

### v1.7.2 — 2026-11-17 (popups open at the top)
- `modal()` focused the first button, which on long lists (What's new, titles, breakdown) is at the bottom,
  so the popup scrolled to the end. Buttons now get `focus({preventScroll:true})` and `scrollTop=0`; popups
  with a field still focus it normally. Test: `TESTS_modalscroll.js`.

### v1.7.1 — 2026-11-17 (Cutie Stats page)
- With `cutieOn()`, Stats hides PRs this plan, strength across blocks, Cardio and Body sections and adds
  a "Cutie progress" section: `cutieJourneyHTML` (titles, dates, ETA from `cutiePace`), `cutieBadgesCardHTML`,
  `cutieMetricsHTML`. Other profiles unchanged. Test: `TESTS_cutiestats.js`.

### v1.7.0 — 2026-11-17 (Cutie bonuses, badges, holiday pause)
- `cutieLedger` adds `CUTIE_BONUS`: PR (e1RM beats earlier best, 50, max 3), full workout (30, not bonus
  workouts), beat last time (10/lift, max 50), welcome back (75 after 14+ days). Going forward only:
  `S().cutie.bonusFrom` (first run) vs `log.loggedAt`; badges already earned then are in `badgesFree` (no points).
- `BADGE_DEFS` (10), saved in `S().cutie.badges`, 50 pts each, names from MESSAGES.txt `[BADGE NAMES]`
  (8th section: build script + TESTS_messages updated). Badge popup after title unlocks at finish.
- Plan comparison on Stats. New `S().pauses` [{id,from,to}]: `streakCount` and the Cutie streak week skip
  paused days/weeks; Home holiday card; Settings card. Fixed doubled CRs in the 1.6.0 block. Test: TESTS_cutie17.js.

### v1.6.0 — 2026-11-17 (Cutie Points v2, part 2)
- New saved state `S().cutie.titles` (title index -> date first reached); pre-1.6.0 titles recorded silently
  on first run. `cutieSyncTitles()` at finish; unlock modal + `emojiRain()` (hearts/emoji shower) after Yay.
- 6 unlockable schemes (`CUTIE_SCHEMES`, light+dark CSS, Angel Glow sparkle, Goddess shimmer); `schemeAllowed()`
  gates them in `applyTheme` and the picker. Cutie colour now `--cutie`, follows the accent on unlocked schemes.
- Progress bar, title list, week/month totals + weekly bars. Dev: Title unlock fire; leaving dev resets an
  unearned scheme. Test: `TESTS_cutie16.js` (35).

### v1.5.0 — 2026-11-17 (Cutie Points v2, part 1)
- Points now per workout from `cutieLedger()` (100 + 10/working set + 3/cardio min + 50 streak week),
  lifetime total via `cutieTotals()`, new `CUTIE_THRESHOLDS` (0 to 23,000). Replaces `cutieScore`, which was
  scoped to the Stats dropdown and counted warm-ups. Full rules: new `CUTIE-POINTS.md`.
- Top 3 on Stats + Home, breakdown modal, points on finish/calendar/workout header, all-time and 7-day best
  celebrations (`cutieBestCheck`), `confetti()`. Bonus workouts get the finish screen when Cutie is on.
- Dev mode: 7 taps on Settings version; state in `liftdaddy_dev` key only. Test: `TESTS_cutie.js` (43).

### v1.4.2 — 2026-11-17 (review items A2 to A7)
- A2 Stats `inScope` meso scope also matches `bonusOf`. A3 `dayModal` shows delete for bonus logs.
- A4 end/delete/repeat meso clear `parkedSession` (end/delete only if it belongs to that meso).
- A5 new `deloadKg()` used by all three deload sites: assisted lifts keep last assistance.
- A6 new `freshFeedback()`/`latestFeedback()`: survey counts only if for the latest log or <=10 days
  old. Used by `suggest`, Home pills, Stats fatigue. A7 `+ Add exercise` takes reps/RIR from the
  meso slot for that lift (session's meso or `bonusOf`, else active), fallback 10 @ 2.
- Test: `TESTS_review142.js` (25 checks).

### v1.4.1 — 2026-11-17 (edit-workout data loss)
- `startLogEdit` copied only kg/reps/RIR per set, so Save changes on a past workout
  stripped `type` (warmup/amrap/my/mm) and `secs`, and the edit view had no
  bodyweight/timed flags. Now copies the whole set and runs `upgradeSession` on the
  edit session. Logs already saved through an edit are not repaired. Test: `TESTS_logedit.js`.
- `MESSAGES_build.js` now writes and compares using index.html's own line endings, so
  `TESTS_messages.js` passes on a CRLF (Windows) checkout and a Windows rebuild no
  longer writes mixed endings. Replacement also no longer interprets `$` in messages.

### v1.4.0 — 2026-11-12 (Bonus workout)
- **Bonus workout**: new ⋯ button in the Train header (live sessions only, not
  edit/preview/bonus) opens `workoutMenu()` → "Bonus workout" → confirm modal →
  blank session. Matt wanted to add an extra session mid-meso (e.g. a free day
  when chest is still sore) without wrecking the scheduled day.
- The scheduled session is parked in `st.parkedSession` (new state key) and
  restored by `endBonus()` on finish, discard or nothing-logged. An untouched
  parked session is dropped so it rebuilds fresh; one with logged sets is kept.
- Bonus log: `mesoId:null`, `bonus:true`, `bonusOf:<meso id>`. `mesoId:null`
  keeps it out of `mesoPosition`, the picker, edit window and swipe ordering, so
  it never uses up a meso day and is read-only once saved. `bonusOf` lets
  `mesoVolume` and `mesoSummary` count it. History, calendar, PRs and streak
  include it as normal. In-workout cardio is tagged with `bonusOf`.
- **Progression ignores bonus sets**: `HistoryIndex` entries carry `bonus`;
  new `progHistory()` filters them, used by `ProgressionEngine.suggest`,
  `holdWeightRepBackoff`, `holdWeightRepProgress`. "Last time" hints still
  show bonus sets.
- No post-workout survey for a bonus (it tunes meso suggestions). Picker caret
  and swipe are disabled on a bonus; header shows a BONUS badge and which
  workout stays next; quit modal has Keep / Discard only (no Skip).

---

### v1.3.1 — 2026-11-09 (Home meso volume card)
- **"Mesocycle volume" card on Home**, under the current-workout card: total
  working sets per muscle **so far this meso**, most first. Bars are **relative
  to the most-trained muscle** (it fills the bar; Chest 18 / Quads 9 shows Quads
  at half), so the card answers "where has my volume gone?" at a glance. No
  targets on purpose: Matt asked for a cumulative comparison, not
  progress-to-plan (that lives in Stats). Header shows week and workouts done.
  Hidden until something is logged. Tapping it opens Stats.
- Counts done, non-warm-up sets in logs of the active meso; skip markers, other
  mesos and cardio are excluded. `mesoVolume(meso)` also returns each muscle's
  total planned sets (every week's `rampedSets`, deload included) in case a
  progress-to-plan view is wanted later; the card doesn't show it.
- Iterated in-session: a weekly sets-vs-target version was built first, then
  replaced at Matt's request.
- Reuses the Stats `.spm-*` bar styles; `.volcard .spm-track` gets a visible
  background (default track was white-on-white on Home).
- New `TESTS_homevol.js` (11).

---

### v1.3.0 — 2026-11-09 (last-time hints, warm-up sets)
From a review against Hevy/RP: two low-effort wins.
- **"last 60×12" hint under every set row.** `prevSessionSets(exId)` reads the
  most recent logged session of that exercise from raw `S().logs` (so warm-ups
  are available); while editing a past workout it means the session before
  that one. `lastHintHTML` matches **warm-up to warm-up and working to working
  by position**, so adding a warm-up doesn't shift every hint down a row. Hints
  are full-width grid rows (`.lasthint`, `grid-column:1/-1`); a partial span
  broke the 5-column grid and wrapped the next row.
- **Warm-up set type** (`warmup`, badge "W") in the existing Set Type menu.
  `isWarm()` gates every training total: `HistoryIndex` (so PRs, e1RM, volume,
  best set and the engine's history), the Home last-workout card, the meso
  summary, and the Stats totals / per-muscle / weekly / monthly sums. The
  engine already read only `type` "normal" sets, so it needed no change.
- Logging a warm-up **doesn't carry its weight forward** into later rows, and a
  working set doesn't carry into warm-up rows. No PR check or celebration on a
  warm-up.
- Changing a set to or from warm-up calls `realignWorkingGhosts`, so working
  set 1 is prescribed from last time's working set 1 rather than from whatever
  row it used to be.
- New `TESTS_warmup.js` (22). `TESTS_features.js` now expects five set types.

---

### v1.2.2 — 2026-11-09 (new block, old rep targets)
Reported: a new meso set to 10 reps showed "target 3×10" in the header while the
rows prefilled 17. The exercise had been trained at 16 reps in the *previous*
block.
- **`buildGhostRows` carried the last session's rep count forward regardless of
  which mesocycle it came from.** Within a block that is the point (double
  progression: hold the load, add a rep to what you actually did). Across
  blocks it is wrong: 16 reps logged under a 16-rep prescription is not
  progress against a fresh 10-rep one, so it read as "you smashed 10, do 17".
- **Fix:** when every history entry for an exercise belongs to a *different*
  meso than the active one, the slot's rep target is the prescription and the
  rows start there. Once the current block has logged that exercise itself,
  history drives rep progression again exactly as before. The **load** still
  carries across blocks via the suggestion — only the rep count resets.
- Guarded deliberately: the reset needs a known `activeMesoId` *and* history
  that all carries a different `mesoId`. Missing or unknown ids fall through to
  the old behaviour rather than silently resetting reps.
- Touches `buildGhostRows` only. New suite `TESTS_represet.js` (7 checks) covers
  the reported case, a raised target, within-block progression still climbing,
  and a first-ever session.

---

### v1.2.1 — 2026-09-24 (audit sweep: nuisance bugs)
A deliberate hunt rather than a reported bug: probed units, rounding, silly
inputs, empty and extreme states, escaping, stale sessions, deleted exercises,
import/export, dates, deloads, set types, timers and the meso lifecycle. Six
things were actually wrong.
- **The per-exercise "smallest weight jump" field was broken for lb users.** It
  is stored in kg but rendered raw, so an lb user saw "2.5" labelled lb, and
  saving the form untouched re-converted it to 1.13kg — halving every time.
  Now shown in the user's unit and only re-converted when actually edited.
- **`dispW()` rounds to 1dp**, so a 1.25kg microplate step displayed as "1.3".
  Added `dispW2()` for that field.
- **Wording:** the sub-step hold said "20kg is the smallest step here", naming
  the weight rather than the step. Now "Can't load less than 5kg here — repeat
  20kg and aim for 11 reps."
- **Timed holds got a bodyweight rep suggestion** ("aim for 1 reps" off
  `bodyweight × 0/0`). `suggest()` now returns null for `timed` exercises; the
  card's "Last time: 50s · 45s" is the right readout.
- **A future-dated log** (a typo'd year) sat at the head of the streak and made
  "days since last workout" read 0. `streakCount()` and `daysSinceLastWorkout()`
  now ignore dates after today.
- **"First time — find a weight…" on an exercise with history**, when no
  suggestion could be derived (an AMRAP-only session). The card now shows
  "Last time: 100kg×20 AMRAP · no suggestion from those sets — pick your load."
- **Checked and found clean:** XSS via exercise names/notes (escaped), lb input
  round-trips (225lb → 102.06kg → 225lb, working-weight grouping intact),
  export/import including the new settings, deleting an exercise that's in an
  open session or in history, deleting a log mid-meso, back-dated logs and the
  editability window, add/remove set bounds, deload weeks, weighted vs unloaded
  bodyweight, repeat meso, rest timer across navigation, tabata minutes, zones
  with no max HR, empty mesos, 9999kg inputs, and Stats with a single log (no
  NaN or Infinity).
- **Known, not fixed:** increments and default steps are kg-based, so an lb user
  gets 5.5lb jumps rather than 5lb. Worth doing if the app ever ships to lb
  users; irrelevant for one kg user.
- Tests: new `TESTS_nuisance.js` (21). Suite now **501 / 24 suites**, all
  passing.

### v1.2.0 — 2026-09-24 (loads you can actually put on the bar)
- **Bug: a hold changed the weight.** Walking Lunge, 9kg × 10/10/10, verdict
  "target met at the limit — repeat this", suggestion **8.8kg**. Every
  suggestion was rounded to an absolute 1.25kg grid (`wStep()`), so 9 became
  8.75: lighter than the session it was repeating, and not a loadable dumbbell.
  Increments had the same problem (9 + 2.5 came out as 11.25).
- **Fix:** `snapLoad(kg, lastKg, ex)`. A hold returns the exact weight used; any
  change is whole steps of that exercise's own `exStep()` measured **from** that
  weight. Also applied to deload weeks and the assisted range readout, which
  showed "31.3–33.8kg assist" on a 5kg stack.
- **A change smaller than half a step now holds the weight and asks for a rep**
  rather than overshooting to a whole step (a 1kg "small increase" on a 5kg
  machine stack became +5kg).
- **Backoff floor.** 5% of 20kg is 1kg, which a 5kg stack can't express. A miss
  within one rep of target repeats the weight ("repeat 20kg and complete every
  set"); a bigger miss drops a whole step, since that's the only loadable way to
  make it easier. Messages name the actual weight instead of claiming "5%".
- **New: "can't drop weight?"**, the mirror of the existing "can't add weight?".
  Holds the load and rebuilds to the reps completed on every set
  (`holdWeightRepBackoff`), with the same undo. On assisted machines it reads
  "can't add assistance?" and the directions swap.
- Touches: `index.html` (`snapLoad`, `ProgressionEngine.suggest` rounding and
  backoff branch, three deload call sites, assisted range readout,
  `holdWeightRepBackoff`, sugline link, workout click handler), `sw.js` (BUILD).
  `PROGRESSION-MODEL.md` §6c added. `TESTS_assisted.js` updated: a 2.5kg drop
  isn't loadable on a 5kg stack, so a strong session now holds and adds a rep
  (it still drops when the exercise's step allows it).
- Tests: new `TESTS_loadsnap.js` (24). Suite now **479 / 23 suites**, all
  passing. Checked visually at phone width.

### v1.1.0 — 2026-09-22 (versioning + What's new screen)
- **Versions.** `APP_VERSION` ("1.1.0") is the user-facing version and moves
  independently of `SCHEMA_VERSION` (the shape of stored data). Releases from
  here on are headed with it, patch for fixes, minor for new behaviour.
- **`WHATS-NEW.md`** holds the latest release in plain language and is the
  source of truth for the in-app notes. The app is one offline file and can't
  fetch it, so the same notes live in `RELEASES[0]` in `index.html`;
  `TESTS_about.js` fails if they drift by a word.
- **In-app What's new.** Settings → About shows the version, release date and a
  *What's new in x.y.z* button. After an update, Home shows one dismissable card
  ("Lift Daddy 1.1.0 · Bug fixes and changes since your last version") with
  *Dismiss* and *What's new*; reading or dismissing it records
  `settings.lastSeenVersion` so it doesn't come back. Installs that predate
  versioning see it once; fresh installs never do.
- Touches: `index.html` (`APP_VERSION`, `RELEASES`, `whatsNewModal()`, Home
  update card, Settings About card, `.update-card`/`ul.whatsnew` CSS,
  `lastSeenVersion` defaulting), `WHATS-NEW.md` (new), `sw.js` (BUILD).
- Tests: new `TESTS_about.js` (22). Suite now **453 / 22 suites**, all passing.
  Checked visually at phone width.

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
