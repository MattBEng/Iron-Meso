# App store options, and what must not break

Written 17 Nov 2026 at v1.8.0. Nothing here is built. It records the options
Matt has for putting Lift Daddy on an app store, and what the app must keep
doing so those options stay open.

**Read this before any major change**: restructuring `index.html`, changing
hosting or the site address, adding a backend or accounts, adding anything that
talks to the network, or changing how data is stored. Run the checklist in
section 3 and say in the handover whether anything on it is affected.

Fees and store rules change. The figures below were checked on 17 Nov 2026.
Check them again before acting on them.

---

## 1. The options

### A. Google Play, the app as it is (cheap, realistic)

A thin Android wrapper (a Trusted Web Activity, built with Google's Bubblewrap
tool or PWABuilder) opens the existing site full screen. No native code. The
app keeps updating from GitHub pushes exactly as it does now.

Needs:
- A real `manifest.json` file. Today the manifest is an inline `data:` URL in
  `index.html`, which the wrapper tools cannot read.
- A `/.well-known/assetlinks.json` file on the site, which proves the wrapper
  is allowed to open it. It is tied to the site address and the signing key.
- A Google Play developer account: US$25, once.
- **Personal accounts opened after 13 Nov 2023 must run a closed test with 12
  testers opted in for 14 days in a row** before going public. Organisation
  accounts are exempt.
- Store listing: screenshots, description, a 1024 x 500 feature graphic, a
  privacy policy page, Google's data safety form and content rating form.

Effort: a few sessions, plus the two-week tester wait on a personal account.

### B. Apple App Store (harder, leave until asked for)

- Membership is US$99 a year (about A$149). If it lapses the app is removed
  from sale.
- Apple tends to reject apps that are only a website in a shell. It would need
  a proper wrapper (for example Capacitor) with some native features, a Mac to
  build it, and human review on every update. This point is from general
  knowledge, not checked on 17 Nov 2026.

### C. A product for strangers (a real project, separate decision)

Either store, this is where the work is:
- **Data safety.** Everything lives in one phone's `localStorage`. A product
  needs accounts and cloud backup. `PROJECT-NOTES.md` section 7 currently rules
  that out, so this would be a deliberate reversal.
- **Built for two people.** Cutie thresholds are tuned to one person's pace.
  Titles, messages and the male/female switch assume one household.
- **Onboarding.** Goal, equipment, experience, "here is your plan".
- **Content.** The name, the Cutie messages and some emojis need checking
  against store content rules and age ratings.
- **Legal.** Privacy policy, terms, a "not medical advice" line, a support contact.
- **Money.** If it is paid, the stores take a cut and a business is needed to
  receive it. Get advice from an accountant first.
- **Code shape.** One ~370 KB file needs splitting, with a proper build.

### Recommended order

1. Option A, unlisted or to a small test group.
2. Decide later whether option C is wanted at all.
3. Option B only if someone asks for an iPhone version.

---

## 2. Why the checklist exists

The wrapper in option A is only a window onto the live site. Anything that
breaks the site as an installable, offline web app breaks the store app too.
And the user's data is tied to the site address, so some changes would not
just break the app, they would strand existing data.

---

## 3. Checklist before a major change

Each line is something that works today. A change that affects one of them
needs Matt's say-so first.

**Data**
- [ ] The site address stays `lift-daddy.pages.dev`. `localStorage` belongs to
      the address: move the site and every existing user's data is left behind.
      The store wrapper's verification file is tied to the address too.
- [ ] The storage key stays `ironmeso_v1`.
- [ ] Any change to the shape of saved data comes with a new migration and a
      `SCHEMA_VERSION` bump. Old saved data must still load.
- [ ] Export and import still round-trip everything, including `cutie` and
      `pauses`. This is the only way to move data today and the likely basis
      for any cloud backup later.
- [ ] Points, titles and stats stay worked out from the logs, not stored
      separately, so an import or a sync cannot leave them disagreeing.

**Still a working web app**
- [ ] It opens and works with no connection (service worker plus cached shell).
- [ ] It is still installable: manifest, 192 and 512 icons, maskable icons.
- [ ] It is still served over https from the one address, with `sw.js` at the root.
- [ ] A push to GitHub still updates installed copies without the user doing anything.

**Privacy stays simple**
- [ ] No network calls to anywhere but its own files. No analytics, no fonts or
      scripts from other sites, nothing uploaded. Today the store privacy forms
      can truthfully say "collects no data". The first outside call changes that.
- [ ] Share cards and backups stay on the phone (share sheet or Downloads).

**Works inside a wrapper**
- [ ] Nothing depends on the browser's address bar, tabs or menus.
- [ ] The hardware back button still closes popups and returns Home.
- [ ] File features still work: backup export, import, share cards. These need
      a real test inside the wrapper before release, not just in Chrome.

**Product path stays open (option C)**
- [ ] New personal content stays behind a setting or the Cutie switch, never
      hard-wired for everyone.
- [ ] Message banks stay in `MESSAGES.txt`, not scattered through the code.
- [ ] No new feature assumes there is only ever one user on one phone, where
      it is cheap to avoid.

---

## 4. Known blockers today

Things that already stand in the way and are not yet fixed:

- **Manifest is an inline `data:` URL.** Needs to become a `manifest.json`
  file before option A. May also mean Chrome installs the app as a plain
  shortcut today. See `REVIEW-2026-11-17.md` section C.
- **App start on weak signal.** The service worker waits on the network before
  using the cached copy. Store reviewers and users will both notice. Same review, section C.
- **Review items A8 to A15** are still open.
- **File size.** `index.html` is ~370 KB in one file. Fine for options A and B,
  a problem for C.

---

## 5. Sources (checked 17 Nov 2026)

- Google Play Console Help, testing requirements for new personal accounts:
  https://support.google.com/googleplay/android-developer/answer/14151465
- Google codelab, adding a PWA to Google Play:
  https://developers.google.com/codelabs/pwa-in-play
- Bubblewrap and Trusted Web Activities:
  https://www.thinktecture.com/en/pwa/twa-bubblewrap
- Apple and Google developer fees:
  https://magora-systems.com/apple-developer-fee/
