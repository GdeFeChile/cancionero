import { getAll, getById, create, update, remove, getSections } from './songs.js';
import { transposeLyrics, getKeyName, NOTES } from './chords.js';
import { startTuner, stopTuner, setOnPitchDetected, getIsRunning, renderGauge } from './tuner.js';

// ── Chord Notation Helpers ──
const NOTE_TO_SPANISH = { 'C':'Do', 'C#':'Do#', 'Db':'Reb', 'D':'Re', 'D#':'Re#', 'Eb':'Mib', 'E':'Mi', 'F':'Fa', 'F#':'Fa#', 'Gb':'Solb', 'G':'Sol', 'G#':'Sol#', 'Ab':'Lab', 'A':'La', 'A#':'La#', 'Bb':'Sib', 'B':'Si' };
function displayKeyName(semitones) {
  const en = getKeyName(semitones);
  return useSpanishNotation ? (NOTE_TO_SPANISH[en] || en) : en;
}
function displayChordKey(note) {
  if (!useSpanishNotation) return note;
  // Handle minor suffix like "Am" → "Lam", "C#m" → "Do#m"
  const match = note.match(/^([A-G][#b]?)(m?)$/);
  if (match) {
    const base = NOTE_TO_SPANISH[match[1]] || match[1];
    return base + (match[2] || '');
  }
  return NOTE_TO_SPANISH[note] || note;
}

// ── State ──
let activeAlpha = 'ALL';
let activeSection = null;
let searchQuery = '';
let currentId = null;
let currentTranspose = 0;
let fontSize = 120;
let showChords = true;
let chordsAbove = false;
let useSpanishNotation = false;
let numCols = 1;
let isScrolling = false;
let scrollRaf = null;
let scrollSpeed = 3;
let currentView = 'songs';
let searchTimer;

// ── DOM references ──
const $songList = document.getElementById('songList');
const $alphaTabs = document.getElementById('alphaTabs');
const $colHead = document.getElementById('colHead');
const $colCount = document.getElementById('colCount');
const $searchInput = document.getElementById('searchInput');
const $searchClear = document.getElementById('searchClear');
const $welcome = document.getElementById('welcomeScreen');
const $songView = document.getElementById('songView');
const $tunerView = document.getElementById('tunerView');
const $songBody = document.getElementById('songBody');
const $songTitle = document.getElementById('songTitle');
const $songMeta = document.getElementById('songMeta');
const $currentKey = document.getElementById('currentKey');
const $sidebar = document.getElementById('sidebar');
const $mobBtn = document.getElementById('mobBtn');
const $mobOvl = document.getElementById('mobOvl');

// ── Theme ──
const currentTheme = localStorage.getItem('gdefe_theme') ||
  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
document.documentElement.setAttribute('data-theme', currentTheme);
document.getElementById('themeBtn').textContent = currentTheme === 'dark' ? '☀️' : '🌙';
document.getElementById('themeBtn').addEventListener('click', () => {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  document.getElementById('themeBtn').textContent = next === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('gdefe_theme', next);
});

// ── View switching ──
document.getElementById('vp1').addEventListener('click', () => showView('songs'));
document.getElementById('vp2').addEventListener('click', () => showView('tuner'));

function showView(view) {
  currentView = view;
  document.querySelectorAll('.vp').forEach(b => b.classList.remove('active'));
  if (view === 'songs') {
    document.getElementById('vp1').classList.add('active');
    $welcome.style.display = 'flex';
    $songView.style.display = 'none';
    $tunerView.classList.remove('active');
    renderAll();
  } else {
    document.getElementById('vp2').classList.add('active');
    $welcome.style.display = 'none';
    $songView.style.display = 'none';
    $tunerView.classList.add('active');
    stopAutoScroll();
  }
}

// ── Mobile sidebar ──
$mobBtn.addEventListener('click', () => { $sidebar.classList.toggle('open'); $mobOvl.classList.toggle('active'); });
$mobOvl.addEventListener('click', () => { $sidebar.classList.remove('open'); $mobOvl.classList.remove('active'); });

// ── Search ──
$searchInput.addEventListener('input', (e) => {
  const val = e.target.value;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchQuery = val;
    renderSongList();
  }, 150);
});

$searchClear.addEventListener('click', () => {
  $searchInput.value = '';
  searchQuery = '';
  $searchClear.classList.remove('visible');
  renderSongList();
  $searchInput.focus();
});

// ── Helpers ──
function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ── Render Alpha Tabs ──
function renderAlphaTabs() {
  const songs = getAll();
  const alphas = [...new Set(songs.map(s => s.title.charAt(0).toUpperCase()).filter(Boolean))].sort();
  const sections = getSections();

  let html = '';
  // A-Z buttons
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(l => {
    const has = alphas.includes(l);
    html += `<button class="ab${has ? ' has' : ''}${activeAlpha === l ? ' active' : ''}" data-l="${l}">${l}</button>`;
  });

  if (sections.length) html += '<div class="alpha-sep"></div>';

  // Section buttons (abbreviated)
  sections.forEach(s => {
    const abbr = s.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
    html += `<button class="ab-sec${activeSection === s ? ' active' : ''}" data-section="${escapeHtml(s)}" title="${escapeHtml(s)}">${abbr}</button>`;
  });

  $alphaTabs.innerHTML = html;

  // Wire alpha buttons
  $alphaTabs.querySelectorAll('.ab').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.l) {
        activeAlpha = activeAlpha === btn.dataset.l ? 'ALL' : btn.dataset.l;
        activeSection = null;
      }
      renderSongList();
      renderAlphaTabs();
    });
  });

  $alphaTabs.querySelectorAll('.ab-sec').forEach(btn => {
    btn.addEventListener('click', () => {
      const s = btn.dataset.section;
      activeSection = activeSection === s ? null : s;
      activeAlpha = 'ALL';
      renderSongList();
      renderAlphaTabs();
    });
  });
}

