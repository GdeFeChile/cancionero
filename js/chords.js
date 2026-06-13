const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const CHROMA = { 'C':0, 'C#':1, 'D':2, 'D#':3, 'E':4, 'F':5, 'F#':6, 'G':7, 'G#':8, 'A':9, 'A#':10, 'B':11 };
// Only match chords that are standalone tokens: preceded by start/space/non-letter
// and followed by space/end/non-letter — prevents matching inside words like "Aleluya" or "Dios"
const CHORD_REGEX = /(?<=^|[\s[\]()\/,;.!¡¿?])[A-G][#b]?([Mm][#b]?|maj|min|dim|aug|sus[24]?|add[0-9]|[0-9]+)*(?:\/[A-G][#b]?([Mm][#b]?|maj|min|dim|aug|sus[24]?|add[0-9]|[0-9]+)*)?(?=[\s[\]()\/,;.!¡¿?]|$)/g;

function normalizeNote(note) {
  const flatToSharp = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#', 'Cb': 'B', 'Fb': 'E' };
  if (note.length >= 2 && note[1] === 'b') {
    const normalized = note[0] + 'b';
    return flatToSharp[normalized] || note;
  }
  return note;
}

function transposeChord(chord, semitones) {
  // Check for slash chord (e.g., C/E, Am/G, F#m/D)
  const slashIdx = chord.indexOf('/');
  if (slashIdx === -1) {
    // Simple chord — no bass
    const match = chord.match(/^([A-G][#b]?)(.*)/);
    if (!match) return chord;
    let root = normalizeNote(match[1]);
    const suffix = match[2];
    const idx = NOTES.indexOf(root);
    if (idx === -1) return chord;
    const newIdx = ((idx + semitones) % 12 + 12) % 12;
    return NOTES[newIdx] + suffix;
  }

  // Slash chord: transpose BOTH root and bass
  const rootPart = chord.slice(0, slashIdx);
  const bassPart = chord.slice(slashIdx + 1);

  const transposed = (part) => {
    const m = part.match(/^([A-G][#b]?)(.*)/);
    if (!m) return part;
    let note = normalizeNote(m[1]);
    const suffix = m[2];
    const idx = NOTES.indexOf(note);
    if (idx === -1) return part;
    const newIdx = ((idx + semitones) % 12 + 12) % 12;
    return NOTES[newIdx] + suffix;
  };

  return transposed(rootPart) + '/' + transposed(bassPart);
}

function transposeLyrics(lyrics, semitones) {
  if (semitones === 0) return lyrics;
  return lyrics.replace(CHORD_REGEX, chord => transposeChord(chord, semitones));
}

function getKeyName(semitones) {
  return NOTES[((semitones % 12) + 12) % 12];
}

/**
 * Extract root semitone and quality from a chord string like "G", "Am7", "D/F#", "C#maj7"
 * Returns { semitone, isMinor } or null if unparseable.
 */
function chordInfo(chordStr) {
  const m = chordStr.match(/^([A-G][#b]?)(.*)/);
  if (!m) return null;
  const root = normalizeNote(m[1]);
  const semitone = CHROMA[root];
  if (semitone === undefined) return null;
  const suffix = m[2] || '';
  // Minor if suffix starts with 'm'/'min' but NOT 'maj'
  const isMinor = /^(m(?!aj)|min)/.test(suffix);
  return { semitone, isMinor };
}

/**
 * Detect the most likely key of a song using harmonic analysis.
 * Extracts ALL chords from the lyrics, then scores all 24 candidate keys
 * (12 major + 12 minor) based on how well the chords fit diatonically.
 */
function detectKey(lyrics) {
  // Pre-process: normalize chord separators (hyphens, slashes) so CHORD_REGEX
  // can detect them. Same approach as normalizeChordSeparators in app.js.
  const normalized = lyrics
    .replace(/\s*-\s*/g, ' ')       // D#m-B-F# → D#m B F#
    .replace(/(?<=[A-G][#b]?[mM]?)\/\//g, ' ')  // trailing // → space
    .replace(/\/\/(?=[A-G])/g, ' ');  // leading // before chord → space

  const lines = normalized.split('\n');
  const chords = [];

  // Extract ALL chords across the song
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//')) continue;
    const matches = [...trimmed.matchAll(CHORD_REGEX)];
    for (const m of matches) {
      const info = chordInfo(m[0]);
      if (info) chords.push(info);
    }
  }

  if (chords.length === 0) return 'C';

  // Deduplicate: keep unique (semitone, isMinor) pairs in order of first appearance
  const seen = new Set();
  const uniq = [];
  for (const c of chords) {
    const key = c.semitone * 2 + (c.isMinor ? 1 : 0);
    if (!seen.has(key)) {
      seen.add(key);
      uniq.push(c);
    }
  }

  const firstChord = chords[0];

  // Score all 24 keys
  let bestScore = -Infinity;
  let bestKey = 'C';

  for (let r = 0; r < 12; r++) {
    const majorScore = scoreKey(r, false, uniq, firstChord);
    if (majorScore > bestScore) {
      bestScore = majorScore;
      bestKey = NOTES[r];
    }
    const minorScore = scoreKey(r, true, uniq, firstChord);
    if (minorScore > bestScore) {
      bestScore = minorScore;
      bestKey = NOTES[r] + 'm';
    }
  }

  return bestKey;
}

/**
 * Score how well a set of chords fits a candidate key.
 * @param {number} keyRoot - Root semitone of the key (0-11)
 * @param {boolean} isMinor - True for minor key, false for major
 * @param {Array} chords - Array of { semitone, isMinor } unique chord infos
 * @param {Object} firstChord - The first chord that appears in the song
 */
function scoreKey(keyRoot, isMinor, chords, firstChord) {
  let score = 0;

  for (const c of chords) {
    const interval = ((c.semitone - keyRoot) % 12 + 12) % 12;

    if (isMinor) {
      // Natural minor diatonic degrees with weights:
      //   i(0m)=4, III(3M)=3, VI(8M)=3, VII(10M)=3
      //   iv(5m)=2, v(7m)=2, V(7M)=3 (harmonic minor)
      //   vii°(2dim)=1
      if (interval === 0 && c.isMinor) score += 4;
      else if (interval === 7 && !c.isMinor) score += 3;  // V (harmonic minor)
      else if (interval === 3 && !c.isMinor) score += 3;  // III
      else if (interval === 8 && !c.isMinor) score += 3;  // VI
      else if (interval === 10 && !c.isMinor) score += 3; // VII
      else if (interval === 5 && c.isMinor) score += 2;   // iv
      else if (interval === 7 && c.isMinor) score += 2;   // v
      else if (interval === 2) score += 1;                 // ii°/II
      else if (interval === 4 && !c.isMinor) score += 1;  // III+ (lydian)
      else if (interval === 9 && c.isMinor) score += 1;   // vi° (dorian)
      else if (interval === 0 && !c.isMinor) score += 1;  // I (borrowed)
      else if (interval === 6) score -= 2;                 // tritone — strong penalty
      else score -= 1;
    } else {
      // Major diatonic degrees with weights:
      //   I(0M)=4, IV(5M)=3, V(7M)=3
      //   ii(2m)=2, iii(4m)=2, vi(9m)=2
      //   vii°(11dim)=1
      if (interval === 0 && !c.isMinor) score += 4; // I
      else if (interval === 5 && !c.isMinor) score += 3; // IV
      else if (interval === 7 && !c.isMinor) score += 3; // V
      else if (interval === 2 && c.isMinor) score += 2;  // ii
      else if (interval === 4 && c.isMinor) score += 2;  // iii
      else if (interval === 9 && c.isMinor) score += 2;  // vi
      else if (interval === 11) score += 1;               // vii°
      else if (interval === 3 && !c.isMinor) score += 1; // bIII (borrowed)
      else if (interval === 8 && !c.isMinor) score += 1; // bVI (borrowed)
      else if (interval === 10 && !c.isMinor) score += 1;// bVII (borrowed)
      else if (interval === 0 && c.isMinor) score += 1;  // i (borrowed)
      else if (interval === 6) score -= 2;                // tritone — strong penalty
      else score -= 1;
    }
  }

  // Bonus: first chord matching the tonic
  const firstInt = ((firstChord.semitone - keyRoot) % 12 + 12) % 12;
  if (isMinor && firstInt === 0 && firstChord.isMinor) score += 3;
  if (!isMinor && firstInt === 0 && !firstChord.isMinor) score += 3;

  return score;
}

export { transposeChord, transposeLyrics, getKeyName, NOTES, detectKey };
