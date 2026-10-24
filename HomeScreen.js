import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GAME_MODES, MOCK_FRIENDS, MOCK_GROUPS } from '../data/mockData';

// Phase 1: friends / groups / game setup are mock lists.
// Starting a game goes straight to the mock map — no Bluetooth,
// no live game server yet. Those are Phase 2.
export default function HomeScreen({ user, onStartGame, onSignOut }) {
  const [mode, setMode] = useState('classic');
  const [group, setGroup] = useState('g1');

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <View style={styles.header}>
        <View>
          <Text style={styles.hi}>Hey, {user.name} 👋</Text>
          <Text style={styles.sub}>Friends only. No strangers can see you.</Text>
        </View>
        <TouchableOpacity onPress={onSignOut}><Text style={styles.signOut}>Sign out</Text></TouchableOpacity>
      </View>

      <Text style={styles.h2}>Groups</Text>
      {MOCK_GROUPS.map((g) => (
        <TouchableOpacity key={g.id} style={[styles.card, group === g.id && styles.cardActive]} onPress={() => setGroup(g.id)}>
          <Text style={styles.cardTitle}>{g.name}</Text>
          <Text style={styles.cardSub}>{g.members} members</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.h2}>Friends</Text>
      {MOCK_FRIENDS.map((f) => (
        <View key={f.id} style={styles.friendRow}>
          <View style={[styles.dot, { backgroundColor: f.color }]} />
          <Text style={styles.friendName}>{f.name}</Text>
          <Text style={styles.team}>{f.team} team</Text>
        </View>
      ))}

      <Text style={styles.h2}>Game mode</Text>
      {GAME_MODES.map((m) => (
        <TouchableOpacity key={m.id} style={[styles.card, mode === m.id && styles.cardActive]} onPress={() => setMode(m.id)}>
          <Text style={styles.cardTitle}>{m.name}</Text>
          <Text style={styles.cardSub}>{m.desc}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.start} onPress={() => onStartGame({ mode, group })}>
        <Text style={styles.startText}>▶ Start game — mock map</Text>
      </TouchableOpacity>
      <Text style={styles.note}>Phase 2 next: real Bluetooth tags, live chat + feed, ghost revive challenges.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0F1115' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  hi: { fontSize: 24, fontWeight: '800', color: '#fff' },
  sub: { color: '#9CA3AF', marginTop: 4 },
  signOut: { color: '#F87171', fontWeight: '700' },
  h2: { color: '#fff', fontWeight: '800', fontSize: 18, marginTop: 24, marginBottom: 10 },
  card: { backgroundColor: '#1F2937', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 2, borderColor: 'transparent' },
  cardActive: { borderColor: '#22C55E' },
  cardTitle: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cardSub: { color: '#9CA3AF', marginTop: 4 },
  friendRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', borderRadius: 12, padding: 12, marginBottom: 8 },
  dot: { width: 28, height: 28, borderRadius: 14, marginRight: 12 },
  friendName: { color: '#fff', fontWeight: '700', flex: 1 },
  team: { color: '#9CA3AF' },
  start: { backgroundColor: '#22C55E', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 20 },
  startText: { color: '#04140A', fontWeight: '800', fontSize: 17 },
  note: { color: '#6B7280', textAlign: 'center', marginTop: 14, lineHeight: 18 },
});