// ── Render Song List ──
function renderSongList() {
  // Quick fade hint when filters change
  $songList.style.opacity = '.5';

  let songs = getAll();

  // Filter by alpha
  if (activeAlpha !== 'ALL') {
    songs = songs.filter(s => s.title.charAt(0).toUpperCase() === activeAlpha);
  }

  // Filter by section
  if (activeSection) {
    songs = songs.filter(s => s.section === activeSection);
  }

  // Filter by search (with accent normalization)
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    songs = songs.filter(s => s.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q));
  }

  // Update header
  const label = activeSection || (activeAlpha !== 'ALL' ? activeAlpha : 'Todas');
  $colHead.textContent = label;
  $colCount.textContent = songs.length;

  if (!songs.length) {
    const msg = searchQuery.trim() ? 'No se encontraron canciones' : 'No hay canciones';
    $songList.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted);font-size:.8rem">' + msg + '</div>';
    return;
  }

  $songList.innerHTML = songs.map(s => {
    const isActive = String(s.id) === String(currentId);
    const sectionLabel = s.section ? `<div class="si-meta">${escapeHtml(s.section)}</div>` : '';
    return `
      <div class="si${isActive ? ' active' : ''}" data-id="${s.id}" tabindex="0">
        <div>
          <div class="si-title">${escapeHtml(s.title)}</div>
          ${sectionLabel}
        </div>
        <span class="si-key">${s.key || 'C'}</span>
      </div>
    `;
  }).join('');

  // Wire song clicks
  $songList.querySelectorAll('.si').forEach(el => {
    el.addEventListener('click', () => {
      openSong(el.dataset.id);
    });
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      // Basic context menu would go here
    });
  });

  // Update clear button visibility
  $searchClear.classList.toggle('visible', searchQuery !== '');

  // Restore opacity after DOM update
  requestAnimationFrame(() => { $songList.style.opacity = '1'; });
}

// ── Open Song ──
function openSong(id) {
  const song = getById(id);
  if (!song) return;

  currentId = song.id;
  currentTranspose = 0;

  $welcome.style.display = 'none';
  $songView.style.display = 'flex';
  $tunerView.classList.remove('active');

  // Trigger enter animation (remove class to restart if same view)
  $songView.classList.remove('song-view-enter');
  // Force reflow so the class removal registers before re-adding
  void $songView.offsetWidth;
  $songView.classList.add('song-view-enter');

  // Update sidebar active state
  $songList.querySelectorAll('.si').forEach(el => el.classList.toggle('active', String(el.dataset.id) === String(currentId)));

  // Render header
  $songTitle.textContent = song.title;
  const rawKey = song.key || 'C';
  $songMeta.textContent = (song.author ? escapeHtml(song.author) + ' · ' : '') + 'Tono: ' + displayChordKey(rawKey) + (song.tempo ? ' · ♩ ' + song.tempo + ' bpm' : '');
  $currentKey.textContent = displayChordKey(rawKey);

  renderLyrics(song);
  updateActiveSong();
}

