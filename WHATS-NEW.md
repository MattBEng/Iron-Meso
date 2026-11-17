# What's new

The latest release, in plain language, as the app shows it.

**This file is the source of truth for the in-app What's new screen.** The app is
one self-contained offline file, so it can't read this at runtime: the same notes
live in `RELEASES[0]` in `index.html`, and `TESTS_about.js` fails if the two drift
apart. Update both when you ship, and add the engineering detail to
`CHANGELOG.md` rather than here.

## 1.9.1 — 2026-11-18

- Daisy can now be tapped on the Train page too. After her fifth-tap trick she waddles to the other corner, and if you push your luck with the knife she leaves that page for a couple of minutes.
