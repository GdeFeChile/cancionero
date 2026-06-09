// Song model: { id, title, key, author, section, genre, lyrics, createdAt, updatedAt }

const STORAGE_KEY = 'gdefe_canciones';

function getAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveAll(songs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
}

function getById(id) {
  return getAll().find(s => s.id === id) || null;
}

function create(data) {
  const songs = getAll();
  const song = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title: data.title || '',
    key: data.key || 'C',
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
  const sections = getAll().map(s => s.section).filter(Boolean);
  return [...new Set(sections)].sort();
}

function filterBySection(section) {
  if (!section) return getAll();
  return getBySection(section);
}

export { getAll, getById, create, update, remove, getBySection, getSections, filterBySection };
