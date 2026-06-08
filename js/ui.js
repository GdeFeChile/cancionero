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
      <div class="song-lyrics">${lyrics}</div>
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
      </div>
      <div class="form-group">
        <label for="key">Tono</label>
        <select id="key" name="key">
          ${['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'].map(k =>
            `<option value="${k}" ${s.key === k ? 'selected' : ''}>${k}</option>`
          ).join('')}
        </select>
      </div>
      <div class="form-group">
        <label for="author">Autor</label>
        <input type="text" id="author" name="author" value="${escapeHtml(s.author || '')}">
      </div>
      <div class="form-group">
        <label for="section">Sección</label>
        <input type="text" id="section" name="section" value="${escapeHtml(s.section || '')}">
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
        <label for="lyrics">Letra y Acordes</label>
        <textarea id="lyrics" name="lyrics" rows="15">${escapeHtml(s.lyrics || '')}</textarea>
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
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
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

export { renderSongCard, renderSongDetail, renderSongForm, renderTuner, renderEmptyState, showModal, hideModal, showToast, navigate, getFormData, escapeHtml };
