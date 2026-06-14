import DEFAULT_SONGS from './songs-data.js';
import { detectKey } from './chords.js';

const DEFAULT_SECTIONS = [
  'Cuecas',
  'Canciones en inglés',
  'Villancicos'
];
const STORAGE_KEY = 'gdefe_canciones';

function normalizeGenre(g) {
  if (!g || g === 'Neutro') return 'Neutro';
  const lc = g.toLowerCase();
  if (lc === 'hombre') return 'Hombre';
  if (lc === 'mujer') return 'Mujer';
  return g;
}

function normalizeSong(s) {
  return {
    ...s,
    genre: normalizeGenre(s.genre)
  };
}

function getAll() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const songs = JSON.parse(stored).map(normalizeSong);
      // Detect missing keys
      let changed = false;
      for (const song of songs) {
        if (!song.key) {
          song.key = detectKey(song.lyrics);
          changed = true;
        }
      }
      if (changed) saveAll(songs);
      return songs;
    }
  } catch { /* fall through */ }
  // First load: inject default songs
  const data = DEFAULT_SONGS.map(s => ({
    ...normalizeSong(s),
    key: s.key || detectKey(s.lyrics),
    createdAt: s.createdAt || new Date().toISOString(),
    updatedAt: s.updatedAt || new Date().toISOString()
  }));
  saveAll(data);
  return data;
}

function saveAll(songs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
}

function getById(id) {
  const sid = String(id);
  return getAll().find(s => String(s.id) === sid) || null;
}

function create(data) {
  const songs = getAll();
  const song = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title: data.title || '',
    key: data.key || 'C',
    tempo: data.tempo || '',
    author: data.author || '',
    section: data.section || '',
    genre: data.genre || 'Neutro',
    lyrics: data.lyrics || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  songs.push(song);
  saveAll(songs);
  return song;
}

function update(id, data) {
  const songs = getAll();
  const idx = songs.findIndex(s => s.id === id);
  if (idx === -1) return null;
  songs[idx] = { ...songs[idx], ...data, updatedAt: new Date().toISOString() };
  saveAll(songs);
  return songs[idx];
}

function remove(id) {
  const songs = getAll().filter(s => s.id !== id);
  saveAll(songs);
}

function getBySection(section) {
  return getAll().filter(s => s.section === section);
}

function getSections() {
  const fromSongs = getAll().map(s => s.section).filter(Boolean);
  // Keep only default sections + any section assigned to songs
  const activeSections = [...new Set([...DEFAULT_SECTIONS, ...fromSongs])].sort();
  // Sync localStorage to match
  try {
    const extra = activeSections.filter(s => !fromSongs.includes(s) && DEFAULT_SECTIONS.includes(s));
    localStorage.setItem('gdefe_extra_sections', JSON.stringify(extra));
  } catch {}
  return activeSections;
}

function filterBySection(section) {
  if (!section) return getAll();
  return getBySection(section);
}

// Get unique first letters of song titles for A-Z index
function getAlphas() {
  const letters = getAll().map(s => s.title.charAt(0).toUpperCase()).filter(Boolean);
  return [...new Set(letters)].sort();
}

// ── Remote sync: fetch user songs from GitHub ──
// Admin publica canciones editando user-songs.json directo en GitHub.
// La app solo las descarga para que todos las vean.

const USER_SONGS_RAW = 'https://raw.githubusercontent.com/GdeFeChile/cancionero/main/user-songs.json';
let _remoteSongsCache = null;
let _remoteSongsCacheTime = 0;
const REMOTE_CACHE_TTL = 60_000;

async function fetchRemoteUserSongs(force) {
  if (!force && _remoteSongsCache && Date.now() - _remoteSongsCacheTime < REMOTE_CACHE_TTL) {
    return _remoteSongsCache;
  }
  try {
    const res = await fetch(USER_SONGS_RAW);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    _remoteSongsCache = Array.isArray(data) ? data : [];
    _remoteSongsCacheTime = Date.now();
    return _remoteSongsCache;
  } catch (e) {
    console.warn('fetchRemoteUserSongs falló', e.message);
    return _remoteSongsCache || [];
  }
}

// Merge remote user songs into localStorage (called on app init)
export async function syncRemoteUserSongs() {
  const remote = await fetchRemoteUserSongs();
  if (!remote.length) return { added: 0, total: remote.length };

  const songs = getAll();
  let added = 0;
  const localIds = new Set(songs.map(s => s.id));

  for (const song of remote) {
    if (!localIds.has(song.id)) {
      songs.push(normalizeSong(song));
      added++;
    }
  }

  if (added > 0) {
    saveAll(songs);
  }
  return { added, total: remote.length };
}

export { getAll, getById, create, update, remove, getBySection, getSections, filterBySection, getAlphas };
