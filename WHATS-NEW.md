# What's new

The latest release, in plain language, as the app shows it.

**This file is the source of truth for the in-app What's new screen.** The app is
one self-contained offline file, so it can't read this at runtime: the same notes
live in `RELEASES[0]` in `index.html`, and `TESTS_about.js` fails if the two drift
apart. Update both when you ship, and add the engineering detail to
`CHANGELOG.md` rather than here.

## 1.8.0 — 2026-11-17

- Share your wins: a new Share button on the finish screen and on title and badge unlocks makes a little picture card in your colours and opens your phone's share sheet, ready for Messages or any chat.
- The workout card leads with what you lifted, like 12 corgis or 3 grand pianos, never the actual kilos. Tap Another one to swap it for a funnier one before you send.
- You can also share a past workout: open it from your cutest workouts and tap its points.
- The lifted total on the finish screen now shows in pounds if that's your unit.
