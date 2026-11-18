# What's new

The latest release, in plain language, as the app shows it.

**This file is the source of truth for the in-app What's new screen.** The app is
one self-contained offline file, so it can't read this at runtime: the same notes
live in `RELEASES[0]` in `index.html`, and `TESTS_about.js` fails if the two drift
apart. Update both when you ship, and add the engineering detail to
`CHANGELOG.md` rather than here.

## 1.9.2 — 2026-11-18

- Daisy's tricks are easier to find: every third tap does something silly, and five quick taps gets her cross. Do that twice in 30 seconds and she leaves the page for a couple of minutes.
