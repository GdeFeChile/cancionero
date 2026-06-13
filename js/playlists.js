// js/playlists.js — Módulo CRUD para setlists (playlists) con persistencia en localStorage
const STORAGE_KEY = 'gdefe_playlists';

function getAll() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const list = JSON.parse(stored);
      // Ordenar por fecha DESC (más reciente primero)
      list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      return list;
    }
  } catch { /* fall through */ }
  return [];
}

function saveAll(playlists) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists));
}

function getById(id) {
  return getAll().find(p => p.id === id) || null;
}

function create({ name, date }) {
  const playlists = getAll();
  const playlist = {
    id: 'pl_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: name || '',
    date: date || '',
    songs: [],
    createdAt: new Date().toISOString()
  };
  playlists.push(playlist);
  saveAll(playlists);
  return playlist;
}

function remove(id) {
  const playlists = getAll().filter(p => p.id !== id);
  saveAll(playlists);
}

function addSong(playlistId, songId) {
  const playlists = getAll();
  const pl = playlists.find(p => p.id === playlistId);
  if (!pl) return false;
  if (pl.songs.includes(songId)) return false; // No duplicados
  pl.songs.push(songId);
  saveAll(playlists);
  return true;
}

function removeSong(playlistId, songId) {
  const playlists = getAll();
  const pl = playlists.find(p => p.id === playlistId);
  if (!pl) return;
  pl.songs = pl.songs.filter(s => s !== songId);
  saveAll(playlists);
}

function moveSong(playlistId, songId, direction) {
  const playlists = getAll();
  const pl = playlists.find(p => p.id === playlistId);
  if (!pl) return;
  const idx = pl.songs.indexOf(songId);
  if (idx === -1) return;
  if (direction === 'up' && idx > 0) {
    [pl.songs[idx - 1], pl.songs[idx]] = [pl.songs[idx], pl.songs[idx - 1]];
  } else if (direction === 'down' && idx < pl.songs.length - 1) {
    [pl.songs[idx], pl.songs[idx + 1]] = [pl.songs[idx + 1], pl.songs[idx]];
  }
  saveAll(playlists);
}

export { getAll, getById, create, remove, addSong, removeSong, moveSong };
