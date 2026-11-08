# What's new

The latest release, in plain language, as the app shows it.

**This file is the source of truth for the in-app What's new screen.** The app is
one self-contained offline file, so it can't read this at runtime: the same notes
live in `RELEASES[0]` in `index.html`, and `TESTS_about.js` fails if the two drift
apart. Update both when you ship, and add the engineering detail to
`CHANGELOG.md` rather than here.

## 1.3.0 — 2026-11-09

- Each set now shows what you did last time underneath it, like "last 100×10", so you know what to beat without leaving the workout.
- New Warm-up set type in the set menu, alongside AMRAP and Myorep. Warm-ups get a W badge and don't count toward volume, sets, PRs or progression, and logging one won't drag your working weight down.
