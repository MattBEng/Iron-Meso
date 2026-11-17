# What's new

The latest release, in plain language, as the app shows it.

**This file is the source of truth for the in-app What's new screen.** The app is
one self-contained offline file, so it can't read this at runtime: the same notes
live in `RELEASES[0]` in `index.html`, and `TESTS_about.js` fails if the two drift
apart. Update both when you ship, and add the engineering detail to
`CHANGELOG.md` rather than here.

## 1.4.2 — 2026-11-17

- Bonus workouts now count in the Stats tab for your current meso, and you can delete one from the calendar.
- Ending, deleting or repeating a meso while a bonus workout is open no longer brings the old meso's workout back afterwards.
- Deload weeks no longer make assisted exercises harder. They keep last week's assistance and halve the sets.
- An old recovery survey no longer holds back your progression. Only a survey from your latest workout or the last 10 days counts, on Home and Stats too.
- Adding an exercise mid-workout now uses the reps and RIR your meso sets for that lift, instead of 10 reps at RIR 2.
