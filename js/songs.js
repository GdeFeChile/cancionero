// ── Songs Module (Supabase + localStorage cache) ──

import { db } from './supabase-client.js';
import { detectKey } from './chords.js';

const STORAGE_KEY = 'gdefe_canciones';
const DEFAULT_SECTIONS = ['Cuecas', 'Canciones en inglés', 'Villancicos'];

// ── In-memory cache ──
let _songsCache = [];
let _cacheLoaded = false;

// ── Normalization ──
function normalizeGenre(g) {
  if (!g || g === 'Neutro') return 'Neutro';
  const lc = g.toLowerCase();
  if (lc === 'hombre') return 'Hombre';
  if (lc === 'mujer') return 'Mujer';
  return g;
}

function normalizeSong(s) {
  return {
    id: s.id,
    title: s.title || '',
    key: s.key || 'C',
    tempo: s.tempo || '',
    author: s.author || '',
    section: s.section || '',
    genre: normalizeGenre(s.genre),
    lyrics: s.lyrics || '',
    createdAt: s.created_at || s.createdAt || '',
    updatedAt: s.updated_at || s.updatedAt || '',
    owner_email: s.owner_email || '',
    is_catalog: s.is_catalog || false
  };
}

// ── Local cache helpers ──
function saveLocalCache(songs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
  } catch { /* quota exceeded */ }
}

function loadLocalCache() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored).map(normalizeSong);
  } catch { /* fall through */ }
  return null;
}

// ══════════════════════════════════════════
//  PUBLIC API
// ══════════════════════════════════════════

// ── Load all songs from Supabase (call once on init) ──
export async function loadAll() {
  try {
    const { data, error } = await db.select('canciones', { order: 'title' });
    if (!error && data && data.length > 0) {
      _songsCache = data.map(normalizeSong);
      _cacheLoaded = true;
      saveLocalCache(_songsCache);
      return _songsCache;
    }
  } catch (e) {
    console.warn('Supabase load falló:', e.message);
  }

  // Fallback: try local cache
  const local = loadLocalCache();
  if (local && local.length > 0) {
    _songsCache = local;
    _cacheLoaded = true;
    return local;
  }

  return _songsCache;
}

// ── Get all songs (sync — uses cache) ──
export function getAll() {
  if (!_cacheLoaded) {
    // Fast path: try local cache synchronously
    const local = loadLocalCache();
    if (local) {
      _songsCache = local;
      _cacheLoaded = true;
      // Kick off async refresh in background
      loadAll().catch(() => {});
    }
  }
  return _songsCache;
}

// ── Get song by ID (sync) ──
export function getById(id) {
  return getAll().find(s => String(s.id) === String(id)) || null;
}

// ── Create song ──
export async function createSong(data, ownerEmail = '') {
  const now = new Date().toISOString();
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  const song = {
    id,
    title: data.title || '',
    key: data.key || 'C',
    tempo: data.tempo || '',
    author: data.author || '',
    section: data.section || '',
    genre: data.genre || 'Neutro',
    lyrics: data.lyrics || '',
    created_at: now,
    updated_at: now,
    owner_email: ownerEmail,
    is_catalog: false
  };

  // Push to Supabase (best effort)
  try {
    await db.insert('canciones', song);
  } catch (e) {
    console.warn('Supabase insert falló:', e.message);
  }

  // Update cache + local
  const normalized = normalizeSong(song);
  _songsCache.push(normalized);
  saveLocalCache(_songsCache);

  return normalized;
}

// ── Update song ──
export async function updateSong(id, data) {
  const songs = getAll();
  const idx = songs.findIndex(s => s.id === id);
  if (idx === -1) return null;

  const updated = {
    ...songs[idx],
    ...data,
    updatedAt: new Date().toISOString()
  };

  // Build the Supabase record (snake_case fields)
  const supabaseRecord = {
    title: updated.title,
    key: updated.key,
    tempo: updated.tempo,
    author: updated.author,
    section: updated.section,
    genre: updated.genre,
    lyrics: updated.lyrics,
    updated_at: updated.updatedAt
  };

  // Push to Supabase (best effort)
  try {
    await db.update('canciones', supabaseRecord, { eq: { id } });
  } catch (e) {
    console.warn('Supabase update falló:', e.message);
  }

  // Update cache + local
  songs[idx] = updated;
  _songsCache = songs;
  saveLocalCache(songs);

  return updated;
}

