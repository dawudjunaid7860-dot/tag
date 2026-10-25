// Phase 2b — the backend layer.
//
// This is the app's ONLY way to touch chat and feed data. Every screen
// goes through these functions, never through a local array of its own.
//
// TODAY it runs on-device: chat + feed live in memory and, on the web,
// in localStorage, so they survive a reload in the browser. That is
// deliberate: the interface below is exactly what a cloud backend
// (Supabase / Firebase) needs — sendMessage, toggleReaction, addFeed,
// subscribe — so swapping the storage underneath is a one-file change
// in this module, with no screen code changing.
//
// What it is NOT yet: multi-phone sync. Your phone cannot see another
// phone's messages until a cloud project (URL + anon key) is plugged
// in here. That is the next backend step, and it needs a project to be
// created first — no keys are invented or hard-coded here.

import { Platform } from 'react-native';

const STORAGE_KEY = 'tag-backend-v1';

const seedMessages = [
  { id: 'm1', author: 'Maya', text: "Let's go! I'm hiding near the park 🔥", time: '6:02 PM', reactions: { '🔥': ['Jordan'], '👍': ['You'] } },
  { id: 'm2', author: 'Jordan', text: 'Good luck catching me 😂', time: '6:05 PM', reactions: { '😂': ['Maya'] } },
  { id: 'm3', author: 'Riley', text: 'Safe zone is my home base, no pings there 👻', time: '6:07 PM', reactions: {} },
];

const seedFeed = ['Game started — Classic mode. Good luck!'];

const defaultScores = () => ({
  You: { tags: 0, revives: 0, flags: 0, hill: 0 },
  Maya: { tags: 0, revives: 0, flags: 0, hill: 0 },
  Jordan: { tags: 0, revives: 0, flags: 0, hill: 0 },
  Riley: { tags: 0, revives: 0, flags: 0, hill: 0 },
});

let state = { messages: [...seedMessages], feed: [...seedFeed], scores: defaultScores(), tournament: null, season: 'Season 1' };
const listeners = new Set();

function save() {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch (e) { /* on-device memory only, that is fine */ }
}

function load() {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.messages) && Array.isArray(parsed.feed)) {
          state = { ...state, ...parsed, scores: parsed.scores || defaultScores() };
        }
      }
    }
  } catch (e) { /* start from seeds */ }
}
load();

function notify() {
  save();
  listeners.forEach((fn) => fn({ ...state }));
}

export const backend = {
  getMessages: () => [...state.messages],
  getFeed: () => [...state.feed],

  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  sendMessage(author, text) {
    const clean = (text || '').trim();
    if (!clean) return null;
    const msg = {
      id: `m${Date.now()}`,
      author,
      text: clean,
      time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      reactions: {},
    };
    state = { ...state, messages: [...state.messages, msg] };
    notify();
    return msg;
  },

  toggleReaction(messageId, emoji, user) {
    state = {
      ...state,
      messages: state.messages.map((m) => {
        if (m.id !== messageId) return m;
        const users = [...(m.reactions[emoji] || [])];
        const idx = users.indexOf(user);
        if (idx >= 0) users.splice(idx, 1);
        else users.push(user);
        const reactions = { ...m.reactions };
        if (users.length) reactions[emoji] = users;
        else delete reactions[emoji];
        return { ...m, reactions };
      }),
    };
    notify();
  },

  addFeed(text) {
    state = { ...state, feed: [text, ...state.feed].slice(0, 30) };
    notify();
  },

  // Phase 3 — leaderboard, tournaments, seasons.
  getScores: () => JSON.parse(JSON.stringify(state.scores)),
  getTournament: () => state.tournament,
  getSeason: () => state.season,

  recordTag(tagger) {
    const scores = { ...state.scores };
    if (!scores[tagger]) scores[tagger] = { tags: 0, revives: 0, flags: 0, hill: 0 };
    scores[tagger].tags += 1;
    state = { ...state, scores };
    notify();
  },

  recordRevive(name) {
    const scores = { ...state.scores };
    if (!scores[name]) scores[name] = { tags: 0, revives: 0, flags: 0, hill: 0 };
    scores[name].revives += 1;
    state = { ...state, scores };
    notify();
  },

  recordFlag(name) {
    const scores = { ...state.scores };
    if (!scores[name]) scores[name] = { tags: 0, revives: 0, flags: 0, hill: 0 };
    scores[name].flags += 1;
    state = { ...state, scores };
    notify();
  },

  recordHill(name) {
    const scores = { ...state.scores };
    if (!scores[name]) scores[name] = { tags: 0, revives: 0, flags: 0, hill: 0 };
    scores[name].hill += 1;
    state = { ...state, scores };
    notify();
  },

  resetSeason() {
    const n = parseInt((state.season.match(/\d+/) || ['1'])[0], 10) + 1;
    state = { ...state, scores: defaultScores(), season: `Season ${n}` };
    notify();
  },

  createTournament() {
    const code = Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
    state = { ...state, tournament: { code, teams: ['Aurora Crew', 'School Squad'], status: 'Open — share the code with friends' } };
    notify();
    return state.tournament;
  },

  joinTournament(code) {
    const clean = (code || '').trim().toUpperCase();
    if (!clean) return null;
    state = { ...state, tournament: { code: clean, teams: ['Aurora Crew', 'School Squad'], status: 'Joined — waiting for the bracket' } };
    notify();
    return state.tournament;
  },
};

export const REACTION_EMOJIS = ['👍', '🔥', '😂', '🎉', '👻'];
export const AUTHOR_COLORS = { You: '#22C55E', Maya: '#FF5A5F', Jordan: '#3B82F6', Riley: '#3B82F6', Sam: '#FF5A5F' };
