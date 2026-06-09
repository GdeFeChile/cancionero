function renderSongCard(song) {
  return `
    <article class="card" data-id="${song.id}">
      <h3 class="card__title">${escapeHtml(song.title)}</h3>
      ${song.author ? `<p class="card__author">${escapeHtml(song.author)}</p>` : ''}
      <div class="card__footer">
        ${song.section ? `<span class="badge">${escapeHtml(song.section)}</span>` : ''}
        ${song.key ? `<span class="badge badge-key">${escapeHtml(song.key)}</span>` : ''}
      </div>
    </article>
  `;
}

function renderSongDetail(song) {
  const lyrics = song.lyrics ? song.lyrics.replace(/\n/g, '<br>') : 'Sin letra';
  return `
    <div class="song-detail">
      <div class="song-header">
        <h2>${escapeHtml(song.title)}</h2>
        ${song.author ? `<p class="song-author">${escapeHtml(song.author)}</p>` : ''}
        <p class="song-key">Tono: <strong>${song.key || 'C'}</strong></p>
      </div>
      <div class="song-scroll-container">
        <div class="song-lyrics">${lyrics}</div>
      </div>
    </div>
  `;
}

function renderSongForm(song = null) {
  const s = song || {};
  return `
    <form class="song-form" data-id="${s.id || ''}">
      <div class="form-group">
        <label for="title">Título *</label>
        <input type="text" id="title" name="title" value="${escapeHtml(s.title || '')}" required>
        <span class="form-error" id="title-error" role="alert"></span>
      </div>
      <div class="form-group">
        <label for="key">Tono *</label>
        <select id="key" name="key" required>
          <option value="">Selecciona un tono</option>
          ${['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'].map(k =>
            `<option value="${k}" ${s.key === k ? 'selected' : ''}>${k}</option>`
          ).join('')}
        </select>
        <span class="form-error" id="key-error" role="alert"></span>
      </div>
      <div class="form-group">
        <label for="author">Autor *</label>
        <input type="text" id="author" name="author" value="${escapeHtml(s.author || '')}" required>
        <span class="form-error" id="author-error" role="alert"></span>
      </div>
      <div class="form-group">
        <label for="section">Sección *</label>
        <input type="text" id="section" name="section" value="${escapeHtml(s.section || '')}" required>
        <span class="form-error" id="section-error" role="alert"></span>
      </div>
      <div class="form-group">
        <label for="genre">Género vocal</label>
        <select id="genre" name="genre">
          ${['Sin especificar', 'Mujer', 'Hombre', 'Neutro'].map(g =>
            `<option value="${g}" ${(s.genre || 'Neutro') === g ? 'selected' : ''}>${g}</option>`
          ).join('')}
        </select>
      </div>
      <div class="form-group">
        <label for="lyrics">Letra y Acordes *</label>
        <textarea id="lyrics" name="lyrics" rows="15" required>${escapeHtml(s.lyrics || '')}</textarea>
        <span class="form-error" id="lyrics-error" role="alert"></span>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Guardar</button>
        <button type="button" class="btn btn-secondary" onclick="history.back()">Cancelar</button>
      </div>
    </form>
  `;
}

function renderTuner() {
  return `
    <div class="tuner">
      <h2>Afinador</h2>
      <div class="tuner-display">
        <div class="tuner-note">—</div>
        <div class="tuner-frequency">0 Hz</div>
        <div class="tuner-cents"></div>
      </div>
      <button id="btn-tuner" class="btn btn-primary">Iniciar Afinador</button>
      <div class="tuner-strings">
        <p>Toca las notas de referencia: E4 B3 G3 D3 A2 E2</p>
      </div>
    </div>
  `;
}

function renderEmptyState(message = 'No hay canciones aún') {
  return `<div class="empty-state"><p>${escapeHtml(message)}</p></div>`;
}

function showModal(html) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal">${html}</div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) hideModal(); });
  document.body.appendChild(overlay);
}

function hideModal() {
  const m = document.querySelector('.modal-overlay');
  if (m) m.remove();
}

function showToast(message, type = 'info') {
  const container = document.querySelector('.toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast--out');
    setTimeout(() => toast.remove(), 250);
  }, 3000);
}

function navigate(hash) {
  window.location.hash = hash;
}

