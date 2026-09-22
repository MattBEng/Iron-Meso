# What's new

The latest release, in plain language, as the app shows it.

**This file is the source of truth for the in-app What's new screen.** The app is
one self-contained offline file, so it can't read this at runtime: the same notes
live in `RELEASES[0]` in `index.html`, and `TESTS_about.js` fails if the two drift
apart. Update both when you ship, and add the engineering detail to
`CHANGELOG.md` rather than here.

## 1.1.0 — 2026-09-22

- Version numbers, plus this What's new screen (Settings, or the card on Home after an update).
- Bodyweight rep targets now rebuild from the reps you actually managed, instead of sitting on a number you could never reach.
- Beating your plan's rep target no longer drops your weight 5%. It holds the load and asks you to beat it.
- Missing one rep on your last set no longer counts as a failed session.
- Exercise cards show the reps actually being asked for when that differs from the plan.
- Replacing an exercise mid-workout rebuilds the card properly, so a dumbbell move can't inherit bodyweight rows.
- Cardio you skipped, or never filled in, isn't logged any more.
- Stats: fixed completion %, PRs, per-week averages, and the scope dropdown; tidied into collapsible sections.
