# What's new

The latest release, in plain language, as the app shows it.

**This file is the source of truth for the in-app What's new screen.** The app is
one self-contained offline file, so it can't read this at runtime: the same notes
live in `RELEASES[0]` in `index.html`, and `TESTS_about.js` fails if the two drift
apart. Update both when you ship, and add the engineering detail to
`CHANGELOG.md` rather than here.

## 1.14.0 — 2026-11-20

- Daisy's outfits now come with their own moves: a wink with the sunglasses, a cap flip, picking daisies in the sun hat, a twirl in the dress, and a wizard run with a wand in the cape.
- She does them at random alongside her other moves, only while she's wearing that item, and a tap can set one off too. With a hat and an outfit on she takes turns.
