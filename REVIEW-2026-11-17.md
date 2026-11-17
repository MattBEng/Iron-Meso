# Lift Daddy review, 17 Nov 2026 (v1.4.0)

Scope: all of `index.html` and `sw.js` read end to end, test suite run (564 pass, 1 fail).
Nothing in the app was changed by this review.

- **[tested]** = reproduced with a throwaway probe script against the real app.
- **[read]** = found by reading the code, not reproduced.

Line numbers are for v1.4.0 and will drift. Function names are the reliable handle.

---

## A. Bugs, ranked

### 1. Editing a past workout wipes warm-up flags and hold times [tested]
`startLogEdit` (~2979) copies only kg / reps / RIR for each set. `saveLogEdit` writes that back.
Open any past workout, tap Save changes, and:
- warm-up sets become working sets (they now count in volume, PRs and progression)
- AMRAP / myorep flags are lost, so the engine starts judging those sets
- timed holds lose their seconds (a 45s plank is saved as nothing)
- bodyweight exercises show a weight box of 0, holds show as weight x reps

This is the only one that damages saved data.
Fix: copy the whole set (`{...x, done:true, touched:true}`) and run `upgradeSession` on edit sessions so the bodyweight/timed flags are set.

### 2. Bonus workouts are missing from the Stats tab [tested]
The Home volume card and the block summary count them. The Stats tab under "Current: (meso)" does not, because `inScope` (~4588) matches `mesoId` only and a bonus log has `mesoId:null`.
Fix: `x.mesoId===id || x.bonusOf===id`.

### 3. A bonus workout cannot be deleted [tested]
Last session's handover said it could be deleted from the calendar. That was wrong. `dayModal` (~4203) only shows the delete button when `logEditable` is true, which is never true for a bonus.
Fix: show delete for bonus logs.

### 4. Ending a meso mid-bonus brings the old workout back [tested]
End / delete / repeat meso clear `activeSession` but not `parkedSession`. Finish the bonus afterwards and the parked workout of the ended meso is restored as the current session.
Fix: clear `parkedSession` in those three places.

### 5. Deload week makes assisted exercises harder [tested]
Deload sets the load to 60% of last time. For an assisted exercise that is 60% of the assistance: 50kg assist becomes 30kg.
Three copies: ~2461, ~3023, ~4181.
Fix: skip the 60% rule for assisted lifts (or raise the assistance).

### 6. One bad recovery survey throttles progression until the next survey [tested]
`suggest()` (~1087) reads the latest survey with no age check. A poor one from ten months ago still returned "recovery is poor, hold here" on a session that should have added load. Skipping the survey, bonus workouts (no survey) and deleting a workout all leave the old one in charge.
The same stale entry feeds the Recovery/Sleep pills on Home's last workout card (~1611) and the Fatigue pill in Stats.
Fix: use a survey only if it belongs to the most recent logged workout (`logId`) or is under about 10 days old.

### 7. "+ Add exercise" judges you against 10 reps at 2 RIR [read]
Hard-coded at ~3379. In a bonus workout, a lift your meso programs at 6 reps gets a "fell short, back off" suggestion and 10-rep rows.
Fix: look the exercise up in the active meso and use that slot's reps and RIR.

### 8. Today's session does not refresh after you edit or delete a past workout [read]
Opening Train creates the session and freezes its suggestions. Fixing last week's log afterwards changes nothing on screen.
Fix: after `saveLogEdit` / delete, rebuild the active session if it has no logged sets.

### 9. "+ New" meso then leaving by the bottom nav leaves a blank-named meso [tested]
It is saved the moment the editor opens, with an empty name, and becomes the active meso if there was none.
Fix: default name, or remove it if untouched.

### 10. Switching the active meso with a workout in progress [read]
The session stays tied to the old meso. Home says "Start workout" but opens the old one, and it logs to the old meso.
Fix: clear an untouched session on activate, warn if it has sets.

### 11. Dismissing the post-workout survey with Back leaves the finished workout on screen [read]
The log is already saved. The screen is stale and still tappable.
Fix: go Home before opening the survey.

### 12. Full-backup import leaves exercise history stale until the next save [tested]
`import()` never invalidates `HistoryIndex`. One line.

### 13. "Erase all data" can silently fail [read]
If a setting was changed in the half second before, the unload flush writes the data back. One line: clear `_dirty` before reload.

