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
| Streak week | 50 | First scheduled workout of a Mon-Sun week when the week before also had one |

- Bonus workouts earn the base, sets and cardio, but not the streak bonus.
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
  points, unlock all (top threshold), back to real points, fire confetti / new
  best / weekly best / finish screen, reset.
- A yellow DEV badge shows top right while it's on.

## Still to build (from the spec)

- 1.6.0: title progress bar, title unlock celebration and saved unlock dates,
  title list, weekly and monthly totals, colour scheme unlocks (Mint Mojito at
  Fit Queen, Angel Glow with gold sparkle at Iron Angel, Midnight Baddie,
  Bubblegum Pop, Rose Gold, Goddess).
- 1.7.0: bonus points (PR, full workout, beat last time, comeback), badges
  (50 points each, names in `MESSAGES.txt`), meso comparison in Stats.

## Tests

`TESTS_cutie.js`.
