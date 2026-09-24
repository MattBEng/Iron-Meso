# What's new

The latest release, in plain language, as the app shows it.

**This file is the source of truth for the in-app What's new screen.** The app is
one self-contained offline file, so it can't read this at runtime: the same notes
live in `RELEASES[0]` in `index.html`, and `TESTS_about.js` fails if the two drift
apart. Update both when you ship, and add the engineering detail to
`CHANGELOG.md` rather than here.

## 1.2.1 — 2026-09-24

- The "smallest weight jump" box now shows and saves in your unit. In lb it showed the kg number and quietly shrank it every time you saved.
- A 1.25kg microplate step no longer displays as 1.3.
- When a jump is too small to load, the message names the jump ("can't load less than 5kg here") instead of the weight you're repeating.
- Timed holds no longer get a rep suggestion meant for bodyweight exercises.
- A workout accidentally dated in the future no longer sits at the top of your streak or makes "days since last workout" read 0.
- An exercise you have done before no longer says "First time" when it can't suggest a weight. It shows what you actually did.
