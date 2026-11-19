# What's new

The latest release, in plain language, as the app shows it.

**This file is the source of truth for the in-app What's new screen.** The app is
one self-contained offline file, so it can't read this at runtime: the same notes
live in `RELEASES[0]` in `index.html`, and `TESTS_about.js` fails if the two drift
apart. Update both when you ship, and add the engineering detail to
`CHANGELOG.md` rather than here.

## 1.13.0 — 2026-11-20

- Band exercises: pick the band colour (Yellow, Red, Green, Blue, Black) instead of a weight. It starts on the band you used last time.
- Warm-up exercises: tick "All sets are warm-ups" in an exercise's settings. Every set starts as a warm-up and doesn't count toward volume, stats or progression.
- New exercises: Band Pull-Apart, Band External Rotation and Arm Circles.
- Lisa's New Meso (both versions) now starts each day with a warm-up of arm circles, band pull-aparts and band external rotations. Notes are now just about each exercise.
