# Deploying YOUchi

A step-by-step runbook from this repository to the App Store and Google Play. Everything builds in the cloud with EAS, so no Mac is required for iOS. Budget two to three weeks end to end: the builds take an hour, the device test pass a day or two, and the store reviews and Google's closed-testing rule take the rest.

## Where things stand

Done:

- The app, audited and verified (typecheck, lint, 90 tests, bundle export, prebuild on both platforms).
- The website, live at https://noseandnose.github.io/youchi/ and republished on every push to `main`, with the privacy policy and a support page beside it.
- Store identifiers: bundle id and package `com.youchi.habits`, scheme `youchi`, widget extension and App Group.
- Store listing copy, privacy policy, deploy configuration (`eas.json`), icons and splash.

Still to do, in order:

1. Put a support email in `docs/PRIVACY.md` and `tools/site/pages.py` (both currently say "replace this line").
2. Phase 0 accounts: Expo (free), Apple Developer ($99/year, a day or two to activate), Google Play ($25, identity verification takes days). Start these first; everything else waits on them.
3. Phase 1: `eas init`, commit the project id.
4. Phase 2: development builds and the on-device checklist. This is the first time widgets, Health, notifications, camera and keyboard run on a phone.
5. Phase 3: store records, listings, privacy labels, health declarations, screenshots.
6. Phase 4 and 5: production builds, TestFlight, Play internal testing, then Google's 14-day closed test with 12 testers (start recruiting them during Phase 2).
7. Phase 6: release.

## Phase 0: accounts and tools (one afternoon)

1. **Expo account** (free): sign up at https://expo.dev. EAS Build has a free tier with a monthly build quota; a paid plan removes the queue wait.
2. **Apple Developer Program** ($99/year): https://developer.apple.com/programs/. Enrolment as an individual can take a day or two to activate. Required for TestFlight and the App Store.
3. **Google Play Console** ($25 once): https://play.google.com/console. Identity verification can take a few days. Note the closed-testing rule in Phase 5 before you plan a launch date.
4. **Tools on your computer**: Node 22.13+ and Git. Then:

```bash
npm install --global eas-cli
eas login
```

5. **Clone and install** on the branch you are shipping:

```bash
git clone https://github.com/noseandnose/youchi.git && cd youchi
npm install
npm run typecheck && npm run lint && npm test
```

## Phase 1: link the project to EAS (10 minutes)

```bash
eas init
```

This creates the EAS project and writes `extra.eas.projectId` into `app.json`. Commit that change. `eas.json` already defines three build profiles: `development` (dev client, internal distribution), `preview` (installable APK / ad-hoc IPA), and `production` (store builds with auto-incremented build numbers).

Decisions already made in `app.json`:

- Bundle identifier and package: `com.youchi.habits`. Change both before the first build if you want a different reverse-domain id; they cannot change after the first store submission.
- Widget extension bundle id `com.youchi.habits.widgets` and App Group `group.com.youchi.habits`. The `expo-widgets` plugin registers the extension with EAS, so EAS generates the extension's provisioning profile and entitlements for you.
- iPad support is off (`supportsTablet: false`). The layout is phone-only; turning it on would require iPad screenshots and an iPad review pass.
- HealthKit entitlement and usage strings, Health Connect permissions, notification icon and channel, camera and photo strings are all declared.

## Phase 2: development builds and the device test pass (one to two days)

The web preview cannot exercise widgets, Health, notifications, the camera, the share sheet or the keyboard. These need a real phone.

### iOS

Register the test iPhones (ad-hoc builds only install on registered devices):

```bash
eas device:create
```

It prints a link; open it on each iPhone and install the profile. Then build:

```bash
eas build --profile development --platform ios
```

The first run asks you to sign in with your Apple ID so EAS can create the signing certificate, the app and widget bundle ids, and the App Group on your developer account. Accept the defaults. When the build finishes, open the link on the iPhone to install it, then start the dev server on your computer:

```bash
npx expo start --dev-client
```

### Android

```bash
eas build --profile development --platform android
```

Install the APK from the build link, then run the same `npx expo start --dev-client`.

### What to test on each phone

Tick every item; each one is a feature the simulator never exercised.