### 14. In-workout cardio is matched by meso + date, not by workout [read]
- Deleting a workout leaves its cardio behind.
- Editing a workout removes all in-workout cardio for that meso on that date, including cardio from a second session the same day (a bonus).
Fix: stamp cardio entries with the `logId`.

### 15. Smaller ones [read]
- Block summary "% completed" counts skipped workouts as completed (~2796). Stats gets it right.
- lb mode only: several numbers are kg with an lb label or no conversion (block summary volume, Home last-workout volume, the celebration fact, increments in Settings).
- Auto-backup records itself as done before the download is attempted. If the browser blocks an untapped download you get no backup and no warning for another 7 days. Worth checking that backups are actually landing on the phone.
- `checkPR` and `maybeCelebrate("pr")` both toast for the same PR; the second replaces the first.
- The strain formula differs between the engine (`5 - recovery`) and Stats (`6 - recovery`).

---

## B. Housekeeping

- **The 1 failing test is a false alarm.** `TESTS_messages.js` fails because `index.html` is checked out with Windows line endings and `MESSAGES_build.js` compares against Unix ones. A rebuilt copy was identical apart from line endings. Do not run the build on Windows as it stands: it writes mixed line endings. Fix: make the build script ignore/match line endings (3 lines), or set `eol=lf` in `.gitattributes`.
- **`sw.js` BUILD stamp was not bumped for 1.4.0** (step 5 of the loop, missed last session). Low impact because the page is fetched network-first.
- **Dead code:** `enableCardDrag` (85 lines, never called), `mesoStartDate`, `REP_CEILING_OVER_TARGET`, `const bs`, `bw2`, the `window.refreshCard` line.

---

## C. Optimisations

1. **App start on weak signal [read].** The service worker tries the network first with no timeout, then falls back to the cached copy. On poor gym reception the app waits on the network before it opens. Serve the cached copy immediately and refresh in the background (or use a 2 to 3 second timeout). This is the one speed change worth making.
2. **Manifest is an inline `data:` URL [not verified on the phone].** Relative icon and start URLs cannot resolve against a `data:` URL, so Chrome may be installing the app as a plain shortcut instead of a full PWA. A real `manifest.json` is the safe fix.
3. **History index is rebuilt after every save**, including each keystroke in a set box. Fine at today's history size. Invalidate only when logs change if it ever feels slow.
4. `defaults()` runs three times at boot and seeds templates each time. Trivial.

General speed is fine. Nothing else is worth chasing.

---

## D. Using less AI per change

Where it goes:
- `index.html` is about 300KB. A full read is very roughly 85,000 tokens (estimate).
- A long chat re-sends its whole history every turn.
- Fixed overhead per change: version bump, WHATS-NEW, RELEASES, CHANGELOG, sw stamp, commit message.
- Test output: a full run prints about 565 "OK" lines.

In order of payoff:

1. **New chat per change, and name the screen.** "Train tab, set menu: add X" lets a session grep straight to it.
2. **Put the map and data model below into `PROJECT-NOTES.md`**, with a rule at the top: do not read `index.html` in full; use the map, grep, read the one function. The data model is what takes longest to work out from the code.
3. **One release script** (`TOOLS_release.js "1.4.1" "note"`): bumps `APP_VERSION`, `RELEASES[0]`, `WHATS-NEW.md` and the `sw.js` stamp together. Four hand edits become one command, and the sw stamp cannot be forgotten.
4. **Quiet test runner:** print failures and the total only.
5. **Batch small fixes.** The fixed overhead is paid once per session, not once per fix.
6. **Cap CHANGELOG entries at about 5 lines.** The 1.4.0 entry is 25.
7. **Smaller model for small fixes**, the big one for design and reviews.
8. **Do not split `index.html` into source files yet.** It would make each piece cheaper to read, but it adds a build step that can drift, and the false test failure above is that exact failure mode. With a map the file does not need reading in full anyway. Revisit past about 400KB.

---

## Appendix 1: code map (v1.4.0)

