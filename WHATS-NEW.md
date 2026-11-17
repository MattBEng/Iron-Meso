# What's new

The latest release, in plain language, as the app shows it.

**This file is the source of truth for the in-app What's new screen.** The app is
one self-contained offline file, so it can't read this at runtime: the same notes
live in `RELEASES[0]` in `index.html`, and `TESTS_about.js` fails if the two drift
apart. Update both when you ship, and add the engineering detail to
`CHANGELOG.md` rather than here.

## 1.7.4 — 2026-11-17

- Each new title is a little more special now: its colour comes with its own effect, like floating hearts, a neon glow, a rolling wave, bubbles or a rose-gold shine, and its unlock rains its own emojis.
- Your title on Home and Stats now has a frame that upgrades from bronze to silver to gold as you climb.
- When a secret title comes into view, it's revealed on Stats with a little shake. Each title also brings its own new lines to the rest timer and finish screen.
- And there's a surprise waiting at the very top. 👑