- [ ] Onboarding end to end, then kill and relaunch: the pet and progress are still there.
- [ ] Keyboard: on Set your goals, Settings, the water custom amount, the custom goal and the pet rename, the focused field stays above the keyboard and Save buttons remain reachable.
- [ ] Reward banner appears over the content without moving the pet stage; hatch and evolution play without flicker (grind to 100 XP: three goals plus a bonus gets there in one day with water logged).
- [ ] Settings, Privacy and the widget how-to open as sheets; a toast fired inside them (save the step target) is visible on iOS.
- [ ] Widget: add the small and medium (iOS) or narrow and wide (Android) widget. It shows the pet in its mood; log water and confirm it updates within a few seconds; tap the Water, Move and Eat buttons and confirm each opens the right screen with a working back button.
- [ ] Health: turn on sync in Settings, grant access, walk or log a workout, and confirm movement completes itself. On iOS, deny access once and confirm the hint toast about Health → Sharing → Apps.
- [ ] Reminders: turn on the daily reminder, set a custom time two minutes ahead, lock the phone, confirm it fires with the pet's current need. Tap it; confirm the app opens. Repeat for the water nudge by setting the phone clock close to 1:00 PM if needed.
- [ ] Progress photo from the camera and from the library; the 3:4 crop; the gallery and the first-versus-latest comparison; delete a photo.
- [ ] Share card: Share, Save image (check Photos), Share link.
- [ ] Backup export, then reset all progress, then import the backup and confirm photos came back.
- [ ] Reduce Motion on in system settings: no animations, everything still usable.
- [ ] VoiceOver / TalkBack: the Today screen reads sensibly and every button has a name.
- [ ] Leave the app untouched for 36 hours (or edit the device clock) and confirm the pet is asleep on the widget and wakes on tap.

Fix anything you find, push, and rebuild. Development builds only need a rebuild when native modules or `app.json` change; JavaScript changes reload over the dev server.

## Phase 3: store records and the privacy policy (one hour)

1. **Privacy policy URL.** Already live: https://noseandnose.github.io/youchi/privacy.html (rendered from `docs/PRIVACY.md` by the website build). Support page for the App Store's Support URL: https://noseandnose.github.io/youchi/support.html. Both pages end with a contact line that still says "replace this line with your support email": put a real address in `docs/PRIVACY.md` and `tools/site/pages.py` before submitting.
2. **App Store Connect**: https://appstoreconnect.apple.com → Apps → New App. Platform iOS, name YOUchi, primary language, bundle id `com.youchi.habits` (it appears in the list once the Phase 2 build registered it), SKU `youchi-ios`. Note the numeric Apple ID shown under General Information; that is `ascAppId`.
3. **Google Play Console**: Create app → name YOUchi, app (not game), free. Package name is taken from the first upload.
4. Fill both listings from `docs/STORE_LISTING.md`: description, subtitle / short description, keywords, category Health & Fitness, age rating questionnaire (no objectionable content, no user-generated content, no ads), contact email, privacy policy URL.
5. **Privacy declarations**: App Store privacy label "Data Not Collected". Play Data safety: no data collected, no data shared, data is not encrypted in transit because nothing is transmitted, users can request deletion by resetting or uninstalling.
6. **Health declarations**:
   - Apple: in the review notes, state that HealthKit is read-only (steps and workouts) to complete the movement goal, data never leaves the device, and the feature is optional (Settings → Sync with Apple Health).
   - Google: Play Console → App content → Health apps declaration. Declare Health Connect read access to Steps and Exercise, give the same explanation, and link the privacy policy. Google reviews this separately; Health Connect permissions are rejected at runtime until it is approved, so submit the form with the first build.
7. **Screenshots**. Capture on the development build with the status bar clean (full battery, no notifications):
   - iPhone 6.9" (1320 × 2868) is the only required size; Apple scales it down for smaller devices. Six to eight shots: Today with the hatched pet, Today with the reward banner, the water log, My pet with gear, Journey with a streak, the widget on the home screen, the share card.
   - Android: at least two phone screenshots (1080 × 1920 works), a 512 × 512 icon (`assets/images/icon.png` is 1024, resize it), and a 1024 × 500 feature graphic (the cast image in `assets/brand/cast.png` on the background colour is a good base).

## Phase 4: production builds (one hour, mostly waiting)

Make sure the branch is clean and pushed, then:

```bash
eas build --profile production --platform all
```

Build numbers increment automatically (`autoIncrement` with `appVersionSource: remote`). The marketing version is `expo.version` in `app.json`; bump it by hand for each public release (1.0.0 → 1.0.1).

## Phase 5: submit and test through the stores

### iOS (TestFlight, then review)

```bash
eas submit --platform ios --latest
```

The first run asks for your Apple ID and sets up an App Store Connect API key for later runs. The build lands in App Store Connect → TestFlight within about 15 minutes. Add yourself and a few people as internal testers (no review needed, up to 100 people) and run the Phase 2 checklist once more on the production build: it is signed differently and runs without the dev server.

When satisfied: App Store Connect → the app → the 1.0 version → attach the build, fill the "What's New", choose manual release, and Submit for Review. Reviews usually take 24 to 48 hours. Common rejection reasons for an app like this, and the prepared answers:

- "Why does the app need HealthKit?" Optional, read-only, on-device; point them to Settings → Sync with Apple Health.
- "The privacy policy URL does not load." Check the Pages link in a private window.
- "Widget shows placeholder." The widget renders after the app has run once; mention that in the review notes and ask them to open the app first.

