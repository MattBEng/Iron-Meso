# What's new

The latest release, in plain language, as the app shows it.

**This file is the source of truth for the in-app What's new screen.** The app is
one self-contained offline file, so it can't read this at runtime: the same notes
live in `RELEASES[0]` in `index.html`, and `TESTS_about.js` fails if the two drift
apart. Update both when you ship, and add the engineering detail to
`CHANGELOG.md` rather than here.

## 1.7.1 — 2026-11-17

- With Cutie on, Stats is now all about you: your title journey with how long to the next one at your pace, every badge you've unlocked, and your Cutie stats. The PR, strength-across-plans, cardio and body sections are gone from this view.
