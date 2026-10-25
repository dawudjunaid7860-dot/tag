import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AUTHOR_COLORS, REACTION_EMOJIS, backend } from '../services/backend';

const CANNED = [
  { author: 'Maya', text: 'Did anyone see where Jordan went??' },
  { author: 'Jordan', text: 'Nope, I am a ghost now. Well, almost 😂' },
  { author: 'Maya', text: 'Ping in 5 min, stay ready 🔥' },
  { author: 'Riley', text: 'Revive me if you find me 👻' },
];

// Group chat with emoji reactions. Data lives in src/services/backend.js,
// so this screen and the feed never drift apart.
export default function ChatView({ userName = 'You' }) {
  const [messages, setMessages] = useState(backend.getMessages());
  const [draft, setDraft] = useState('');
  const cannedRef = useRef(0);

  useEffect(() => backend.subscribe((s) => setMessages([...s.messages])), []);

  const send = () => {
    if (!draft.trim()) return;
    backend.sendMessage(userName, draft);
    setDraft('');
  };

  const simulateReply = () => {
    const next = CANNED[cannedRef.current % CANNED.length];
    cannedRef.current += 1;
    backend.sendMessage(next.author, next.text);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>💬 Group chat</Text>
      <Text style={styles.sub}>Friends only. Reactions are per-message — tap an emoji to add or remove yours.</Text>
      <ScrollView style={styles.list}>
        {messages.map((m) => (
          <View key={m.id} style={[styles.msg, m.author === userName && styles.msgMine]}>
            <Text style={[styles.author, { color: AUTHOR_COLORS[m.author] || '#fff' }]}>{m.author} <Text style={styles.time}>{m.time}</Text></Text>
            <Text style={styles.text}>{m.text}</Text>
            <View style={styles.reactions}>
              {REACTION_EMOJIS.map((e) => {
                const users = m.reactions[e] || [];
                const mine = users.includes(userName);
                return (
                  <TouchableOpacity key={e} style={[styles.reactBtn, mine && styles.reactMine]} onPress={() => backend.toggleReaction(m.id, e, userName)}>
                    <Text style={styles.reactText}>{e}{users.length ? ` ${users.length}` : ''}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={styles.inputRow}>
        <TextInput style={styles.input} placeholder="Message the group…" placeholderTextColor="#888" value={draft} onChangeText={setDraft} onSubmitEditing={send} />
        <TouchableOpacity style={styles.send} onPress={send}><Text style={styles.sendText}>Send</Text></TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.simBtn} onPress={simulateReply}>
        <Text style={styles.simText}>Simulate a friend reply (test — no second phone yet)</Text>
      </TouchableOpacity>
      <Text style={styles.note}>On-device for now: messages persist in this browser/device. Multi-phone chat needs the cloud backend step.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: 20 },
  title: { color: '#fff', fontWeight: '800', fontSize: 20 },
  sub: { color: '#9CA3AF', marginTop: 4, marginBottom: 12, lineHeight: 18 },
  list: { maxHeight: 420 },
  msg: { backgroundColor: '#1F2937', borderRadius: 12, padding: 12, marginBottom: 10 },
  msgMine: { backgroundColor: '#14361F', borderWidth: 1, borderColor: '#22C55E' },
  author: { fontWeight: '800' },
  time: { color: '#9CA3AF', fontWeight: '400', fontSize: 12 },
  text: { color: '#fff', marginTop: 4, lineHeight: 19 },
  reactions: { flexDirection: 'row', marginTop: 8, flexWrap: 'wrap' },
  reactBtn: { backgroundColor: '#374151', borderRadius: 14, paddingHorizontal: 8, paddingVertical: 4, marginRight: 6, marginBottom: 4 },
  reactMine: { backgroundColor: '#22C55E' },
  reactText: { color: '#fff', fontSize: 13 },
  inputRow: { flexDirection: 'row', marginTop: 12 },
  input: { flex: 1, backgroundColor: '#1F2937', color: '#fff', borderRadius: 12, padding: 12, fontSize: 16, marginRight: 8 },
  send: { backgroundColor: '#22C55E', borderRadius: 12, paddingHorizontal: 18, justifyContent: 'center' },
  sendText: { color: '#04140A', fontWeight: '800' },
  simBtn: { marginTop: 10, alignItems: 'center' },
  simText: { color: '#9CA3AF', fontSize: 13 },
  note: { color: '#6B7280', textAlign: 'center', marginTop: 10, lineHeight: 17 },
});