function getFormData(form) {
  const data = {};
  new FormData(form).forEach((v, k) => { data[k] = v; });
  return data;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ── SVG Icons ──────────────────────────────────────────────────────────────
function iconPlus() {
  return '<svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
}

function iconPencil() {
  return '<svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>';
}

function iconTrash() {
  return '<svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
}

function iconPlay() {
  return '<svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
}

function iconPause() {
  return '<svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
}

function iconMusicNote() {
  return '<svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
}

function iconHome() {
  return '<svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
}

function iconArrowLeft() {
  return '<svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>';
}

// ── Confirm Modal ──────────────────────────────────────────────────────────
function confirmModalHtml({ title = 'Confirmar', message = '', confirmText = 'Aceptar', cancelText = 'Cancelar' } = {}) {
  return `
    <div class="modal__header modal__header--warning">
      <h3 class="modal__title">${escapeHtml(title)}</h3>
    </div>
    <div class="modal__body">
      <p>${escapeHtml(message)}</p>
    </div>
    <div class="modal__footer">
      <button class="btn btn-secondary" id="modal-cancel">${escapeHtml(cancelText)}</button>
      <button class="btn btn-danger" id="modal-confirm">${escapeHtml(confirmText)}</button>
    </div>
  `;
}

// ── Validation Error ───────────────────────────────────────────────────────
function renderValidationError(fieldId, message) {
  const el = document.getElementById(fieldId + '-error');
  if (el) {
    el.textContent = message;
    el.style.display = 'block';
  }
}

function clearValidationErrors() {
  document.querySelectorAll('.form-error').forEach(el => {
    el.textContent = '';
    el.style.display = 'none';
  });
}

// ── Filter Bar ─────────────────────────────────────────────────────────────
function renderFilterBar(sections, activeSection = null) {
  if (!sections.length) return '';
  let html = '<div class="filter-bar">';
  html += `<button class="btn btn-secondary filter-btn${activeSection === null ? ' filter-btn--active' : ''}" data-section="">Todas</button>`;
  html += sections.map(s =>
    `<button class="btn btn-secondary filter-btn${activeSection === s ? ' filter-btn--active' : ''}" data-section="${escapeHtml(s)}">${escapeHtml(s)}</button>`
  ).join('');
  html += '</div>';
  return html;
}

function renderEmptyFilterState() {
  return '<div class="empty-state"><p>No hay canciones en esta categoría</p></div>';
}

// ── Auto-Scroll Control ────────────────────────────────────────────────────
function renderAutoScrollControl({ speed = 1, playing = false } = {}) {
  return `
    <div class="auto-scroll-bar">
      <button class="btn btn-icon" id="btn-auto-scroll" aria-label="${playing ? 'Pausar' : 'Iniciar'} auto-scroll">
        ${playing ? iconPause() : iconPlay()}
      </button>
      <input type="range" class="range-input" id="scroll-speed" min="1" max="5" value="${speed}" step="1" aria-label="Velocidad de auto-scroll">
      <span class="auto-scroll__speed-label" id="scroll-speed-label">${speed}x</span>
    </div>
  `;
}

// ── Bottom Navigation ──────────────────────────────────────────────────────
function renderBottomNav(activeRoute = '') {
  const links = [
    { href: '#/canciones', icon: iconMusicNote, label: 'Canciones' },
    { href: '#/nueva', icon: iconPlus, label: 'Nueva' },
    { href: '#/afinador', icon: iconHome, label: 'Afinador' },
  ];
  return `
    <nav class="bottom-nav" role="navigation" aria-label="Navegación inferior">
      ${links.map(link => {
        const isActive = window.location.hash === link.href || (link.href === '#/canciones' && (!window.location.hash || window.location.hash === '#/' || window.location.hash === '#/canciones'));
        return `
          <a href="${link.href}" class="bottom-nav__link${isActive ? ' bottom-nav__link--active' : ''}" ${isActive ? 'aria-current="page"' : ''}>
            ${link.icon()}
            <span class="bottom-nav__label">${link.label}</span>
          </a>
        `;
      }).join('')}
    </nav>
  `;
}

export {
  renderSongCard, renderSongDetail, renderSongForm, renderTuner, renderEmptyState,
  showModal, hideModal, showToast, navigate, getFormData, escapeHtml,
  iconPlus, iconPencil, iconTrash, iconPlay, iconPause, iconMusicNote, iconHome, iconArrowLeft,
  confirmModalHtml, renderValidationError, clearValidationErrors,
  renderFilterBar, renderEmptyFilterState,
  renderAutoScrollControl, renderBottomNav
};
