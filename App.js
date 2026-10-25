import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import MapScreen from './src/screens/MapScreen';

// Phase 1 navigation is simple screen state — no nav library needed,
// so `npx expo start` works in Expo Go with zero native linking.
// Phase 2: swap this for React Navigation + a real backend.
export default function App() {
  const [user, setUser] = useState(null);
  const [game, setGame] = useState(null);

  return (
    <>
      <StatusBar style="light" />
      {!user && <AuthScreen onSignIn={setUser} />}
      {user && !game && (
        <HomeScreen user={user} onStartGame={setGame} onSignOut={() => setUser(null)} />
      )}
      {user && game && (
        <MapScreen game={game} user={user} onEndGame={() => setGame(null)} />
      )}
    </>
  );
}
