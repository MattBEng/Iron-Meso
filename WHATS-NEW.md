# What's new

The latest release, in plain language, as the app shows it.

**This file is the source of truth for the in-app What's new screen.** The app is
one self-contained offline file, so it can't read this at runtime: the same notes
live in `RELEASES[0]` in `index.html`, and `TESTS_about.js` fails if the two drift
apart. Update both when you ship, and add the engineering detail to
`CHANGELOG.md` rather than here.

## 1.8.1 — 2026-11-17

- The Cutie points card now matches whichever colour theme you pick, instead of always being magenta.
- The Feel button on each set no longer cuts off: it now reads Easy, OK, Hard or Max.
