import React, { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MOCK_PLAYERS, SAFE_ZONE_LABEL } from '../data/mockData';
import { blurLocation, pingToXY } from '../utils/blurLocation';

const PING_INTERVAL = 300; // 5 minutes, per spec

function PulsingDot({ color, ghost }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1600, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });
  if (ghost) return <Text style={styles.ghost}>👻</Text>;
  return (
    <View style={styles.dotWrap}>
      <Animated.View style={[styles.ripple, { backgroundColor: color, transform: [{ scale }], opacity }]} />
      <View style={[styles.core, { backgroundColor: color }]} />
    </View>
  );
}

// Phase 1 MOCK MAP: a styled neighbourhood grid, NOT a real map.
// Real map (react-native-maps + expo-location) drops in here in Phase 2:
// replace pingToXY positions with real map coordinates, keep the
// PulsingDot / trail / ghost / countdown logic exactly as-is.
// Location rule enforced here: no ping is drawn for safe-zone players,
// and nothing is shared when the game is not active (this screen only
// exists inside an active game).
export default function MapScreen({ game, onEndGame }) {
  const [players, setPlayers] = useState(MOCK_PLAYERS);
  const [secondsLeft, setSecondsLeft] = useState(PING_INTERVAL);
  const [pingCount, setPingCount] = useState(1);
  const [sonarKey, setSonarKey] = useState(0);
  const [nearestFeet, setNearestFeet] = useState(25);
  const [feed, setFeed] = useState(['Game started — Classic mode. Good luck!']);
  const [confetti, setConfetti] = useState(false);

  const glow = useRef(new Animated.Value(0)).current;
  const inRange = nearestFeet <= 10;

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

  // 5-minute ping countdown. On 0: blur + re-post every ping, sonar ripple.
  useEffect(() => {
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setPlayers((prev) =>
            prev.map((p) =>
              p.ping && !p.ghost ? { ...p, trail: [...p.trail.slice(-1), p.ping], ping: blurLocation(p.ping.lat, p.ping.lng) } : p
            )
          );
          setPingCount((c) => c + 1);
          setSonarKey((k) => k + 1);
          setFeed((f) => [`Ping #${pingCount + 1} posted — locations blurred to ~1 block.`, ...f].slice(0, 8));
          return PING_INTERVAL;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [pingCount]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  const doTag = () => {
    if (!inRange) return;
    // Mock tag: Maya (nearest red-team friend in this demo) becomes a ghost.
    // Phase 2: this fires only after Bluetooth confirms BOTH phones are
    // within 10 ft — never from one phone alone.
    setConfetti(true);
    setPlayers((prev) => prev.map((p) => (p.id === 'u2' ? { ...p, ghost: true } : p)));
    setFeed((f) => ['🎉 You tagged Maya! She is now a ghost — she can revive with a challenge (Phase 2).', ...f].slice(0, 8));
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

      {/* Countdown ring (circular badge + progress) */}
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

      {/* Mock map */}
      <View style={styles.map}>
        <View style={styles.streetH} />
        <View style={[styles.streetH, { top: '62%' }]} />
        <View style={styles.streetV} />
        <View style={[styles.streetV, { left: '68%' }]} />
        <View style={styles.safeZone}>
          <Text style={styles.safeText}>{SAFE_ZONE_LABEL}</Text>
          <Text style={styles.safeSub}>Sam is here — no dot, no ping</Text>
        </View>
        {sonarKey > 0 && <View key={sonarKey} style={styles.sonar} />}
        {players.map((p) => {
          if (!p.ping) return null;
          const { x, y } = pingToXY(p.ping);
          return (
            <View key={p.id}>
              {p.trail.map((t, i) => {
                const tp = pingToXY(t);
                return <View key={i} style={[styles.trailDot, { left: `${tp.x}%`, top: `${tp.y}%`, backgroundColor: p.color, opacity: 0.25 + i * 0.15 }]} />;
              })}
              <View style={[styles.marker, { left: `${x}%`, top: `${y}%` }]}>
                <PulsingDot color={p.color} ghost={p.ghost} />
                <Text style={[styles.markerLabel, p.ghost && styles.ghostLabel]}>{p.name}</Text>
              </View>
            </View>
          );
        })}
        {confetti && <Text style={styles.confetti}>🎉 🎊 ✨ 🎉 🎊 ✨</Text>}
      </View>

      {/* Proximity simulator (Phase 1 stand-in for Bluetooth) */}
      <View style={styles.proxBox}>
        <Text style={styles.proxTitle}>Bluetooth proximity — MOCK</Text>
        <Text style={styles.proxSub}>Nearest friend: {nearestFeet} ft away {inRange ? '— IN RANGE!' : '(move closer to tag)'}</Text>
        <View style={styles.proxRow}>
          <TouchableOpacity style={styles.proxBtn} onPress={() => setNearestFeet(25)}><Text style={styles.proxBtnText}>Simulate 25 ft</Text></TouchableOpacity>
          <TouchableOpacity style={styles.proxBtn} onPress={() => setNearestFeet(8)}><Text style={styles.proxBtnText}>Simulate 8 ft</Text></TouchableOpacity>
        </View>
        <Text style={styles.proxNote}>Phase 2: real Bluetooth LE ranging + confirm on both phones replaces these buttons.</Text>
      </View>

      {/* TAG button */}
      <Animated.View style={{ opacity: inRange ? 1 : 0.55, transform: [{ scale: inRange ? glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) : 1 }] }}>
        <TouchableOpacity style={[styles.tagBtn, inRange && styles.tagBtnHot]} onPress={doTag} disabled={!inRange}>
          <Text style={styles.tagText}>{inRange ? '⚡ TAG!' : 'TAG (get within 10 ft)'}</Text>
        </TouchableOpacity>
      </Animated.View>

      <Text style={styles.h2}>Live feed</Text>
      {feed.map((f, i) => (
        <Text key={i} style={styles.feedItem}>• {f}</Text>
      ))}
      <Text style={styles.note}>Group chat with emoji reactions + ghost revive challenges land in Phase 2, after you test this map.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0F1115' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingBottom: 10 },
  title: { color: '#fff', fontWeight: '900', fontSize: 20, textTransform: 'capitalize' },
  sub: { color: '#9CA3AF', marginTop: 4 },
  end: { color: '#F87171', fontWeight: '700' },
  countRow: { flexDirection: 'row', paddingHorizontal: 20, alignItems: 'center', marginBottom: 14 },
  ring: { width: 84, height: 84, borderRadius: 42, borderWidth: 4, borderColor: '#22C55E', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  ringText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  ringSub: { color: '#9CA3AF', fontSize: 10 },
  countText: { flex: 1 },
  countTitle: { color: '#fff', fontWeight: '800' },
  countSub: { color: '#9CA3AF', marginTop: 4, lineHeight: 17 },
  legend: { color: '#E5E7EB', marginTop: 8 },
  map: { height: 420, marginHorizontal: 20, backgroundColor: '#16211A', borderRadius: 18, overflow: 'hidden', position: 'relative' },
  streetH: { position: 'absolute', left: 0, right: 0, top: '32%', height: 6, backgroundColor: '#2A3B2E' },
  streetV: { position: 'absolute', top: 0, bottom: 0, left: '34%', width: 6, backgroundColor: '#2A3B2E' },
  safeZone: { position: 'absolute', left: '58%', top: '8%', width: '36%', padding: 8, backgroundColor: 'rgba(34,197,94,0.18)', borderWidth: 2, borderColor: '#22C55E', borderStyle: 'dashed', borderRadius: 10 },
  safeText: { color: '#BBF7D0', fontWeight: '700', fontSize: 11 },
  safeSub: { color: '#BBF7D0', fontSize: 10, marginTop: 2 },
  sonar: { position: 'absolute', left: '30%', top: '30%', width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#22C55E', opacity: 0.5 },
  trailDot: { position: 'absolute', width: 10, height: 10, borderRadius: 5 },
  marker: { position: 'absolute', alignItems: 'center' },
  dotWrap: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  ripple: { position: 'absolute', width: 28, height: 28, borderRadius: 14 },
  core: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#fff' },
  ghost: { fontSize: 26 },
  markerLabel: { color: '#fff', fontWeight: '700', fontSize: 12, marginTop: 2, textShadowColor: '#000', textShadowRadius: 4 },
  ghostLabel: { opacity: 0.6 },
  confetti: { position: 'absolute', top: 10, left: 0, right: 0, textAlign: 'center', fontSize: 28 },
  proxBox: { margin: 20, backgroundColor: '#1F2937', borderRadius: 14, padding: 14 },
  proxTitle: { color: '#fff', fontWeight: '800' },
  proxSub: { color: '#9CA3AF', marginTop: 6 },
  proxRow: { flexDirection: 'row', marginTop: 10 },
  proxBtn: { backgroundColor: '#374151', borderRadius: 10, padding: 10, marginRight: 10 },
  proxBtnText: { color: '#fff', fontWeight: '700' },
  proxNote: { color: '#6B7280', marginTop: 10, fontSize: 12, lineHeight: 16 },
  tagBtn: { marginHorizontal: 20, backgroundColor: '#374151', borderRadius: 18, padding: 18, alignItems: 'center' },
  tagBtnHot: { backgroundColor: '#22C55E', shadowColor: '#22C55E', shadowOpacity: 0.9, shadowRadius: 20, elevation: 12 },
  tagText: { color: '#fff', fontWeight: '900', fontSize: 20, letterSpacing: 1 },
  h2: { color: '#fff', fontWeight: '800', fontSize: 18, marginHorizontal: 20, marginTop: 22, marginBottom: 8 },
  feedItem: { color: '#E5E7EB', marginHorizontal: 20, marginBottom: 6, lineHeight: 18 },
  note: { color: '#6B7280', marginHorizontal: 20, marginTop: 14, lineHeight: 18 },
});
