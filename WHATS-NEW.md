# What's new

The latest release, in plain language, as the app shows it.

**This file is the source of truth for the in-app What's new screen.** The app is
one self-contained offline file, so it can't read this at runtime: the same notes
live in `RELEASES[0]` in `index.html`, and `TESTS_about.js` fails if the two drift
apart. Update both when you ship, and add the engineering detail to
`CHANGELOG.md` rather than here.

## 1.7.5 — 2026-11-17

- Assisted exercises now score the right way round: using less assistance earns the PR and beat-last-time points, not more.
- Deleting an old plan no longer takes points off your total.
- Forgot to set a holiday pause before you left? You can now add the dates after you're back, and recent past pauses show in Settings so you can remove them.
- A newly revealed secret title now waits until the Cutie progress section is open, so you never miss the reveal.
- Stats and Settings open faster as your history grows.
