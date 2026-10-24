// Fake data for Phase 1 testing only. No real location, Bluetooth,
// chat, or backend calls happen yet. Swap these for API data in Phase 2.

export const GAME_MODES = [
  { id: 'classic', name: 'Classic', desc: 'Last player standing wins.' },
  { id: 'infection', name: 'Infection', desc: 'Tagged players join the taggers.' },
  { id: 'assassin', name: 'Assassin', desc: 'Everyone has one secret target.' },
];

export const MOCK_FRIENDS = [
  { id: 'u2', name: 'Maya', color: '#FF5A5F', team: 'Red' },
  { id: 'u3', name: 'Jordan', color: '#3B82F6', team: 'Blue' },
  { id: 'u4', name: 'Sam', color: '#FF5A5F', team: 'Red' },
  { id: 'u5', name: 'Riley', color: '#3B82F6', team: 'Blue' },
];

export const MOCK_GROUPS = [
  { id: 'g1', name: 'Aurora Crew', members: 4 },
  { id: 'g2', name: 'School Squad', members: 6 },
];

// Each player has a trail of past (blurred) pings + a current ping.
// Sam is in the safe zone, so Sam posts NO ping — see MapScreen.
// Riley was tagged, so Riley is a ghost at their last ping.
export const MOCK_PLAYERS = [
  {
    id: 'u1', name: 'You', color: '#22C55E', team: 'Red', isYou: true,
    trail: [{ lat: 39.722, lng: -104.845 }, { lat: 39.725, lng: -104.843 }],
    ping: { lat: 39.728, lng: -104.841 }, inSafeZone: false, ghost: false,
  },
  {
    id: 'u2', name: 'Maya', color: '#FF5A5F', team: 'Red',
    trail: [{ lat: 39.730, lng: -104.838 }, { lat: 39.731, lng: -104.836 }],
    ping: { lat: 39.732, lng: -104.834 }, inSafeZone: false, ghost: false,
  },
  {
    id: 'u3', name: 'Jordan', color: '#3B82F6', team: 'Blue',
    trail: [{ lat: 39.718, lng: -104.850 }, { lat: 39.720, lng: -104.848 }],
    ping: { lat: 39.721, lng: -104.846 }, inSafeZone: false, ghost: false,
  },
  {
    id: 'u4', name: 'Sam', color: '#FF5A5F', team: 'Red',
    trail: [], ping: null, inSafeZone: true, ghost: false,
  },
  {
    id: 'u5', name: 'Riley', color: '#3B82F6', team: 'Blue',
    trail: [{ lat: 39.716, lng: -104.838 }],
    ping: { lat: 39.715, lng: -104.836 }, inSafeZone: false, ghost: true,
  },
];

export const SAFE_ZONE_LABEL = 'Safe Zone — no pings here';
