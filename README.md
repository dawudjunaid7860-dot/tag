# Tag — real-life tag with friends (Phase 2a: real map + GPS)

**Phase 2a is built: real GPS + real street map. Other players are still simulated until the backend chunk, Bluetooth tags are still mock, and chat/revive are not built yet.**

## What works now
- **Sign up (mock):** name + age. Under 13 requires a parent email + consent tick before you can continue. No data leaves the phone in Phase 1.
- **Home:** mock friends, mock groups, game mode picker — Classic / Infection / Assassin.
- **Real map + GPS (Phase 2a):** your dot comes from real GPS via `expo-location`. The map is real OpenStreetMap street tiles (no Google Maps API key needed, so it works on web + phone). Your ping is still blurred to ~1 block before posting, and is only shared in a game. Zoom in/out, recentre on me, and "Ping now (test)" buttons are on the map. If GPS is denied/unavailable, the map clearly falls back to Aurora, Colorado and says so — it never pretends the fallback is you.
  - Colour-coded dots, faded trails, 5-minute countdown ring with sonar ripple on re-ping, a ghost 👻 where Riley was tagged, and a safe-zone circle where Sam is — Sam posts **no ping at all**
  - A live feed, and a TAG button that only glows and works within 10 ft — use the “Simulate 8 ft” button to test it, then tap TAG to see confetti and Maya turn into a ghost

## What is deliberately NOT built yet
Real Bluetooth LE tags (confirmed on both phones), group chat with emoji reactions, ghost revive challenges, a backend, and real auth. Other players on the map are still simulated around your real location until the backend chunk lands — a real backend is what lets other phones' pings appear here.

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
src/screens/MapScreen.js   # real GPS map, pings, trails, ghosts, TAG button
src/components/OsmMap.js   # OpenStreetMap tile map (no API key)
src/utils/mapTiles.js      # Web-Mercator tile / dot positioning
src/data/mockData.js       # fake friends / groups / game modes
src/utils/blurLocation.js  # ~1-block blur + safe-zone helpers
```

## Safety notes built into Phase 1
- Friends-only visibility; no public discovery.
- Location is only shown inside an active game, and only as a blurred ping.
- Safe zones never ping.
- Under-13 play is gated on parental consent.
- A tag in the final app must be confirmed on **both** phones — one phone alone can never tag someone.