// ── Remove song ──
export async function removeSong(id) {
  // Remove from Supabase (best effort)
  try {
    await db.remove('canciones', { eq: { id } });
  } catch (e) {
    console.warn('Supabase delete falló:', e.message);
  }

  // Update cache + local
  _songsCache = getAll().filter(s => s.id !== id);
  saveLocalCache(_songsCache);
}

// ══════════════════════════════════════════
//  MIGRATION / SEEDING
// ══════════════════════════════════════════

// ── Seed the 211 catalog songs into Supabase ──
export async function seedCatalogSongs() {
  // Check if catalog songs already exist
  try {
    const { data } = await db.select('canciones', {
      eq: { is_catalog: 'true' },
      limit: 1
    });
    if (data && data.length > 0) {
      return { seeded: false, msg: 'Ya existen canciones del catálogo' };
    }
  } catch { /* fall through */ }

  // Load default songs
  const DEFAULT_SONGS = (await import('./songs-data.js')).default;
  const songs = DEFAULT_SONGS.map(s => ({
    id: String(s.id),
    title: s.title || '',
    key: s.key || detectKey(s.lyrics),
    tempo: s.tempo || '',
    author: s.author || '',
    section: s.section || '',
    genre: normalizeGenre(s.genre),
    lyrics: s.lyrics || '',
    created_at: s.createdAt || new Date().toISOString(),
    updated_at: s.updatedAt || new Date().toISOString(),
    owner_email: '',
    is_catalog: true
  }));

  // Insert in batches of 50
  let inserted = 0;
  for (let i = 0; i < songs.length; i += 50) {
    const batch = songs.slice(i, i + 50);
    try {
      const { error } = await db.insert('canciones', batch);
      if (!error) inserted += batch.length;
    } catch (e) {
      console.warn('Batch insert falló:', e.message);
    }
  }

  // Update cache
  _songsCache = songs.map(normalizeSong);
  _cacheLoaded = true;
  saveLocalCache(_songsCache);

  return { seeded: true, count: inserted };
}

// ── Push existing localStorage songs to Supabase ──
export async function migrateLocalToSupabase() {
  // Check if Supabase already has data
  try {
    const { data, error } = await db.select('canciones', { limit: 1 });
    if (!error && data && data.length > 0) {
      return { migrated: false, reason: 'Supabase ya tiene datos' };
    }
  } catch { /* fall through */ }

  const local = loadLocalCache();
  if (!local || local.length === 0) {
    return { migrated: false, reason: 'No hay datos locales' };
  }

  // Push all local songs to Supabase
  const songs = local.map(s => ({
    id: String(s.id),
    title: s.title,
    key: s.key || 'C',
    tempo: s.tempo || '',
    author: s.author || '',
    section: s.section || '',
    genre: s.genre || 'Neutro',
    lyrics: s.lyrics || '',
    created_at: s.createdAt || new Date().toISOString(),
    updated_at: s.updatedAt || new Date().toISOString(),
    owner_email: '',
    is_catalog: /^\d+$/.test(String(s.id)) // numeric IDs = catalog
  }));

  let inserted = 0;
  for (let i = 0; i < songs.length; i += 50) {
    const batch = songs.slice(i, i + 50);
    try {
      const { error } = await db.insert('canciones', batch);
      if (!error) inserted += batch.length;
    } catch (e) {
      console.warn('Migrate batch falló:', e.message);
    }
  }

  // Update cache
  _songsCache = local;
  _cacheLoaded = true;

  return { migrated: true, count: inserted };
}

// ══════════════════════════════════════════
//  LEGACY SYNC HELPERS (removed)
// ══════════════════════════════════════════
// syncRemoteUserSongs ya no es necesaria —
// ahora las canciones viven en Supabase.

// ══════════════════════════════════════════
//  SECTION / ALPHA HELPERS
// ══════════════════════════════════════════

export function getSections() {
  const fromSongs = getAll().map(s => s.section).filter(Boolean);
  const activeSections = [...new Set([...DEFAULT_SECTIONS, ...fromSongs])].sort();
  return activeSections;
}

export function getBySection(section) {
  return getAll().filter(s => s.section === section);
}

export function filterBySection(section) {
  if (!section) return getAll();
  return getBySection(section);
}

export function getAlphas() {
  const letters = getAll().map(s => s.title.charAt(0).toUpperCase()).filter(Boolean);
  return [...new Set(letters)].sort();
}
