# Tag — real-life tag with friends (Phase 1)

**Stop point: project setup + mock auth + mock map screen. Nothing after this is built yet.**

## What works now
- **Sign up (mock):** name + age. Under 13 requires a parent email + consent tick before you can continue. No data leaves the phone in Phase 1.
- **Home:** mock friends, mock groups, game mode picker — Classic / Infection / Assassin.
- **Mock map:** a neighbourhood grid (not a real map yet) showing:
  - Every player as a pulsing, colour-coded dot (Red vs Blue)
  - A faded trail of past pings
  - A countdown ring to the next 5-minute ping — when it hits 0, pings re-blur (~1 block) with a sonar ripple
  - A ghost 👻 where Riley was tagged
  - A dashed Safe Zone where Sam is — Sam posts **no ping at all**
  - A live feed
  - A TAG button that only glows and works within 10 ft — use the “Simulate 8 ft” button to test it, then tap TAG to see confetti and Maya turn into a ghost

## What is deliberately NOT built yet (Phase 2)
Real Bluetooth LE tags (confirmed on both phones), real GPS + a real map, group chat with emoji reactions, ghost revive challenges, a backend, and real auth. The mock buttons and comments in the code mark exactly where each one plugs in.

## Run it to test
```bash
cd tag-app
npm install
npx expo start
```
Then scan the QR code with the **Expo Go** app on your phone (same Wi-Fi).

Test checklist:
1. Sign in with any name, try age 12 — you should be asked for parent consent.
2. Pick a group + mode, tap Start game.
3. On the map, confirm: pulsing dots, trails, ghost, safe zone with no dot, countdown ticking.
4. Tap “Simulate 8 ft” — the TAG button should glow. Tap TAG — confetti, Maya becomes a ghost, feed updates.
5. Tap “Simulate 25 ft” — TAG should dim and disable again.
6. Wait for the countdown to hit 0 (or change `PING_INTERVAL` in `src/screens/MapScreen.js` to `10` temporarily) — pings should shift and a sonar ring should appear.

## Project layout
```
App.js                     # screen state: Auth -> Home -> Map
app.json                   # Expo config, incl. location + Bluetooth permission text
src/screens/AuthScreen.js  # mock sign-up + under-13 consent gate
src/screens/HomeScreen.js  # friends, groups, game modes
src/screens/MapScreen.js   # mock map, pings, trails, ghosts, TAG button
src/data/mockData.js       # fake friends / players / pings
src/utils/blurLocation.js  # ~1-block blur + safe-zone + map-position helpers
```

## Safety notes built into Phase 1
- Friends-only visibility; no public discovery.
- Location is only shown inside an active game, and only as a blurred ping.
- Safe zones never ping.
- Under-13 play is gated on parental consent.
- A tag in the final app must be confirmed on **both** phones — one phone alone can never tag someone.
