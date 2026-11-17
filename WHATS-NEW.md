# What's new

The latest release, in plain language, as the app shows it.

**This file is the source of truth for the in-app What's new screen.** The app is
one self-contained offline file, so it can't read this at runtime: the same notes
live in `RELEASES[0]` in `index.html`, and `TESTS_about.js` fails if the two drift
apart. Update both when you ship, and add the engineering detail to
`CHANGELOG.md` rather than here.

## 1.7.3 — 2026-11-17

- Titles now come one step at a time: each one takes a little longer than the last, and only your next three are shown. The rest are secret until you get closer.
- Every new title unlocks a colour. Three new ones join the set: Cherry Bomb, Lavender Haze and Ocean Babe.
- Title progression no longer guesses how many weeks a title will take.