| Lines | What |
|---|---|
| 14-387 | CSS |
| 404-500 | utilities, exercise library |
| 502-546 | `APP_VERSION`, `RELEASES` |
| 548-748 | migrations, `StorageManager` (load, save, flush, backup, export, import) |
| 750-780 | `HistoryIndex` (per-exercise history cache), `Store`, `S()` |
| 782-858 | units, load-rep model, `exStep`, `snapLoad`, `repCeilingFor` |
| 878-934 | cardio zones |
| 938-1017 | Fun/Serious terms, celebration, `exerciseHistory`, `progHistory` |
| 1019-1201 | `rampedSets`, `ProgressionEngine.suggest` |
| 1203-1315 | `ChartManager` |
| 1317-1479 | toast, modal, router `go()`, back-button model, nav |
| 1481-1526 | `mesoPosition`, `logEditable`, `streakCount` |
| 1528-1767 | Home (`mesoVolume`, `VIEWS.home`, cardio and bodyweight modals) |
| 1769-2189 | Mesos list, `mesoMenu`, `seedTemplates`, `editMeso`, `editSlot`, `pickExercise` |
| 2191-2301 | Exercise list, `editExercise`, exercise history view |
| 2303-2426 | set-row builders, `buildGhostRows`, `retargetSessionExercise`, `upgradeSession` |
| 2428-2476 | `VIEWS.workout` (creates the session) |
| 2478-2722 | card HTML, set rows, last-time hints, hold-weight helpers |
| 2723-2880 | `repeatMeso`, `mesoSummary`, block summary screen |
| 2881-3124 | `renderWorkout`, `workoutPicker`, `startLogEdit`, `startFuturePreview`, `saveLogEdit` |
| 3126-3448 | `refreshCard`, `bindWorkout` (all Train tab input and tap handling) |
| 3537-3738 | swipe, `scopePrompt`, `exerciseMenu` |
| 3739-3912 | `checkPR`, rest timer (message bank 3754-3854), `maybeCelebrate` |
| 3913-4100 | skip, bonus workout, `finishWorkout`, `feedbackSurvey` |
| 4102-4248 | Calendar, `dayModal`, `confirmDeleteLog` |
| 4250-4523 | cutie layer (message banks 4256-4502) |
| 4525-4951 | Stats |
| 4953-5105 | Settings, import, wipe |
| 5107-5198 | theme, service worker registration, single-instance guard, boot |

## Appendix 2: data model

State (`localStorage` key `ironmeso_v1`):
`settings, profile, exercises[], mesocycles[], logs[], cardio[], bodyweight[], feedback[], activeMesoId, activeSession, parkedSession, editSession`

- **meso** `{id, name, weeks, deload, split, archived, rampSets, startSets, endTargetSets, priority{muscle: high|normal|low}, repeatRun, notes, days[{id, name, exercises[slot]}]}`
- **slot (lift)** `{id, exerciseId, sets, reps, rir, rest, notes, secs?}`
- **slot (cardio)** `{id, exerciseId, cardio:true, minutes, targetHR, tabataOn, tabata, notes}`
- **log** `{id, mesoId, week, dayId, dayName, date, notes, durationMin, loggedAt, exercises[{exerciseId, target, notes, sets[]}]}` plus `skipped:true` (marker, no exercises) or `bonus:true, bonusOf:<mesoId>, mesoId:null`
- **set** `{kg, reps, rir, expReps, done, at, type?, secs?}` where type is `warmup | amrap | my | mm` (absent = normal). Weights are always stored in kg.
- **session** (a log in progress) adds `startedAt, deload, mesoName` and per exercise `{slotId, bodyweight, timed, cardio, target, suggestion, holdWeight, skipped, sets}`; cardio cards use `log{minutes, avgHR, ...}` and `done`
- **edit session** is a session with `mode:"edit", logId, readonly, future`
- **cardio entry** `{id, date, type, minutes, avgHR, zone, distanceKm, level, speed, incline, notes, mesoId, fromWorkout}`
- **feedback** `{date, logId, difficulty, recovery, motivation, sleep, jointPain, fatigue}` (1 to 5)

Rules that are easy to trip on:
- Position in a meso is the count of logs with that `mesoId`. A skip is a marker log. A bonus has `mesoId:null` so it never moves the position.
- Opening the Train tab creates `activeSession` and freezes its suggestions.
- Progression reads `progHistory()` (bonus excluded). Stats and PRs read `exerciseHistory()` (bonus included).
- Everything that totals training must filter `isWarm(set)` and `log.skipped`.
