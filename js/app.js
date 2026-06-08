import { getAll, getById, create, update, remove, getSections } from './songs.js';
import { transposeChord, transposeLyrics, getKeyName, NOTES } from './chords.js';
import { startTuner, stopTuner, setOnPitchDetected, getIsRunning } from './tuner.js';
import { renderSongCard, renderSongDetail, renderSongForm, renderTuner, renderEmptyState, showModal, hideModal, showToast, navigate, getFormData, escapeHtml } from './ui.js';

const $main = document.getElementById('main-content');

function render(html) {
  $main.innerHTML = html;
}

// Route handlers
function songList() {
  const songs = getAll();
  const sections = getSections();
  
  let html = '<div class="toolbar">';
  html += '<button class="btn btn-primary" onclick="navigate(\'#/nueva\')">+ Agregar canción</button>';
  if (sections.length) {
    html += '<div class="filter-bar">';
    html += sections.map(s => `<button class="btn btn-secondary" data-section="${s}">${s}</button>`).join('');
    html += '</div>';
  }
  html += '</div><div class="song-grid">';
  
  if (!songs.length) {
    html += renderEmptyState('Agrega tu primera canción');
  } else {
    html += songs.map(renderSongCard).join('');
  }
  html += '</div>';
  render(html);
  
  // Add click handlers to cards
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => navigate(`#/cancion/${card.dataset.id}`));
  });
}

function songDetail(id) {
  const song = getById(id);
  if (!song) { navigate('#/canciones'); return; }
  
  let transposeOffset = 0;
  let html = renderSongDetail(song);
  html += `
    <div class="song-controls">
      <div class="transpose-controls">
        <button class="btn btn-icon" id="transpose-down">−</button>
        <span>Tono: <strong id="current-key">${song.key || 'C'}</strong></span>
        <button class="btn btn-icon" id="transpose-up">+</button>
      </div>
      <button class="btn btn-secondary" onclick="navigate('#/editar/${id}')">Editar</button>
      <button class="btn btn-danger" id="btn-delete">Eliminar</button>
    </div>
  `;
  render(html);
  
  document.getElementById('transpose-up')?.addEventListener('click', () => {
    transposeOffset++;
    const lyricsEl = document.querySelector('.song-lyrics');
    if (lyricsEl) lyricsEl.innerHTML = transposeLyrics(song.lyrics, transposeOffset).replace(/\n/g, '<br>');
    document.getElementById('current-key').textContent = getKeyName(NOTES.indexOf(song.key || 'C') + transposeOffset);
  });
  
  document.getElementById('transpose-down')?.addEventListener('click', () => {
    transposeOffset--;
    const lyricsEl = document.querySelector('.song-lyrics');
    if (lyricsEl) lyricsEl.innerHTML = transposeLyrics(song.lyrics, transposeOffset).replace(/\n/g, '<br>');
    document.getElementById('current-key').textContent = getKeyName(NOTES.indexOf(song.key || 'C') + transposeOffset);
  });
  
  document.getElementById('btn-delete')?.addEventListener('click', () => {
    if (confirm('¿Eliminar esta canción?')) {
      remove(id);
      showToast('Canción eliminada', 'success');
      navigate('#/canciones');
    }
  });
}

function songForm(id = null) {
  const song = id ? getById(id) : null;
  render(renderSongForm(song));
  
  const form = document.querySelector('.song-form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const data = getFormData(form);
    
    if (id) {
      update(id, data);
      showToast('Canción actualizada', 'success');
      navigate(`#/cancion/${id}`);
    } else {
      const created = create(data);
      showToast('Canción creada', 'success');
      navigate(`#/cancion/${created.id}`);
    }
  });
}

function tunerView() {
  render(renderTuner());
  const btn = document.getElementById('btn-tuner');
  
  btn.addEventListener('click', async () => {
    if (getIsRunning()) {
      stopTuner();
      btn.textContent = 'Iniciar Afinador';
      btn.className = 'btn btn-primary';
    } else {
      try {
        await startTuner();
        btn.textContent = 'Detener';
        btn.className = 'btn btn-danger';
        setOnPitchDetected(pitch => {
          const noteEl = document.querySelector('.tuner-note');
          const freqEl = document.querySelector('.tuner-frequency');
          const centsEl = document.querySelector('.tuner-cents');
          if (noteEl) noteEl.textContent = `${pitch.note}${pitch.octave}`;
          if (freqEl) freqEl.textContent = `${pitch.frequency} Hz`;
          if (centsEl) {
            centsEl.textContent = `${pitch.cents > 0 ? '+' : ''}${pitch.cents}¢`;
            centsEl.className = `tuner-cents ${Math.abs(pitch.cents) < 5 ? 'in-tune' : ''}`;
          }
        });
      } catch {
        showToast('No se pudo acceder al micrófono', 'error');
      }
    }
  });
}

// Router
function router() {
  const hash = window.location.hash.slice(1) || '/canciones';
  
  if (hash === '/' || hash === '/canciones') { songList(); return; }
  
  const detailMatch = hash.match(/^\/cancion\/(.+)/);
  if (detailMatch) { songDetail(detailMatch[1]); return; }
  
  const editMatch = hash.match(/^\/editar\/(.+)/);
  if (editMatch) { songForm(editMatch[1]); return; }
  
  if (hash === '/nueva') { songForm(); return; }
  if (hash === '/afinador') { tunerView(); return; }
  
  navigate('#/canciones');
}

// Init
function init() {
  window.addEventListener('hashchange', router);
  router();
  
  // Keyboard: Escape closes modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') hideModal();
  });
}

document.addEventListener('DOMContentLoaded', init);

// Re-export for inline onclick
window.navigate = navigate;
