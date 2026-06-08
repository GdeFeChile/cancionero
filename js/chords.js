const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const CHORD_REGEX = /[A-G][#b]?(m|maj|min|dim|aug|sus[24]?|add[0-9]|[0-9]+)*(?:\/[A-G][#b]?)?/g;

function normalizeNote(note) {
  const flatToSharp = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#', 'Cb': 'B', 'Fb': 'E' };
  if (note.length >= 2 && note[1] === 'b') {
    const normalized = note[0] + 'b';
    return flatToSharp[normalized] || note;
  }
  return note;
}

function transposeChord(chord, semitones) {
  const match = chord.match(/^([A-G][#b]?)(.*)/);
  if (!match) return chord;
  
  let root = normalizeNote(match[1]);
  const suffix = match[2];
  
  const idx = NOTES.indexOf(root);
  if (idx === -1) return chord;
  
  const newIdx = ((idx + semitones) % 12 + 12) % 12;
  return NOTES[newIdx] + suffix;
}

function transposeLyrics(lyrics, semitones) {
  if (semitones === 0) return lyrics;
  return lyrics.replace(CHORD_REGEX, chord => transposeChord(chord, semitones));
}

function getKeyName(semitones) {
  return NOTES[((semitones % 12) + 12) % 12];
}

export { transposeChord, transposeLyrics, getKeyName, NOTES };
