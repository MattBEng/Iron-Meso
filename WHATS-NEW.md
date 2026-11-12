# What's new

The latest release, in plain language, as the app shows it.

**This file is the source of truth for the in-app What's new screen.** The app is
one self-contained offline file, so it can't read this at runtime: the same notes
live in `RELEASES[0]` in `index.html`, and `TESTS_about.js` fails if the two drift
apart. Update both when you ship, and add the engineering detail to
`CHANGELOG.md` rather than here.

## 1.4.0 — 2026-11-12

- New Bonus workout: on the Train page tap ⋯ in the top right to do an extra session on a blank page. It's logged in your history and stats, doesn't use up a meso day, and the workout you put on hold is next once you finish.
