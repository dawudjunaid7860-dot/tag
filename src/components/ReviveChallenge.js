import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Ghost revive challenge: tap the numbers 1–5 in order, within 30 seconds.
// Shuffled every try, so it cannot be memorised and tapped blind.
// Success = the ghost comes back to life. Failure = try again.
function shuffled() {
  const arr = [1, 2, 3, 4, 5];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function ReviveChallenge({ playerName, onSuccess, onCancel }) {
  const [order, setOrder] = useState(shuffled());
  const [next, setNext] = useState(1);
  const [done, setDone] = useState([]);
  const [seconds, setSeconds] = useState(30);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (failed) return undefined;
    const t = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(t);
          setFailed(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [failed]);

  const tap = (n) => {
    if (failed) return;
    if (n === next) {
      const newDone = [...done, n];
      setDone(newDone);
      setNext(next + 1);
      if (newDone.length === 5) onSuccess();
    } else {
      setDone([]);
      setNext(1);
    }
  };

  const retry = () => {
    setOrder(shuffled());
    setDone([]);
    setNext(1);
    setSeconds(30);
    setFailed(false);
  };

  return (
    <View style={styles.box}>
      <Text style={styles.title}>👻 Revive {playerName}!</Text>
      <Text style={styles.sub}>Tap the numbers in order, 1 → 5, before the timer runs out.</Text>
      <Text style={styles.timer}>{failed ? '⏰ Time up!' : `${seconds}s left — next: ${next}`}</Text>
      {failed ? (
        <View>
          <TouchableOpacity style={styles.retry} onPress={retry}><Text style={styles.retryText}>Try again</Text></TouchableOpacity>
          <TouchableOpacity style={styles.cancel} onPress={onCancel}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
        </View>
      ) : (
        <View style={styles.grid}>
          {order.map((n) => (
            <TouchableOpacity key={n} style={[styles.num, done.includes(n) && styles.numDone]} onPress={() => tap(n)}>
              <Text style={styles.numText}>{done.includes(n) ? '✓' : n}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {!failed && (
        <TouchableOpacity style={styles.cancel} onPress={onCancel}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { marginHorizontal: 20, marginTop: 16, backgroundColor: '#1E293B', borderRadius: 16, padding: 16, borderWidth: 2, borderColor: '#A78BFA' },
  title: { color: '#fff', fontWeight: '800', fontSize: 18 },
  sub: { color: '#CBD5E1', marginTop: 6, lineHeight: 18 },
  timer: { color: '#FDE68A', fontWeight: '700', marginTop: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  num: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#374151', alignItems: 'center', justifyContent: 'center', marginRight: 10, marginBottom: 10 },
  numDone: { backgroundColor: '#22C55E' },
  numText: { color: '#fff', fontWeight: '800', fontSize: 20 },
  retry: { backgroundColor: '#22C55E', borderRadius: 12, padding: 12, alignItems: 'center', marginTop: 12 },
  retryText: { color: '#04140A', fontWeight: '800' },
  cancel: { alignItems: 'center', marginTop: 10 },
  cancelText: { color: '#9CA3AF' },
});
