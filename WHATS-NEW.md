# What's new

The latest release, in plain language, as the app shows it.

**This file is the source of truth for the in-app What's new screen.** The app is
one self-contained offline file, so it can't read this at runtime: the same notes
live in `RELEASES[0]` in `index.html`, and `TESTS_about.js` fails if the two drift
apart. Update both when you ship, and add the engineering detail to
`CHANGELOG.md` rather than here.

## 1.13.1 — 2026-11-20

- Pulling down to refresh now keeps you on the tab you were on, instead of jumping to Train.
- Ticking things in More (like Daisy's outfits) no longer scrolls you back to the top.