### Android (internal testing, closed testing, then production)

```bash
eas submit --platform android --latest
```

The first run walks you through creating a Google Service Account key and granting it access to the app in Play Console; EAS then uploads to the **internal testing** track. Share the internal testing link with yourself and run the checklist.

**The 12-tester rule.** Personal developer accounts created after November 2023 must run a **closed test with at least 12 opted-in testers for 14 continuous days** before Google grants production access. Plan for it: promote the build to a closed track, invite 12+ people by email (friends, family, a small community), and only after the 14 days apply for production access in Play Console. Organisation accounts skip this. Google's first production review can take up to a week; later updates are faster.

Health Connect: until the Health apps declaration from Phase 3 is approved, the permission prompt will fail on the Play-distributed build. Keep the sync toggle off in your screenshots and mention the declaration status in the review notes.

## Phase 6: release day

- iOS: release manually from App Store Connect once approved; turn on **phased release** so the rollout spreads over seven days and you can pause it.
- Android: use a **staged rollout** (start at 20%) on the production track.
- Pin the store links on the YOUchi website, and switch the share-card link in `src/app/(tabs)/pet/share.tsx` from the website to the store links in the next update.

## Phase 7: after launch

- Watch crashes in App Store Connect → Analytics and Play Console → Vitals for the first week. There is no third-party crash reporter; add one (Sentry's Expo SDK is a 15-minute install) if the store dashboards are not enough.
- Ship updates with the same loop: bump `expo.version`, `eas build --profile production --platform all`, `eas submit --platform <ios|android> --latest`, then release.
- Native code only changes when `app.json` plugins or dependencies change; JavaScript-only fixes still need a store build, because the app does not include `expo-updates`. Adding it later enables over-the-air fixes between store releases.

## Quick reference

| Step | Command |
|---|---|
| Link project | `eas init` |
| Register an iPhone | `eas device:create` |
| Dev build | `eas build --profile development --platform ios` / `android` |
| Run against a dev build | `npx expo start --dev-client` |
| Shareable test build | `eas build --profile preview --platform android` (APK) |
| Store build | `eas build --profile production --platform all` |
| Upload to TestFlight | `eas submit --platform ios --latest` |
| Upload to Play internal testing | `eas submit --platform android --latest` |
| Manage signing | `eas credentials` |

## The website

The same code runs in the browser and can be hosted as a static site, which gives people a way to try YOUchi without installing anything and doubles as a landing page for the store links.

What works on the web: onboarding, the three goals, water log, bonuses with a photo uploaded from the device, the pet, gear, evolution paths, journey, streaks, settings, backup export and import (as a downloaded JSON without photos), and the share link. Progress persists in the browser's local storage for that browser only. What does not: the home screen widget, Apple Health / Health Connect, notifications, the camera (the picker offers the photo library), and saving the share card to Photos. The app hides or disables each of those on the web.

Build:

```bash
npm run web:build
```

This copies the CanvasKit runtime into `public/` and exports a static site to `dist/`: one `index.html`, one JavaScript bundle (about 5 MB uncompressed, under 1 MB over the wire with compression), the pixel assets, and `canvaskit.wasm` (8 MB, about 3 MB compressed). The first visit takes a few seconds on mobile data; later visits are cached.

### Hosting on GitHub Pages (built in)

The repository ships a workflow, `.github/workflows/pages.yml`, that builds the site and publishes it to GitHub Pages on every push to `main`. One-time setup:

Done: Pages is set to the GitHub Actions source, the repository is named `youchi`, and the site is live at **https://noseandnose.github.io/youchi/**. Every push to `main` republishes it within about two minutes; the workflow can also be run by hand from the Actions tab.

The workflow builds with the site's sub-path as the base URL, copies the app shell to `404.html` (Pages serves it for unknown paths, which is how deep links such as `/journey` work there), and adds `.nojekyll` so the `_expo` folder is published.

**Custom domain.** Settings → Pages → Custom domain, add the DNS record GitHub shows, and set a repository variable `WEB_BASE_URL` to `/` (Settings → Secrets and variables → Actions → Variables) so the build stops prefixing paths with the repository name. The privacy policy then lives at the same domain, which is also what the store listings need.

### Other static hosts

`dist/` works on any static host that rewrites unknown paths to `index.html`:

- **Netlify** and **Cloudflare Pages**: build command `npm run web:build`, publish directory `dist`; the `public/_redirects` file in the repo (`/* /index.html 200`) is included in the export.
- **Vercel**: framework "Other", build command `npm run web:build`, output `dist`, plus a `vercel.json` with `{"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}`.

Put it on the YOUchi domain you already own and link the App Store and Google Play badges from the welcome screen once the apps are live.
