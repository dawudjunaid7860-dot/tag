import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Phase 1: MOCK auth — no backend, no passwords stored.
// Any name + age signs you in locally so you can test the map.
// Phase 2: replace onSignIn() with real auth (Firebase Auth / Supabase),
// and verify parental consent server-side, never just in the app.
export default function AuthScreen({ onSignIn }) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentConsent, setParentConsent] = useState(false);

  const ageNum = parseInt(age, 10);
  const needsConsent = !Number.isNaN(ageNum) && ageNum < 13;

  const submit = () => {
    if (!name.trim()) return Alert.alert('Add your name', 'Enter a display name to continue.');
    if (Number.isNaN(ageNum) || ageNum < 5 || ageNum > 100) {
      return Alert.alert('Check your age', 'Enter your real age so the safety check works.');
    }
    if (needsConsent && (!parentEmail.includes('@') || !parentConsent)) {
      return Alert.alert(
        'Parental consent needed',
        'Under 13? A parent or guardian must enter their email and tick consent before you can play. This is a Phase 1 mock — Phase 2 verifies it properly.'
      );
    }
    onSignIn({ name: name.trim(), age: ageNum, parentEmail: needsConsent ? parentEmail : null });
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.logo}>TAG</Text>
      <Text style={styles.sub}>Real-life tag, with friends only.</Text>
      <Text style={styles.label}>Display name</Text>
      <TextInput style={styles.input} placeholder="e.g. Dawud" placeholderTextColor="#888" value={name} onChangeText={setName} />
      <Text style={styles.label}>Age</Text>
      <TextInput style={styles.input} placeholder="e.g. 12" placeholderTextColor="#888" value={age} onChangeText={setAge} keyboardType="number-pad" />
      {needsConsent && (
        <View style={styles.consentBox}>
          <Text style={styles.consentTitle}>👨‍👩‍👧 Parental consent (under 13)</Text>
          <TextInput style={styles.input} placeholder="Parent / guardian email" placeholderTextColor="#888" value={parentEmail} onChangeText={setParentEmail} autoCapitalize="none" keyboardType="email-address" />
          <TouchableOpacity style={styles.checkRow} onPress={() => setParentConsent(!parentConsent)}>
            <Text style={styles.checkBox}>{parentConsent ? '☑' : '☐'}</Text>
            <Text style={styles.checkText}>My parent / guardian says I can play Tag</Text>
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity style={styles.button} onPress={submit}>
        <Text style={styles.buttonText}>Sign up / Sign in</Text>
      </TouchableOpacity>
      <Text style={styles.note}>Mock sign-in for testing. Friends-only visibility. Location is shared only during an active game.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0F1115', padding: 24, justifyContent: 'center' },
  logo: { fontSize: 56, fontWeight: '900', color: '#fff', letterSpacing: 4, textAlign: 'center' },
  sub: { color: '#9CA3AF', textAlign: 'center', marginBottom: 28 },
  label: { color: '#fff', fontWeight: '700', marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: '#1F2937', color: '#fff', borderRadius: 12, padding: 14, fontSize: 16 },
  consentBox: { backgroundColor: '#1E293B', borderRadius: 12, padding: 14, marginTop: 16 },
  consentTitle: { color: '#FDE68A', fontWeight: '700', marginBottom: 10 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  checkBox: { fontSize: 20, color: '#fff', marginRight: 8 },
  checkText: { color: '#E5E7EB', flex: 1 },
  button: { backgroundColor: '#22C55E', borderRadius: 14, padding: 16, marginTop: 22, alignItems: 'center' },
  buttonText: { color: '#04140A', fontWeight: '800', fontSize: 17 },
  note: { color: '#6B7280', textAlign: 'center', marginTop: 18, lineHeight: 18 },
});
