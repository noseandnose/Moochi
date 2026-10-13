# MOCHI

**Build habits. Level up.**

MOCHI is a pocket habit game for iOS and Android. Complete three real-world goals a day (drink water, move, eat well), earn XP and coins, watch a pixel pet grow through five stages, and unlock gear. Everything runs offline on the device: no account, no backend, no ads.

| Welcome | Today | My pet | Journey |
| --- | --- | --- | --- |
| ![Welcome](docs/screenshots/welcome.png) | ![Today](docs/screenshots/today.png) | ![My pet](docs/screenshots/my-pet.png) | ![Journey](docs/screenshots/journey.png) |

| Water | Evolution paths | Share card | Pets and stages |
| --- | --- | --- | --- |
| ![Water](docs/screenshots/water.png) | ![Evolution](docs/screenshots/evolution.png) | ![Share](docs/screenshots/share.png) | ![Pets](docs/screenshots/pets-stages.png) |

## Stack

- Expo SDK 57, React Native 0.86, TypeScript, Expo Router (native stack + bottom tabs).
- `@shopify/react-native-skia` renders the pixel art with nearest-neighbour sampling so edges stay crisp at any size, and renders the share card.
- `react-native-reanimated` drives sprite transforms, progress bars and rings on the UI thread.
- `@react-native-async-storage/async-storage` for durable local persistence (versioned schema, migrations, corrupt-data recovery).
- `expo-haptics`, `expo-sharing`, `expo-file-system`, `expo-media-library` for feedback and sharing.
- `lucide-react-native` + `react-native-svg` for interface icons.

All game rules live in `src/game` as pure TypeScript with no React Native imports, so rewards, rollover, units, purchases and progression are unit-tested in isolation.

## Project layout

```
src/
  game/            pure game logic: types, constants, reducer, selectors, water units, persistence sanitiser, tests
  state/           GameProvider (hydration, persistence, date re-sync), CelebrationProvider (reward presentation)
  components/pet/  Skia sprite renderer, habitat stage, particles, gear grid
  components/      goal cards, reward banner, share card, shared screens (profile form, pet choice, evolution paths)
  ui/              design tokens and typed primitives (Text, Button, Card, Field, Segmented, Ring, Toast...)
  app/             Expo Router routes: onboarding/, (tabs)/today, (tabs)/pet, (tabs)/journey, settings (modal)
  assets/atlas.ts  generated sprite-sheet lookup
assets/
  sprites/         one sprite sheet per pet (bodies, eggs, path accents, gear overlays)
  scenes/          four habitat layers per pet (sky, far, near, ground)
  brand/, images/  logo, icons, splash, onboarding trio
  fonts/           Inter (OFL), subset to Latin, used only on the share card
tools/art/         Python pixel-art generator that builds every asset above
```

## Setup and run

Requirements: Node 22.13+, npm, and either Expo Go on a phone or a simulator/emulator.

```bash
npm install
npx expo start            # scan the QR code with Expo Go, or press i / a for a simulator
```

Every native module used here is bundled in Expo Go (SDK 57), so no development build is required to try the app. For a development build or local native run:

```bash
npx expo run:ios          # requires Xcode on macOS
npx expo run:android      # requires Android Studio / SDK
```

Useful scripts:

```bash
npm test                  # Jest: game rules (51 tests)
npm run typecheck         # tsc --noEmit
npm run lint              # expo lint (ESLint + React Compiler rules)
npm run doctor            # expo-doctor
npm run art               # regenerate all pixel art (needs python3 with Pillow and numpy)
npm run web               # browser preview (copies CanvasKit to public/ first)
```

## Producing iOS and Android builds

The project is configured for EAS Build (`bundleIdentifier` / `package`: `com.mochi.habits`).

```bash
npm install -g eas-cli
eas login
eas build:configure                      # creates eas.json on first run

eas build --platform ios --profile preview        # internal/TestFlight-style build
eas build --platform android --profile preview    # APK for sideloading
eas build --platform all --profile production     # store builds
eas submit --platform ios                         # App Store Connect
eas submit --platform android                     # Google Play
```

