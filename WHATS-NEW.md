# What's new

The latest release, in plain language, as the app shows it.

**This file is the source of truth for the in-app What's new screen.** The app is
one self-contained offline file, so it can't read this at runtime: the same notes
live in `RELEASES[0]` in `index.html`, and `TESTS_about.js` fails if the two drift
apart. Update both when you ship, and add the engineering detail to
`CHANGELOG.md` rather than here.

## 1.4.1 — 2026-11-17

- Editing a past workout no longer wipes your warm-up, AMRAP and myorep markings or your hold times when you tap Save changes. Bodyweight and timed exercises also show properly when you open an old workout.
