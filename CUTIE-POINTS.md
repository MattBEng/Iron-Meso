# Cutie Points

Reference for the Cutie layer's points system. The spec and Matt's decisions
live in the "Lift Daddy: Cutie Points v2 spec" doc; this file is the record of
what is actually built. Update it with every Cutie change.

## Who sees it

Fun mode with profile gender Female (`cutieOn()`). Nothing shows in Serious
mode or for other profiles. Dev mode can preview it on any profile.

## How points are worked out (1.5.0)

Points are calculated from the logs every time (`cutieLedger()`), never stored.
Editing a workout changes its points; deleting one removes them; a backup
import brings them all back.

| Source | Points | Notes |
|---|---|---|
| Workout finished | 100 | Skipped workouts earn nothing |
| Working set | 10 each | Warm-up sets don't count |
| Cardio | 3 per minute | In-workout and standalone cardio both count |
| Streak week | 50 | First scheduled workout of a Mon-Sun week when the week before also had one (holiday-paused weeks are skipped over) |
| PR | 50 each, max 3 | A working set's e1RM beats that lift's best from earlier workouts (warm-ups never count; first time on a lift isn't a PR) |
| Full workout | 30 | Every lift in the plan's day logged with all its target sets (not bonus workouts) |
| Beat last time | 10 per lift, max 50 | A lift's working volume beats the last time it was done (kg x reps; reps or seconds for bodyweight and holds) |
| Welcome back | 75 | First workout after 14 or more days off |
| Badge | 50 each | See Badges |

- Bonus workouts earn the base, sets, cardio, PR, beat-last-time and welcome-back points, but not the
  streak or full-workout bonus (they aren't part of the plan).
- **Bonuses are not retroactive** (Matt: points she didn't see happen wouldn't feel earned).
  `S().cutie.bonusFrom` is set to the moment 1.7.0 first runs; only workouts with `loggedAt` after it get
  bonus points. Earlier workouts are still read to know her previous bests and last-time volumes.
- Pace check on her backup (17 Nov): last 8 weeks averaged about 440 points a week, plus about 120 a week
  of bonuses going forward, so about 560. That puts Strong Sweetheart about 2 weeks away, Iron Angel about
  7, and Glute Goddess about 29 weeks (around June 2027). Matt doesn't want her finishing in a month; recheck
  if the pace changes a lot.
- In-workout cardio belongs to the first workout that day for the same meso
  (`mesoId`, or `bonusOf` for a bonus). Each cardio entry counts once.
- Cardio left in the cardio log after its workout is deleted counts as
  standalone cardio (cardio isn't linked to its workout yet, review item 14).
  A cardio-only workout has no workout log, so this also keeps it earning.
- The total is lifetime and the same everywhere. The Stats dropdown doesn't
  change it.

Why sets and not volume: volume (1 per 50 kg) favoured heavy lifting. On
Matt's partner's real data (Nov 2026) volume added only ~40 points to a
session, so hard and easy sessions scored the same. Sets reward effort evenly.

## Titles

| Title | Points |
|---|---|
| Gym Cutie | 0 |
| Hot Mumma | 2,000 |
| Fit Queen | 5,000 |
| Strong Sweetheart | 8,000 |
| Iron Angel | 10,500 |
| Barbell Baddie | 13,000 |
| Snack with Muscles | 15,500 |
| Certified Powerpuff | 18,000 |
| Dumbbell Darling | 20,500 |
| Glute Goddess | 23,000 |

`CUTIE_THRESHOLDS` in `index.html`; names come from `MESSAGES.txt`. Calibrated
on her backup of 17 Nov 2026: 29 workouts since 3 Aug, about 1.8 a week, 6,704
points, about 430 a week. She starts at Fit Queen; Glute Goddess is roughly 9
months away at that pace.

## Where it shows

- **Stats** (top, under the dropdown): title, lifetime total (tap for the
  breakdown), top 3 workouts as gold/silver/bronze, best this meso if it isn't
  in the top 3.
- **Home**: title, total, top 3.
- **Finish screen**: points earned with a line per source. Bonus workouts get
  the finish screen too when Cutie is on.
- **Calendar day popup** and **opening a past workout**: that workout's points
  (tap in the workout header for its breakdown).

## Stats page with Cutie on (1.7.1)

Matt's call: for her, Stats drops PRs this plan, Strength progression across blocks, Cardio (incl. minutes
by zone) and Body. It adds a "Cutie progress" section:

- **Title progression**: all 10 titles, reached dates, points to go, and an estimate of weeks to the next
  one from her pace (points in the last 8 weeks / 8, `cutiePace`).
- **Badges unlocked**: a tile per badge, earned ones dated, locked ones with what earns them.
- **Cutie stats**: points per workout, best week and month, streak weeks, PR bonuses, full workouts,
  lifts beaten, welcome backs, cardio minutes.

Everyone else sees the original Stats page.

## Celebrations

- **New all-time best**: banner plus confetti. Never on the first ever workout.
- **Best of the last 7 days**: smaller banner, no confetti. Needs at least one
  other workout in that window.
- Checked once, at finish (`cutieBestCheck`), so a later edit never re-fires.
- Confetti is a canvas drawn in `confetti()`, no library. Skipped when the
  phone asks for reduced motion.

## Dev mode

Settings > tap the version number 7 times (within 1.5 s gaps). Again to turn
off.

- State lives in its own localStorage key, `liftdaddy_dev`, never in
  `ironmeso_v1`, exports or backups. Turning it off deletes the key.
- Panel at the bottom of Settings: preview Cutie on any profile, set or add
  points, unlock all (top threshold, opens every scheme), back to real points,
  fire title unlock / confetti / new best / weekly best / finish screen, reset.
- Dev never writes title records. Turning dev off resets a scheme she hasn't
  really earned back to the default.
- A yellow DEV badge shows top right while it's on.

## Titles and unlocks (1.6.0)

- `S().cutie.titles` saves the date each title was first reached (title index
  to date). It's part of the data, so backups carry it. On first run after
  1.6.0, titles already reached are recorded silently, dated that day.
- Checked at finish (`cutieSyncTitles`, real points only). A new title shows
  after the finish screen's "Yay": hearts and emoji shower (`emojiRain`,
  emojis in `CUTIE_RAIN`), the title in big text, and its colour scheme with a
  Try it button. Several at once show one after another.
- Titles and schemes never re-lock, even if points drop (deleting a workout).
- Progress bar under the title on Home and Stats. Tap the title for the list
  of all 10 with unlock dates, points to go, and which scheme each unlocks.
- Stats shows this week / best week, this month / best month, and a bar per
  week of the active meso (from its first workout, max 12; else last 8 weeks).

## Colour schemes

| Scheme | Unlocks at | Look |
|---|---|---|
| Mint Mojito | Fit Queen | Mint and teal |
| Angel Glow | Iron Angel | Pearl white and gold, gold sparkle in the background |
| Midnight Baddie | Barbell Baddie | Near-black and neon pink (best in dark mode) |
| Bubblegum Pop | Certified Powerpuff | Bubblegum pink and sky blue |
| Rose Gold | Dumbbell Darling | Blush and rose gold |
| Goddess | Glute Goddess | Plum and gold, shimmer on the points card |

- `CUTIE_SCHEMES` in `index.html`; each has light and dark CSS.
- Shown in Settings only with Cutie on; locked ones greyed with the title
  needed. `schemeAllowed()` stops a locked or Cutie-off scheme being applied
  (falls back to the default look without changing the saved setting).
- On these schemes the Cutie pink (`--cutie`) follows the scheme's accent.
- Sparkle and shimmer stop when the phone asks for reduced motion.

## Badges (1.7.0)

| # | Name (MESSAGES.txt) | Earned when |
|---|---|---|
| 1 | First Step | First workout logged |
| 2 | Ten Down | 10 workouts in one plan |
| 3 | Hundred Club | 100 workouts all-time |
| 4 | Triple Digits | A working set at 100 kg or more |
| 5 | Ton Up | 10,000 kg working volume in one workout |
| 6 | Never Missed | A finished plan with no skipped workouts |
| 7 | Cardio Cutie | 300 min of cardio in one plan |
| 8 | Early Bird | A workout's first set before 7 am |
| 9 | Bonus Babe | First bonus workout |
| 10 | Glow Up | A title beyond Gym Cutie reached |

- Rules in `BADGE_DEFS`; names in `MESSAGES.txt` `[BADGE NAMES]`, same order (rebuild after editing).
- Saved in `S().cutie.badges` (id to date), backed up. Kept once earned, even if the workout is deleted.
- Badges already qualified for when 1.7.0 first opens are recorded silently, dated that day, and carry
  **no points** (`S().cutie.badgesFree`). Only badges earned after that are worth 50.
- At finish: finish screen, then any title unlocks, then a badge popup with confetti.
- Listed under the titles (tap the title). Dev mode has a Badge button.

## Plan comparison (1.7.0)

Stats shows this plan's points, workouts and points per workout against the most recent other plan with
workouts (bonus workouts count toward the plan they were done in).

## Holiday pause (1.7.0)

- Settings > Holiday pause: from and to dates (up to 90 days, must not be over already). Stored in
  `S().pauses` [{id, from, to}], backed up, for everyone (not just Cutie).
- Paused days don't count as a gap in the workout streak (`streakCount`), and paused weeks are skipped
  when checking the Cutie streak week, so the streak carries on after the holiday.
- While a pause is on, Home shows an "On holiday" card and the streak pill says paused; the welcome-back
  card is hidden. The welcome-back bonus still applies on return (it's about motivation).

## Next (1.8.0, from the spec)

- Monthly recap, share card, seasonal points (e.g. double points over Christmas: needs to ship before then).

## Tests

`TESTS_cutie.js` (1.5.0), `TESTS_cutie16.js` (1.6.0), `TESTS_cutie17.js` (1.7.0), `TESTS_cutiestats.js` (1.7.1).
