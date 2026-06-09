import { getAll, getById, create, update, remove, getBySection, getSections, filterBySection } from './songs.js';
import { transposeChord, transposeLyrics, getKeyName, NOTES } from './chords.js';
import { startTuner, stopTuner, setOnPitchDetected, getIsRunning } from './tuner.js';
import {
  renderSongCard, renderSongDetail, renderSongForm, renderTuner, renderEmptyState,
  showModal, hideModal, showToast, navigate, getFormData, escapeHtml,
  iconPlus, iconPencil, iconTrash, iconPlay, iconPause, iconMusicNote, iconHome, iconArrowLeft,
  confirmModalHtml, renderValidationError, clearValidationErrors,
  renderFilterBar, renderEmptyFilterState,
  renderAutoScrollControl, renderBottomNav
} from './ui.js';

const $main = document.getElementById('main-content');

function render(html) {
  $main.innerHTML = html;
  $main.classList.remove('route-fade');
  // Trigger reflow to restart animation
  void $main.offsetWidth;
  $main.classList.add('route-fade');
}

// Route handlers
let activeSection = null;

function songList() {
  const sections = getSections();
  const songs = filterBySection(activeSection);
  
  let html = '<div class="toolbar">';
  html += `<button class="btn btn-primary" id="btn-add-song">${iconPlus()} Agregar canción</button>`;
  html += renderFilterBar(sections, activeSection);
  html += '</div><div class="song-grid">';
  
  if (!songs.length) {
    if (activeSection) {
      html += renderEmptyFilterState();
    } else {
      html += renderEmptyState('Agrega tu primera canción');
    }
  } else {
    html += songs.map(renderSongCard).join('');
  }
  html += '</div>';
  render(html);
  
  // Add click handler to add button
  document.getElementById('btn-add-song')?.addEventListener('click', () => navigate('#/nueva'));
  
  // Wire filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.dataset.section || null;
      activeSection = activeSection === section ? null : section;
      songList();
    });
  });
  
  // Add click handlers to cards
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => navigate(`#/cancion/${card.dataset.id}`));
  });
}

function songDetail(id) {
  const song = getById(id);
  if (!song) { navigate('#/canciones'); return; }
  
  let transposeOffset = 0;
  let scrolling = false;
  let rafId = null;
  let scrollSpeed = 1;
  
  let html = renderSongDetail(song);
  html += renderAutoScrollControl({ speed: scrollSpeed, playing: false });
  html += `
    <div class="song-controls">
      <div class="transpose-controls">
        <button class="btn btn-icon" id="transpose-down">${iconArrowLeft()}</button>
        <span>Tono: <strong id="current-key">${song.key || 'C'}</strong></span>
        <button class="btn btn-icon" id="transpose-up"><svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></button>
      </div>
      <button class="btn btn-secondary" id="btn-edit-song">${iconPencil()} Editar</button>
      <button class="btn btn-danger" id="btn-delete">${iconTrash()} Eliminar</button>
    </div>
  `;
  render(html);
  
  // ── Transpose ──
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
  
  // ── Edit navigation ──
  document.getElementById('btn-edit-song')?.addEventListener('click', () => navigate(`#/editar/${id}`));
  
  // ── Delete with styled modal ──
  document.getElementById('btn-delete')?.addEventListener('click', () => {
    showModal(confirmModalHtml({
      title: 'Eliminar canción',
      message: `¿Estás seguro de eliminar "${song.title}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar'
    }));
    document.getElementById('modal-confirm')?.addEventListener('click', () => {
      hideModal();
      remove(id);
      showToast('Canción eliminada', 'success');
      navigate('#/canciones');
    });
    document.getElementById('modal-cancel')?.addEventListener('click', () => hideModal());
  });
  
  // ── Auto-scroll ──
  document.getElementById('btn-auto-scroll')?.addEventListener('click', () => {
    scrolling = !scrolling;
    const btn = document.getElementById('btn-auto-scroll');
    if (scrolling) {
      btn.innerHTML = iconPause();
      btn.setAttribute('aria-label', 'Pausar auto-scroll');
      startScroll();
    } else {
      btn.innerHTML = iconPlay();
      btn.setAttribute('aria-label', 'Iniciar auto-scroll');
      stopScroll();
    }
  });
  
  const speedInput = document.getElementById('scroll-speed');
  const speedLabel = document.getElementById('scroll-speed-label');
  if (speedInput && speedLabel) {
    speedInput.addEventListener('input', (e) => {
      scrollSpeed = parseFloat(e.target.value);
      speedLabel.textContent = scrollSpeed + 'x';
    });
  }
  
  function startScroll() {
    const container = document.querySelector('.song-scroll-container');
    if (!container) return;
    function frame() {
      if (!scrolling) return;
      container.scrollTop += 0.3 * scrollSpeed;
      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);
  }
  
  function stopScroll() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }
}

function songForm(id = null) {
  const song = id ? getById(id) : null;
  render(renderSongForm(song));
  
  const form = document.querySelector('.song-form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    clearValidationErrors();
    
    const data = getFormData(form);
    const errors = {};
    
    if (!data.title.trim()) errors.title = 'El título es obligatorio';
    if (!data.key) errors.key = 'Selecciona un tono';
    if (!data.author.trim()) errors.author = 'El autor es obligatorio';
    if (!data.section.trim()) errors.section = 'La sección es obligatoria';
    if (!data.lyrics.trim()) errors.lyrics = 'La letra es obligatoria';
    
    if (Object.keys(errors).length) {
      Object.entries(errors).forEach(([field, msg]) => {
        renderValidationError(field, msg);
      });
      showToast('Corrige los errores del formulario', 'error');
      return;
    }
    
    // Loading state
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner"></span> Guardando...';
    
    // Small delay to show loading state
    setTimeout(() => {
      if (id) {
        update(id, data);
        showToast('Canción actualizada', 'success');
        navigate(`#/cancion/${id}`);
      } else {
        const created = create(data);
        showToast('Canción creada', 'success');
        navigate(`#/cancion/${created.id}`);
      }
      btn.disabled = false;
      btn.innerHTML = originalText;
    }, 200);
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

// Bottom nav render helper
function updateBottomNav() {
  const oldNav = document.querySelector('.bottom-nav');
  if (oldNav) oldNav.remove();
  document.body.insertAdjacentHTML('beforeend', renderBottomNav());
}

// Router
function router() {
  const hash = window.location.hash.slice(1) || '/canciones';
  
  if (hash === '/' || hash === '/canciones') { songList(); updateBottomNav(); return; }
  
  const detailMatch = hash.match(/^\/cancion\/(.+)/);
  if (detailMatch) { songDetail(detailMatch[1]); updateBottomNav(); return; }
  
  const editMatch = hash.match(/^\/editar\/(.+)/);
  if (editMatch) { songForm(editMatch[1]); updateBottomNav(); return; }
  
  if (hash === '/nueva') { songForm(); updateBottomNav(); return; }
  if (hash === '/afinador') { tunerView(); updateBottomNav(); return; }
  
  navigate('#/canciones');
}

// Init
function init() {
  // Create toast container
  const toastContainer = document.createElement('div');
  toastContainer.className = 'toast-container';
  document.body.appendChild(toastContainer);
  
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
window.showToast = showToast;
