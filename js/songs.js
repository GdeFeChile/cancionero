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

// ── Remote sync (via GitHub API) ──
// Syncs user-created songs across devices using user-songs.json in the repo.

const USER_SONGS_RAW = 'https://raw.githubusercontent.com/GdeFeChile/cancionero/main/user-songs.json';
let _remoteSongsCache = null;
let _remoteSongsCacheTime = 0;
const REMOTE_CACHE_TTL = 60_000;

// Fetch remote user songs from GitHub raw
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
  const remoteIds = new Set(remote.map(s => s.id));
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

// Push locally-created songs (non-numeric IDs) that aren't yet in remote
export async function pushLocalSongsToRemote() {
  const cfg = getCfg();
  if (!cfg) return { ok: false, error: 'no_token', pushed: 0 };

  const local = getAll().filter(s => !/^\d+$/.test(String(s.id)));
  if (!local.length) return { ok: true, pushed: 0 };

  const remote = await fetchRemoteUserSongs(true);
  const remoteIds = new Set(remote.map(s => s.id));
  const toPush = local.filter(s => !remoteIds.has(s.id));
  if (!toPush.length) return { ok: true, pushed: 0 };

  try {
    const file = await ghGetFile(cfg);
    const current = JSON.parse(atob(file.content));
    for (const s of toPush) current.push(s);
    const content = btoa(JSON.stringify(current, null, 2));
    await ghPutFile(cfg, file.sha, content, `Sincronizar ${toPush.length} canción(es) local(es)`);
    _remoteSongsCache = null;
    return { ok: true, pushed: toPush.length };
  } catch (e) {
    return { ok: false, error: e.message, pushed: 0 };
  }
}

// GitHub API helpers
function getCfg() {
  // Check localStorage first (works on GitHub Pages), then window config
  const fromLS = localStorage.getItem('gdefe_github_config');
  if (fromLS) {
    try {
      const c = JSON.parse(fromLS);
      if (c && c.token) return c;
    } catch {}
  }
  const cfg = window.__GITHUB_CONFIG;
  if (!cfg || !cfg.token || !cfg.userSongsFilePath) return null;
  return cfg;
}

async function ghGetFile(cfg) {
  const url = `https://api.github.com/repos/${cfg.repo}/contents/${cfg.userSongsFilePath}`;
  const res = await fetch(url, {
    headers: { Authorization: `token ${cfg.token}`, Accept: 'application/vnd.github.v3+json' }
  });
  if (!res.ok) throw new Error('GET ' + res.status);
  return await res.json();
}

async function ghPutFile(cfg, sha, content, message) {
  const url = `https://api.github.com/repos/${cfg.repo}/contents/${cfg.userSongsFilePath}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `token ${cfg.token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message, content, sha, branch: cfg.branch })
  });
  if (!res.ok) throw new Error('PUT ' + res.status);
  return true;
}

// Push a new song to remote user-songs.json
export async function pushSongToRemote(song) {
  const cfg = getCfg();
  if (!cfg) return { ok: false, error: 'no_token' };

  try {
    const file = await ghGetFile(cfg);
    const current = JSON.parse(atob(file.content));
    current.push(song);
    const content = btoa(JSON.stringify(current, null, 2));
    await ghPutFile(cfg, file.sha, content, `Agregar canción: ${song.title}`);
    _remoteSongsCache = null; // invalidate cache
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// Update a song in remote user-songs.json
export async function updateSongRemote(song) {
  const cfg = getCfg();
  if (!cfg) return { ok: false, error: 'no_token' };

  try {
    const file = await ghGetFile(cfg);
    const current = JSON.parse(atob(file.content));
    const idx = current.findIndex(s => s.id === song.id);
    if (idx === -1) {
      current.push(song);
    } else {
      current[idx] = song;
    }
    const content = btoa(JSON.stringify(current, null, 2));
    await ghPutFile(cfg, file.sha, content, `Actualizar canción: ${song.title}`);
    _remoteSongsCache = null;
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// Remove a song from remote user-songs.json
export async function removeSongRemote(id) {
  const cfg = getCfg();
  if (!cfg) return { ok: false, error: 'no_token' };

  try {
    const file = await ghGetFile(cfg);
    const current = JSON.parse(atob(file.content));
    const filtered = current.filter(s => s.id !== id);
    if (filtered.length === current.length) return { ok: true }; // nothing to remove
    const content = btoa(JSON.stringify(filtered, null, 2));
    await ghPutFile(cfg, file.sha, content, `Eliminar canción ID: ${id}`);
    _remoteSongsCache = null;
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export { getAll, getById, create, update, remove, getBySection, getSections, filterBySection, getAlphas };