// Spanish chord notation → English (La→A, Mi→E, Re→D, etc.)
// Only converts at end-of-line where chords are, NOT in words like "Mi" (my) or "Si" (if)
function normalizeSpanishChords(lyrics) {
  const esMap = { 'Do':'C', 'Re':'D', 'Mi':'E', 'Fa':'F', 'Sol':'G', 'La':'A', 'Si':'B' };
  const esRegex = /^(Do|Re|Mi|Fa|Sol|La|Si)([#b]?(?:[Mm]?(?:[#b]|[0-9]+)?|\d+))?$/;

  return lyrics.split('\n').map(line => {
    const tokens = line.trim().split(/\s+/);
    if (tokens.length < 2) return line;

    // Scan from end for chord tokens (English or Spanish)
    let chordStart = tokens.length;
    for (let i = tokens.length - 1; i >= 0; i--) {
      const isEsChord = esRegex.test(tokens[i]);
      if (isEsChord) {
        chordStart = i;
      } else {
        break;
      }
    }

    if (chordStart >= tokens.length) return line;

    // Convert Spanish roots to English in chord tokens only
    const normalized = tokens.map((t, i) => {
      if (i < chordStart) return t;
      for (const [es, en] of Object.entries(esMap)) {
        if (t === es || t.startsWith(es + '#') || t.startsWith(es + 'b') ||
            t === es + 'm' || t === es + 'M' ||
            t.startsWith(es + 'm') || t.startsWith(es + 'M')) {
          return en + t.slice(es.length);
        }
      }
      return t;
    });

    return normalized.join(' ');
  }).join('\n');
}

// Convert English chord notation to Spanish (visual only)
// A→La, C→Do, D→Re, E→Mi, F→Fa, G→Sol, B→Si
function toSpanishNotation(text) {
  const map = [
    ['C#', 'Do#'], ['Db', 'Reb'],
    ['D#', 'Re#'], ['Eb', 'Mib'],
    ['F#', 'Fa#'], ['Gb', 'Solb'],
    ['G#', 'Sol#'], ['Ab', 'Lab'],
    ['A#', 'La#'], ['Bb', 'Sib'],
    ['C', 'Do'], ['D', 'Re'], ['E', 'Mi'],
    ['F', 'Fa'], ['G', 'Sol'], ['A', 'La'], ['B', 'Si']
  ];
  // Match chords as standalone tokens (same lookahead/behind as CHORD_REGEX)
  const chordFind = /(?<=^|[\s[\]()\/,;.!¡¿?])[A-G][#b]?([Mm][#b]?|maj|min|dim|aug|sus[24]?|add[0-9]|[0-9]+)*(?:\/[A-G][#b]?([Mm][#b]?|maj|min|dim|aug|sus[24]?|add[0-9]|[0-9]+)*)?(?=[\s[\]()\/,;.!¡¿?]|$)/g;
  return text.replace(chordFind, chord => {
    for (const [en, es] of map) {
      if (chord.startsWith(en)) {
        const rest = chord.slice(en.length);
        // Avoid matching "C" inside "C#"/"Cb" — already handled by longer patterns first
        return es + rest;
      }
    }
    return chord;
  });
}

// Normalize chord separators in lyrics:
//   F#-C#-D#m → F#  C#  D#m   (hyphen-separated chords)
//   C#F#       → C# F#         (concatenated roots)
//   C#//       → C#            (trailing PDF markers)
//   /Fm        → Fm            (leading slash on chords)
function normalizeChordSeparators(lyrics) {
  // Step 0: All hyphens in this data are chord separators (never in song lyrics)
  //   F#-C#-D#m → F#  C#  D#m,  Fm - C# → Fm  C#,  G#// → G#
  lyrics = lyrics.replace(/-/g, '  ');

  // Step 1: Split concatenated roots where one ends and another begins (C#F# → C# F#)
  const chordRoot = '[A-G][#b]?(?:[Mm]?[#b]?|maj|min|dim|aug|sus[24]?|add[0-9]|[0-9]+)*';
  const reConcat = new RegExp('(' + chordRoot + ')(?=' + chordRoot + ')', 'g');
  lyrics = lyrics.replace(reConcat, '$1 ');

  // Step 2: Remove leading / from chord tokens that follow a space or line start
  //   /Fm → Fm,   //D#m → D#m   (does not affect section labels like // CORO)
  lyrics = lyrics.replace(/\/+(?=[A-G][#b]?(?:[Mm]?[#b]?|\d))/g, ' ');

  // Step 3: Strip trailing // markers that follow a chord (PDF artifacts: C#// → C#)
  lyrics = lyrics.replace(/([A-G][#b]?(?:M|m|dim|aug|sus[24]?|[0-9]+)*)\/{2,}/g, '$1');

  return lyrics;
}

function renderLyrics(song) {
  let lyrics = song.lyrics || 'Sin letra';

  // Normalize chord separators: F#-C#-D#m → F#  C#  D#m, C#F# → C# F#
  lyrics = normalizeChordSeparators(lyrics);

  // Normalize Spanish chord notation → English (La→A, Mi→E, etc.)
  lyrics = normalizeSpanishChords(lyrics);

  if (currentTranspose !== 0) {
    lyrics = transposeLyrics(lyrics, currentTranspose);
  }

  // Chord token regex — matches standalone chord symbols (D, Dm, F#m, D/F#, D/Bm, Fm#)
  const chordToken = /^[A-G][#b]?([Mm][#b]?|maj|min|dim|aug|sus[24]?|add[0-9]|[0-9]+)*(?:\/[A-G][#b]?([Mm][#b]?|maj|min|dim|aug|sus[24]?|add[0-9]|[0-9]+)*)?$/;

  // Convert individual chord text to Spanish notation (e.g. "C G Am" → "Do Sol Lam")
  const CHORD_TO_ES = [
    ['C#', 'Do#'], ['Db', 'Reb'], ['D#', 'Re#'], ['Eb', 'Mib'],
    ['F#', 'Fa#'], ['Gb', 'Solb'], ['G#', 'Sol#'], ['Ab', 'Lab'],
    ['A#', 'La#'], ['Bb', 'Sib'], ['C', 'Do'], ['D', 'Re'],
    ['E', 'Mi'], ['F', 'Fa'], ['G', 'Sol'], ['A', 'La'], ['B', 'Si']
  ];
  function toSpanishChordsText(text) {
    if (!useSpanishNotation) return text;
    const convNote = (p) => {
      for (const [en, es] of CHORD_TO_ES) {
        if (p === en || (p.startsWith(en) && /^[#bmM0-9\/]/.test(p[en.length] || ''))) {
          return es + p.slice(en.length);
        }
      }
      return p;
    };
    return text.split(/\s+/).map(t => {
      // Split on / to convert both root and bass separately
      return t.split('/').map(convNote).join('/');
    }).join(' ');
  }

  // Pure chord line: every token is a chord
  function isPureChordLine(line) {
    const tokens = line.trim().split(/\s+/);
    if (!tokens.length) return false;
    return tokens.length > 0 && tokens.every(t => chordToken.test(t));
  }

  // Mixed line: lyrics followed by chords at the end
  // Returns { lyrics, chords } or null
  function getMixedParts(line) {
    const tokens = line.trim().split(/\s+/);
    if (tokens.length < 2) return null;

    // Scan from the end for consecutive chord tokens
    let chordStart = tokens.length;
    for (let i = tokens.length - 1; i >= 0; i--) {
      if (chordToken.test(tokens[i])) {
        chordStart = i;
      } else {
        break;
      }
    }

    if (chordStart === 0 || chordStart >= tokens.length) return null;

    return {
      lyrics: tokens.slice(0, chordStart).join(' '),
      chords: tokens.slice(chordStart).join(' ')
    };
  }

  // A line is a section label only if it's a SHORT ALL-CAPS word
  // after removing // or [] prefixes (e.g. [CORO], //PUENTE, // Estrofa)
  function isSectionLabel(line) {
    if (!/^[\[\/]/.test(line)) return false;
    const text = line.replace(/^[\/\[\]]+/, '').trim();
    return text.length > 0 && text.length < 30 && text.toUpperCase() === text;
  }

  const lines = lyrics.split('\n');
  let html = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      html += '<div class="empty-line"></div>';
      continue;
    }

    if (isSectionLabel(line)) {
      const text = line.replace(/^[\/\[\]]+/, '').trim();
      html += `<div class="section-label">${escapeHtml(text)}</div>`;
      continue;
    }

    // Clean marker prefixes (//, ///, [], etc.) for non-section lines
    const cleanLine = /^[\[\/]/.test(line) ? line.replace(/^[\/\[\]]+/, '').trim() : line;

    if (isPureChordLine(cleanLine)) {
      // Collect ALL consecutive chord lines (skip empties) to merge with next lyric
      let chordLines = [cleanLine];
      let nextIdx = i + 1;
      while (nextIdx < lines.length) {
        const nl = lines[nextIdx].trim();
        if (!nl) { nextIdx++; continue; }
        const cleanNl = /^[\[\/]/.test(nl) ? nl.replace(/^[\/\[\]]+/, '').trim() : nl;
        if (isPureChordLine(cleanNl)) {
          chordLines.push(cleanNl);
          nextIdx++;
        } else {
          break;
        }
      }
      // Skip empty lines after chords
      while (nextIdx < lines.length && !lines[nextIdx].trim()) nextIdx++;

      if (nextIdx < lines.length) {
        const nextLine = lines[nextIdx].trim();
        // Merge only if next line is lyrics or section-like content
        const cleanNext = /^[\[\/]/.test(nextLine) ? nextLine.replace(/^[\/\[\]]+/, '').trim() : nextLine;
        if (!isPureChordLine(cleanNext) && !isSectionLabel(nextLine)) {
          const combinedChords = chordLines.join('  ');
          const chordsHtml = escapeHtml(toSpanishChordsText(combinedChords));
          const lyricsHtml = escapeHtml(cleanNext);
          if (chordsAbove) {
            html += `<div class="chord-above-block"><div class="song-line"><span class="chord-line">${chordsHtml}</span></div><div class="song-line"><span class="lyric-line">${lyricsHtml}</span></div></div>`;
          } else {
            html += `<div class="song-line mixed-line"><span class="lyric-text">${lyricsHtml}</span><span class="chord-inline">${chordsHtml}</span></div>`;
          }
          i = nextIdx;
          continue;
        }
      }
      // Can't merge — render as chord lines
      chordLines.forEach(cl => {
        html += `<div class="song-line"><span class="chord-line">${escapeHtml(toSpanishChordsText(cl))}</span></div>`;
      });
      i = nextIdx - 1; // Skip ahead past accumulated chords
      continue;
    }

    // Check if inline mixed (lyrics + chords at end)
    const mixed = getMixedParts(cleanLine);
    if (mixed) {
      const chordsHtml = escapeHtml(toSpanishChordsText(mixed.chords));
      const lyricsHtml = escapeHtml(mixed.lyrics);
      if (chordsAbove) {
        html += `<div class="chord-above-block"><div class="song-line"><span class="chord-line">${chordsHtml}</span></div><div class="song-line"><span class="lyric-line">${lyricsHtml}</span></div></div>`;
      } else {
        html += `<div class="song-line mixed-line"><span class="lyric-text">${lyricsHtml}</span><span class="chord-inline">${chordsHtml}</span></div>`;
      }
    } else {
      // Pure lyric line — already cleaned from markers
      html += `<div class="song-line"><span class="lyric-line">${escapeHtml(cleanLine)}</span></div>`;
    }
  }

  $songBody.innerHTML = html;
  $songBody.className = 'song-body' + (numCols === 2 ? ' two-col' : '');
  $songBody.style.fontSize = fontSize + '%';
  $songBody.classList.toggle('hide-chords', !showChords);

  // Reset scroll
  $songBody.scrollTop = 0;
}

function updateActiveSong() {
  // Update chord toggle button
  const chordsBtn = document.getElementById('btnChords');
  chordsBtn.style.opacity = showChords ? '1' : '.4';

  // Update layout toggle button
  const layoutBtn = document.getElementById('btnLayout');
  if (layoutBtn) {
    layoutBtn.classList.toggle('on', chordsAbove);
  }

  // Update notation toggle button
  const notBtn = document.getElementById('btnNotation');
  if (useSpanishNotation) {
    notBtn.textContent = '🇪🇸';
    notBtn.title = 'Notación española (Do Re Mi) — clic para americana';
    notBtn.style.opacity = '1';
  } else {
    notBtn.textContent = '🇺🇸';
    notBtn.title = 'Notación americana (C D E) — clic para española';
    notBtn.style.opacity = '.4';
  }

  // Update column buttons
  document.getElementById('btnCol1').classList.toggle('on', numCols === 1);
  document.getElementById('btnCol2').classList.toggle('on', numCols === 2);
}

// ── Wire Song Detail Controls ──
document.getElementById('trDown').addEventListener('click', () => {
  if (currentTranspose <= -12) return;
  currentTranspose--;
  const song = getById(currentId);
  if (song) {
    const idx = Math.max(0, NOTES.indexOf(song.key || 'C'));
    $currentKey.textContent = displayKeyName(idx + currentTranspose);
    renderLyrics(song);
  }
  document.getElementById('trDown').disabled = currentTranspose <= -12;
  document.getElementById('trUp').disabled = false;
});

document.getElementById('trUp').addEventListener('click', () => {
  if (currentTranspose >= 12) return;
  currentTranspose++;
  const song = getById(currentId);
  if (song) {
    const idx = Math.max(0, NOTES.indexOf(song.key || 'C'));
    $currentKey.textContent = displayKeyName(idx + currentTranspose);
    renderLyrics(song);
  }
  document.getElementById('trUp').disabled = currentTranspose >= 12;
  document.getElementById('trDown').disabled = false;
});

document.getElementById('btnFontDown').addEventListener('click', () => {
  fontSize = Math.max(60, fontSize - 10);
  $songBody.style.fontSize = fontSize + '%';
});

document.getElementById('btnFontUp').addEventListener('click', () => {
  fontSize = Math.min(200, fontSize + 10);
  $songBody.style.fontSize = fontSize + '%';
});

document.getElementById('btnCol1').addEventListener('click', () => {
  numCols = 1;
  $songBody.classList.remove('two-col');
  document.getElementById('btnCol1').classList.add('on');
  document.getElementById('btnCol2').classList.remove('on');
});

document.getElementById('btnCol2').addEventListener('click', () => {
  numCols = 2;
  $songBody.classList.add('two-col');
  document.getElementById('btnCol2').classList.add('on');
  document.getElementById('btnCol1').classList.remove('on');
});

document.getElementById('btnChords').addEventListener('click', () => {
  showChords = !showChords;
  $songBody.classList.toggle('hide-chords', !showChords);
  const btn = document.getElementById('btnChords');
  btn.style.opacity = showChords ? '1' : '.4';
});

document.getElementById('btnLayout').addEventListener('click', () => {
  chordsAbove = !chordsAbove;
  const btn = document.getElementById('btnLayout');
  btn.classList.toggle('on', chordsAbove);
  openSong(currentId);
});

document.getElementById('btnNotation').addEventListener('click', () => {
  useSpanishNotation = !useSpanishNotation;
  const btn = document.getElementById('btnNotation');
  if (useSpanishNotation) {
    btn.textContent = '🇪🇸';
    btn.title = 'Notación española (Do Re Mi) — clic para americana';
    btn.style.opacity = '1';
  } else {
    btn.textContent = '🇺🇸';
    btn.title = 'Notación americana (C D E) — clic para española';
    btn.style.opacity = '.4';
  }
  const song = getById(currentId);
  if (song) {
    const idx = Math.max(0, NOTES.indexOf(song.key || 'C'));
    $currentKey.textContent = displayKeyName(idx + currentTranspose);
    renderLyrics(song);
  }
});

document.getElementById('btnPrint').addEventListener('click', () => window.print());

document.getElementById('btnEditSong').addEventListener('click', () => {
  const song = getById(currentId);
  if (!song) return;
  openEditModal(song);
});

document.getElementById('btnDelete').addEventListener('click', () => {
  const song = getById(currentId);
  if (!song) return;
  showModal(`
    <div class="modal-head">
      <h3>Eliminar canción</h3>
      <button class="modal-close" id="modalClose">✕</button>
    </div>
    <div class="modal-body">
      <p>¿Estás seguro de eliminar "<strong>${escapeHtml(song.title)}</strong>"? Esta acción no se puede deshacer.</p>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" id="modalCancel">Cancelar</button>
      <button class="btn btn-danger" id="modalConfirm">Eliminar</button>
    </div>
  `);
  document.getElementById('modalConfirm').addEventListener('click', () => {
    remove(currentId);
    hideModal();
    currentId = null;
    $songView.style.display = 'none';
    $welcome.style.display = 'flex';
    renderSongList();
    renderAlphaTabs();
  });
  document.getElementById('modalCancel').addEventListener('click', hideModal);
  document.getElementById('modalClose').addEventListener('click', hideModal);
});

// ── Scroll Progress Bar ──
const $scrollProgress = document.getElementById('scrollProgress');
const $scrollProgressFill = document.getElementById('scrollProgressFill');
let scrollProgressTimer = null;

function updateScrollProgress() {
  const { scrollTop, scrollHeight, clientHeight } = $songBody;
  const maxScroll = scrollHeight - clientHeight;
  const percent = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
  $songBody.style.setProperty('--scroll-progress', `${percent}%`);

  // Show bar and reset idle timer
  $scrollProgress.classList.add('active');
  clearTimeout(scrollProgressTimer);
  scrollProgressTimer = setTimeout(() => {
    $scrollProgress.classList.remove('active');
  }, 1000);
}

let scrollProgressRaf = null;
$songBody.addEventListener('scroll', () => {
  if (!scrollProgressRaf) {
    scrollProgressRaf = requestAnimationFrame(() => {
      scrollProgressRaf = null;
      updateScrollProgress();
    });
  }
});

// ── Keyboard navigation (arrow keys in song list) ──
document.addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
  // Don't interfere with search input, modals, or editing
  if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
  if (document.querySelector('.modal-overlay')) return;

  const items = $songList.querySelectorAll('.si');
  if (!items.length) return;

  // Find active index
  let activeIdx = -1;
  for (let i = 0; i < items.length; i++) {
    if (items[i].classList.contains('active')) { activeIdx = i; break; }
  }

  let nextIdx;
  if (e.key === 'ArrowDown') {
    nextIdx = activeIdx < items.length - 1 ? activeIdx + 1 : 0;
  } else {
    nextIdx = activeIdx > 0 ? activeIdx - 1 : items.length - 1;
  }

  e.preventDefault();
  const id = items[nextIdx].dataset.id;
  if (id) openSong(id);
});

// ── Auto-scroll ──
document.getElementById('scrollBtn').addEventListener('click', () => {
  isScrolling = !isScrolling;
  const btn = document.getElementById('scrollBtn');
  if (isScrolling) {
    btn.textContent = '⏸ Auto-scroll';
    btn.classList.add('on');
    startAutoScroll();
  } else {
    btn.textContent = '▶ Auto-scroll';
    btn.classList.remove('on');
    stopAutoScroll();
  }
});

document.getElementById('scrollSpeed').addEventListener('input', (e) => {
  scrollSpeed = parseFloat(e.target.value);
});

function startAutoScroll() {
  function frame() {
    if (!isScrolling) return;
    $songBody.scrollTop += 0.4 * scrollSpeed;
    scrollRaf = requestAnimationFrame(frame);
  }
  scrollRaf = requestAnimationFrame(frame);
}

function stopAutoScroll() {
  if (scrollRaf) {
    cancelAnimationFrame(scrollRaf);
    scrollRaf = null;
  }
}

// ── Modal ──
function showModal(html) {
  const overlay = document.getElementById('modalOverlay');
  document.getElementById('modalContent').innerHTML = html;
  overlay.classList.add('active');
  overlay.addEventListener('click', (e) => { if (e.target === overlay) hideModal(); });
  document.addEventListener('keydown', onModalKeydown);
}

function hideModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  document.removeEventListener('keydown', onModalKeydown);
}

function onModalKeydown(e) {
  if (e.key === 'Escape') hideModal();
}

// ── Edit / Add Modal ──
function openEditModal(song) {
  const isNew = !song;
  const s = song || {};
  const sections = getSections();

  showModal(`
    <div class="modal-head">
      <h3>${isNew ? 'Agregar' : 'Editar'} canción</h3>
      <button class="modal-close" id="modalClose">✕</button>
    </div>
    <div class="modal-body">
      <div class="frow">
        <div class="fg">
          <label>Título</label>
          <input type="text" id="fTitle" value="${escapeHtml(s.title || '')}" placeholder="Título de la canción">
        </div>
        <div class="fg">
          <label>Tono</label>
          <select id="fKey">
            ${['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'].map(k =>
              `<option value="${k}" ${s.key === k ? 'selected' : ''}>${k}</option>`
            ).join('')}
          </select>
        </div>
        <div class="fg">
          <label>Tempo (BPM)</label>
          <input type="number" id="fTempo" value="${s.tempo || ''}" placeholder="120" min="40" max="240">
        </div>
      </div>
      <div class="frow">
        <div class="fg">
          <label>Autor</label>
          <input type="text" id="fAuthor" value="${escapeHtml(s.author || '')}" placeholder="Autor o banda">
        </div>
        <div class="fg">
          <label>Género vocal</label>
          <select id="fGender">
            ${['Neutro', 'Mujer', 'Hombre'].map(g =>
              `<option value="${g}" ${(s.genre || 'Neutro') === g ? 'selected' : ''}>${g}</option>`
            ).join('')}
          </select>
        </div>
      </div>
      <div class="fg">
        <label>Sección</label>
        <select id="fSection">
          <option value="">Sin sección</option>
          ${sections.map(sec =>
            `<option value="${escapeHtml(sec)}" ${s.section === sec ? 'selected' : ''}>${escapeHtml(sec)}</option>`
          ).join('')}
        </select>
      </div>
      <div class="fg">
        <label>Letra y Acordes</label>
        <textarea id="fLyrics" rows="15" placeholder="Copia aquí la letra con acordes...">${escapeHtml(s.lyrics || '')}</textarea>
        <div class="form-help">Los acordes se detectan automáticamente. Usa <code>//</code> para marcar secciones.</div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" id="modalCancel">Cancelar</button>
      <button class="btn btn-primary" id="modalSave">${isNew ? 'Agregar' : 'Guardar'}</button>
    </div>
  `);

  document.getElementById('modalSave').addEventListener('click', () => {
    const data = {
      title: document.getElementById('fTitle').value.trim(),
      key: document.getElementById('fKey').value,
      tempo: document.getElementById('fTempo').value,
      author: document.getElementById('fAuthor').value.trim(),
      genre: document.getElementById('fGender').value,
      section: document.getElementById('fSection').value,
      lyrics: document.getElementById('fLyrics').value
    };
    if (!data.title) { showToast('El título es obligatorio'); return; }
    if (!data.lyrics) { showToast('La letra es obligatoria'); return; }

    if (isNew) {
      const created = create(data);
      hideModal();
      openSong(created.id);
      renderSongList();
      renderAlphaTabs();
    } else {
      update(s.id, data);
      hideModal();
      openSong(s.id);
      renderSongList();
    }
  });

  document.getElementById('modalCancel').addEventListener('click', hideModal);
  document.getElementById('modalClose').addEventListener('click', hideModal);
}

// ── Sidebar Add Buttons ──
document.getElementById('btnAddSong').addEventListener('click', () => openEditModal(null));
document.getElementById('btnAddSection').addEventListener('click', () => {
  const sec = prompt('Nombre de la nueva sección:');
  if (sec && sec.trim()) {
    // Add to localStorage custom sections (will be loaded via songs.js in future)
    const existing = JSON.parse(localStorage.getItem('gdefe_extra_sections') || '[]');
    if (!existing.includes(sec.trim())) existing.push(sec.trim());
    localStorage.setItem('gdefe_extra_sections', JSON.stringify(existing));
    renderAlphaTabs();
    renderSongList();
    showToast(`Sección "${sec.trim()}" agregada`);
  }
});

// ── Tuner ──
const $tunerNote = document.getElementById('tunerNote');
const $tunerFreq = document.getElementById('tunerFreq');
const $tunerStatus = document.getElementById('tunerStatus');
const $tmInd = document.getElementById('tmInd');
const $btnTuner = document.getElementById('btnTuner');
const $tunerCanvas = document.getElementById('tunerCanvas');
const $tunerHint = document.querySelector('.tuner-hint');
const $strBtns = document.querySelectorAll('.str-btn');

$strBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    $strBtns.forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
  });
});

$btnTuner.addEventListener('click', async () => {
  if (getIsRunning()) {
    stopTuner();
    $btnTuner.textContent = '🎸 Iniciar Afinador';
    $btnTuner.classList.remove('on');
    $tunerHint.textContent = 'Toca una nota para empezar. El medidor indica qué tan afinado estás.';
    $tunerHint.style.color = '';
  } else {
    try {
      await startTuner();
      $btnTuner.textContent = '⏹ Detener';
      $btnTuner.classList.add('on');
      $tunerHint.textContent = 'Toca una cuerda para empezar…';
      setOnPitchDetected(pitch => {
        $tunerNote.textContent = `${pitch.note}${pitch.octave}`;
        $tunerFreq.textContent = `${pitch.frequency.toFixed(1)} Hz`;

        const cents = Math.max(-50, Math.min(50, pitch.cents || 0));

        // Render canvas gauge with note+freq in center
        const absCents = Math.abs(pitch.cents || 0);
        let status = 'flat';
        if (absCents < 5) status = 'in-tune';
        else if (pitch.cents > 0) status = 'sharp';
        renderGauge($tunerCanvas, cents, status, `${pitch.note}${pitch.octave}`, `${pitch.frequency.toFixed(1)} Hz`);

        $tunerHint.textContent = absCents < 5 ? '✅ ¡Afinado! Sigue tocando…' : 'Sigue tocando…';
        $tunerHint.style.color = absCents < 5 ? 'var(--accent)' : '';

        if (absCents < 5) {
          $tunerStatus.textContent = '✅ ¡Afinado!';
          $tunerStatus.className = 'tuner-status in-tune';
        } else if (pitch.cents < 0) {
          $tunerStatus.textContent = `⬇ ${Math.round(absCents)}¢ (bajo)`;
          $tunerStatus.className = 'tuner-status flat';
        } else {
          $tunerStatus.textContent = `⬆ ${Math.round(absCents)}¢ (alto)`;
          $tunerStatus.className = 'tuner-status sharp';
        }
      });
    } catch {
      showToast('No se pudo acceder al micrófono', 'error');
    }
  }
});

// ── Tuner Gauge Resize Handler ──
// Re-render the gauge on resize so it stays crisp
let resizeTimeout;
window.addEventListener('resize', () => {
  if (!getIsRunning() && !$tunerView.classList.contains('active')) return;
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    renderGauge($tunerCanvas, 0, 'flat');
  }, 200);
});

// ── Toast ──
function showToast(message, type) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}
window.showToast = showToast;

// ── Render All ──
function renderAll() {
  renderAlphaTabs();
  renderSongList();
}

// ── Init ──
renderAll();
