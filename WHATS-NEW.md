# What's new

The latest release, in plain language, as the app shows it.

**This file is the source of truth for the in-app What's new screen.** The app is
one self-contained offline file, so it can't read this at runtime: the same notes
live in `RELEASES[0]` in `index.html`, and `TESTS_about.js` fails if the two drift
apart. Update both when you ship, and add the engineering detail to
`CHANGELOG.md` rather than here.

## 1.5.0 — 2026-11-17

- Cutie Points have had a glow-up: every workout now earns its own points (100 for finishing, 10 per working set, 3 per cardio minute, plus 50 for keeping your weekly streak). You see what you earned on the finish screen.
- Your points are now one lifetime total, the same everywhere, and your title follows it. Tap the total on Stats to see where your points came from.
- Your three cutest workouts ever show on Home and Stats as gold, silver and bronze. Tap one to look back at it.
- Beat your best ever workout and you get confetti. Beat everything from the last week and you get a little shout-out too.
