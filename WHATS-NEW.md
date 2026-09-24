# What's new

The latest release, in plain language, as the app shows it.

**This file is the source of truth for the in-app What's new screen.** The app is
one self-contained offline file, so it can't read this at runtime: the same notes
live in `RELEASES[0]` in `index.html`, and `TESTS_about.js` fails if the two drift
apart. Update both when you ship, and add the engineering detail to
`CHANGELOG.md` rather than here.

## 1.2.0 — 2026-09-24

- Suggested weights are now ones you can actually load. "Repeat this" keeps the exact weight you used (9kg stays 9kg, not 8.8), and changes move in that exercise's own step.
- When a change is smaller than the smallest plate or pin you have, it holds the weight and asks for an extra rep instead of jumping a whole step.
- New "can't drop weight?" option, the mirror of "can't add weight?": keeps the weight and rebuilds to the reps you completed.
- Missing your target by one rep now repeats the same weight. A bigger miss still drops a step.