Local builds without EAS: `npx expo prebuild` generates the `ios/` and `android/` projects, then open them in Xcode or Android Studio (or run `npx expo run:ios --configuration Release` / `npx expo run:android --variant release`).

Permissions declared in `app.json`: photo-library *add* access (only used by "Save image" on the share screen) and vibration for haptics. Nothing else is requested.

## Game rules

- Each of the three daily goals: 25 XP + 5 coins. All three in one day: +25 XP + 5 coins. Optional daily challenge: 20 XP + 4 coins.
- Rewards are recorded in a per-day ledger keyed by the device's local calendar date, so taps, restarts, undo/redo and navigation can never award twice. Undo updates the day's record but never revokes rewards or lets them be re-earned.
- Stages: Egg 0, Baby 100, Teen 400, Adult 1,000, Companion 2,500 XP. After Companion the level keeps rising (`floor(XP / 100) + 1`). Missed days never remove anything.
- From the teen stage the pet's look follows the leading habit (Hydration, Active, Nourished) using per-goal reward counts; ties are Balanced. Counts cannot be inflated by undo.
- Water is stored in millilitres. 1 US fl oz = 29.5735295625 ml. Targets display rounded *up*, amounts rounded to nearest, and a target that looks reached counts as reached (0.5 ml tolerance).
- Gender only sets a starting water target (female 2,000 ml, male 3,000 ml, prefer-not-to-say 2,500 ml). It is an editable default, not medical advice, and affects nothing else.
- Gear: None free, Cap 70, Bow 80, Glasses 100, Scarf 120, Crown 180 coins. Purchases are atomic; coins never go negative; owned items cannot be bought twice. Previewing never spends coins.
- Day rollover happens on every action, on app foreground and once a minute; the outgoing day is written to history before daily tracking resets.

## Verification

Automated, run in this repository:

- `npm test`: 51 Jest tests over water units and rounding, exactly-once rewards, undo without farming, the all-three bonus, bonus challenge, local-day rollover and resume, every stage threshold, final-stage levelling, path ties and leaders, counters under undo/redo, achievements on non-consecutive days, seven-day history with dashes, gear purchase / insufficient coins / double purchase / equip, persistence round-trip, corrupt and partial data recovery, migration chain, reset, onboarding validation, pet switching and renaming.
- `npm run typecheck`, `npm run lint`, `npm run doctor`: all clean.
- `npx expo export --platform ios --platform android`: Hermes bundles build for both platforms.
- Browser preview driven by Playwright at 390×844 and 320×568: fresh install through onboarding for all three pets, water quick-add and custom entry in ml and fl oz, undo, unit switching without drift, goal completion returning to Today with the reward banner, the egg hatch, undo from the detail screen, gear preview without spending, locked and insufficient states, the first purchase and equip, evolution previews for every pet, pet switching with preserved progress, share card generation, Journey history and achievements, settings validation and save, reduce-motion and haptic toggles, reset confirmation, and persistence across a page reload.

Not run (no simulator or device available in the build environment):

- iOS and Android device/simulator runs, including real haptics, the native share sheet, saving to Photos, Dynamic Type at the largest settings, and system Reduce Motion. The code paths exist and type-check, but they were only exercised on the web preview where they are stubbed or unavailable.

## Limitations

- Sound effects are not implemented; the settings preference exists in the data model but there is no audio. Haptics and reduce-motion are implemented.
- Pixel art is generated programmatically (`tools/art`) rather than hand-painted. Stages differ in proportion, parts and details, but the three pets share one rendering style and 128×128 cells.
- The web preview is for development only. It needs `npm run web:setup` (copies CanvasKit), and saving to Photos is unavailable there.
- Progress from the MOCHI website does not transfer to the app; no import flow was built.
- There is no cloud backup; deleting the app deletes progress.

## Licenses

Inter font: SIL Open Font License 1.1, see `assets/fonts/LICENSE-Inter-OFL.txt`. Icons: Lucide (ISC).
