import React, { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Location from 'expo-location';
import OsmMap from '../components/OsmMap';
import { blurLocation } from '../utils/blurLocation';

const PING_INTERVAL = 300; // 5 minutes, per spec
const FALLBACK = { lat: 39.7295, lng: -104.8415 }; // Aurora, Colorado — used only until real GPS arrives
const SAFE_ZONE_RADIUS_M = 120;

// Phase 2a — REAL MAP + REAL GPS.
//   * Your dot comes from expo-location (phone GPS / browser geolocation).
//   * The map is real OpenStreetMap street tiles, centred on that location.
//   * Your ping is still BLURRED to ~1 block before it is posted — the
//     exact GPS point is never shown, and it is only shared in a game.
//   * Other players are STILL SIMULATED around you (no backend yet —
//     that is the next chunk). Their dots are placed relative to your
//     real location, so the map behaves like the real thing.
//   * Sam sits in the safe zone and posts NO ping, as before.
//   * If GPS is denied/unavailable, the map falls back to Aurora and
//     says so clearly — it never pretends a fallback is your location.
function simulatedOthers(center) {
  return [
    { id: 'u2', name: 'Maya', color: '#FF5A5F', team: 'Red', trail: [], ping: blurLocation(center.lat + 0.0016, center.lng - 0.0012), ghost: false },
    { id: 'u3', name: 'Jordan', color: '#3B82F6', team: 'Blue', trail: [], ping: blurLocation(center.lat - 0.0021, center.lng + 0.0015), ghost: false },
    { id: 'u5', name: 'Riley', color: '#3B82F6', team: 'Blue', trail: [], ping: blurLocation(center.lat - 0.0012, center.lng - 0.0022), ghost: true },
  ];
}

export default function MapScreen({ game, onEndGame }) {
  const [gps, setGps] = useState(null); // {lat, lng, accuracy}
  const [locStatus, setLocStatus] = useState('loading'); // loading | real | fallback
  const [center, setCenter] = useState(FALLBACK);
  const [zoom, setZoom] = useState(16);
  const [players, setPlayers] = useState([]);
  const [secondsLeft, setSecondsLeft] = useState(PING_INTERVAL);
  const [pingCount, setPingCount] = useState(1);
  const [sonarKey, setSonarKey] = useState(0);
  const [nearestFeet, setNearestFeet] = useState(25);
  const [feed, setFeed] = useState(['Game started — Classic mode. Good luck!']);
  const [confetti, setConfetti] = useState(false);
  const watchRef = useRef(null);

  const glow = useRef(new Animated.Value(0)).current;
  const inRange = nearestFeet <= 10;

  // Build the player list around a centre: you (real, blurred) + simulated others.
  const buildPlayers = (c, prevYou) => {
    const youPing = blurLocation(c.lat, c.lng);
    const you = {
      id: 'u1', name: 'You', color: '#22C55E', team: 'Red', isYou: true,
      trail: prevYou ? [...prevYou.trail.slice(-1), prevYou.ping].filter(Boolean) : [],
      ping: youPing, ghost: false,
    };
    return [you, ...simulatedOthers(c)];
  };

  // Real GPS, with a 6-second cap so the screen never hangs on permission.
  useEffect(() => {
    let cancelled = false;
    const timeout = (ms) => new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms));
    const setup = async () => {
      try {
        const { status } = await Promise.race([Location.requestForegroundPermissionsAsync(), timeout(6000)]);
        if (cancelled) return;
        if (status !== 'granted') throw new Error('permission denied');
        const pos = await Promise.race([Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }), timeout(6000)]);
        if (cancelled) return;
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setGps({ ...c, accuracy: pos.coords.accuracy });
        setCenter(c);
        setLocStatus('real');
        setPlayers(buildPlayers(c, null));
        setFeed((f) => ['📍 Real GPS locked in — your ping is blurred to ~1 block.', ...f].slice(0, 8));
        watchRef.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 10, timeInterval: 5000 },
          (p) => {
            const nc = { lat: p.coords.latitude, lng: p.coords.longitude };
            setGps({ ...nc, accuracy: p.coords.accuracy });
          }
        );
      } catch (e) {
        if (cancelled) return;
        setLocStatus('fallback');
        setCenter(FALLBACK);
        setPlayers(buildPlayers(FALLBACK, null));
      }
    };
    setup();
    return () => {
      cancelled = true;
      if (watchRef.current) watchRef.current.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Glowing TAG button when within 10 ft
  useEffect(() => {
    if (!inRange) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 700, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [inRange, glow]);

  // 5-minute ping countdown. On 0: re-blur your real GPS ping, sonar ripple.
  useEffect(() => {
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          postPing();
          return PING_INTERVAL;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pingCount, gps]);

  const postPing = () => {
    const base = gps || FALLBACK;
    setPlayers((prev) => {
      const you = prev.find((p) => p.id === 'u1');
      const rest = prev.filter((p) => p.id !== 'u1').map((p) => (p.ping && !p.ghost ? { ...p, trail: [...p.trail.slice(-1), p.ping], ping: blurLocation(p.ping.lat, p.ping.lng) } : p));
      const newYou = you
        ? { ...you, trail: [...you.trail.slice(-1), you.ping].filter(Boolean), ping: blurLocation(base.lat, base.lng) }
        : { id: 'u1', name: 'You', color: '#22C55E', team: 'Red', trail: [], ping: blurLocation(base.lat, base.lng), ghost: false };
      return [newYou, ...rest];
    });
    setPingCount((c) => c + 1);
    setSonarKey((k) => k + 1);
    setFeed((f) => [`Ping #${pingCount + 1} posted — locations blurred to ~1 block.`, ...f].slice(0, 8));
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');
  const safeZone = { lat: center.lat + 0.0018, lng: center.lng + 0.0012, radiusMeters: SAFE_ZONE_RADIUS_M, label: 'Safe Zone — no pings here (Sam is here)' };

  const doTag = () => {
    if (!inRange) return;
    setConfetti(true);
    setPlayers((prev) => prev.map((p) => (p.id === 'u2' ? { ...p, ghost: true } : p)));
    setFeed((f) => ['🎉 You tagged Maya! She is now a ghost — she can revive with a challenge (next chunk).', ...f].slice(0, 8));
    setTimeout(() => setConfetti(false), 2500);
  };

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>TAG — {game.mode}</Text>
          <Text style={styles.sub}>Everyone • blurred pings • friends only</Text>
        </View>
        <TouchableOpacity onPress={onEndGame}><Text style={styles.end}>End game</Text></TouchableOpacity>
      </View>

      <View style={[styles.locBanner, locStatus === 'real' ? styles.locReal : styles.locFallback]}>
        <Text style={styles.locText}>
          {locStatus === 'loading' && '📍 Finding your location…'}
          {locStatus === 'real' && `📍 Real GPS${gps && gps.accuracy ? ` (±${Math.round(gps.accuracy)}m)` : ''} — ping blurred to ~1 block`}
          {locStatus === 'fallback' && '📍 Location not available — showing Aurora fallback. Allow location access to see your real spot.'}
        </Text>
      </View>

      <View style={styles.countRow}>
        <View style={styles.ring}>
          <Text style={styles.ringText}>{mm}:{ss}</Text>
          <Text style={styles.ringSub}>to next ping</Text>
        </View>
        <View style={styles.countText}>
          <Text style={styles.countTitle}>Ping #{pingCount} live</Text>
          <Text style={styles.countSub}>Every 5 min, each ping is blurred to ~1 block. Safe zones never ping.</Text>
          <Text style={styles.legend}>🔴 Red team &nbsp; 🔵 Blue team &nbsp; 👻 Ghost</Text>
        </View>
      </View>

      <OsmMap center={center} zoom={zoom} players={players} safeZone={safeZone} sonarKey={sonarKey} />
      {confetti && <Text style={styles.confetti}>🎉 🎊 ✨ 🎉 🎊 ✨</Text>}

      <View style={styles.mapControls}>
        <TouchableOpacity style={styles.mapBtn} onPress={() => setZoom((z) => Math.min(18, z + 1))}><Text style={styles.mapBtnText}>＋ Zoom in</Text></TouchableOpacity>
        <TouchableOpacity style={styles.mapBtn} onPress={() => setZoom((z) => Math.max(15, z - 1))}><Text style={styles.mapBtnText}>－ Zoom out</Text></TouchableOpacity>
        <TouchableOpacity style={styles.mapBtn} onPress={() => gps && setCenter({ lat: gps.lat, lng: gps.lng })}><Text style={styles.mapBtnText}>◎ Recentre on me</Text></TouchableOpacity>
        <TouchableOpacity style={styles.mapBtn} onPress={postPing}><Text style={styles.mapBtnText}>📍 Ping now (test)</Text></TouchableOpacity>
      </View>
      <Text style={styles.note}>Other players are still simulated around your real location — a real backend (next chunk) is what lets other phones' pings appear here. Map: © OpenStreetMap contributors.</Text>

      <View style={styles.proxBox}>
        <Text style={styles.proxTitle}>Bluetooth proximity — MOCK (next chunk)</Text>
        <Text style={styles.proxSub}>Nearest friend: {nearestFeet} ft away {inRange ? '— IN RANGE!' : '(move closer to tag)'}</Text>
        <View style={styles.proxRow}>
          <TouchableOpacity style={styles.proxBtn} onPress={() => setNearestFeet(25)}><Text style={styles.proxBtnText}>Simulate 25 ft</Text></TouchableOpacity>
          <TouchableOpacity style={styles.proxBtn} onPress={() => setNearestFeet(8)}><Text style={styles.proxBtnText}>Simulate 8 ft</Text></TouchableOpacity>
        </View>
      </View>

      <Animated.View style={{ opacity: inRange ? 1 : 0.55, transform: [{ scale: inRange ? glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) : 1 }] }}>
        <TouchableOpacity style={[styles.tagBtn, inRange && styles.tagBtnHot]} onPress={doTag} disabled={!inRange}>
          <Text style={styles.tagText}>{inRange ? '⚡ TAG!' : 'TAG (get within 10 ft)'}</Text>
        </TouchableOpacity>
      </Animated.View>

      <Text style={styles.h2}>Live feed</Text>
      {feed.map((f, i) => (
        <Text key={i} style={styles.feedItem}>• {f}</Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0F1115' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingBottom: 10 },
  title: { color: '#fff', fontWeight: '900', fontSize: 20, textTransform: 'capitalize' },
  sub: { color: '#9CA3AF', marginTop: 4 },
  end: { color: '#F87171', fontWeight: '700' },
  locBanner: { marginHorizontal: 20, borderRadius: 10, padding: 10, marginBottom: 12 },
  locReal: { backgroundColor: '#14532D' },
  locFallback: { backgroundColor: '#7C2D12' },
  locText: { color: '#fff', fontSize: 13, lineHeight: 18 },
  countRow: { flexDirection: 'row', paddingHorizontal: 20, alignItems: 'center', marginBottom: 14 },
  ring: { width: 84, height: 84, borderRadius: 42, borderWidth: 4, borderColor: '#22C55E', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  ringText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  ringSub: { color: '#9CA3AF', fontSize: 10 },
  countText: { flex: 1 },
  countTitle: { color: '#fff', fontWeight: '800' },
  countSub: { color: '#9CA3AF', marginTop: 4, lineHeight: 17 },
  legend: { color: '#E5E7EB', marginTop: 8 },
  confetti: { textAlign: 'center', fontSize: 28, marginTop: 8 },
  mapControls: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 20, marginTop: 12 },
  mapBtn: { backgroundColor: '#374151', borderRadius: 10, padding: 10, marginRight: 8, marginBottom: 8 },
  mapBtnText: { color: '#fff', fontWeight: '700' },
  proxBox: { margin: 20, backgroundColor: '#1F2937', borderRadius: 14, padding: 14 },
  proxTitle: { color: '#fff', fontWeight: '800' },
  proxSub: { color: '#9CA3AF', marginTop: 6 },
  proxRow: { flexDirection: 'row', marginTop: 10 },
  proxBtn: { backgroundColor: '#374151', borderRadius: 10, padding: 10, marginRight: 10 },
  proxBtnText: { color: '#fff', fontWeight: '700' },
  tagBtn: { marginHorizontal: 20, backgroundColor: '#374151', borderRadius: 18, padding: 18, alignItems: 'center' },
  tagBtnHot: { backgroundColor: '#22C55E', shadowColor: '#22C55E', shadowOpacity: 0.9, shadowRadius: 20, elevation: 12 },
  tagText: { color: '#fff', fontWeight: '900', fontSize: 20, letterSpacing: 1 },
  h2: { color: '#fff', fontWeight: '800', fontSize: 18, marginHorizontal: 20, marginTop: 22, marginBottom: 8 },
  feedItem: { color: '#E5E7EB', marginHorizontal: 20, marginBottom: 6, lineHeight: 18 },
  note: { color: '#6B7280', marginHorizontal: 20, marginTop: 4, lineHeight: 18 },
});
