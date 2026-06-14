// ── Auth Module ──
// Client-side access control + approval workflow.
// Aprobación vía usuarios.json en GitHub (admin autoriza usuarios registrados).

const SESSION_KEY = 'gdefe_session';
const USERS_KEY = 'gdefe_users';

// Admin credentials (base64 encoded to avoid plain text in source)
const ADMIN_USER = 'admin';
const ADMIN_PASS_HASH = btoa('Salvagrace123!');

// Cached approved list from GitHub
let _approved = null;
let _approvedTimestamp = 0;
const CACHE_TTL = 60_000; // 1 min

function initUsers() {
  const stored = localStorage.getItem(USERS_KEY);
  if (!stored) {
    const defaultUsers = {};
    defaultUsers[ADMIN_USER] = { password: ADMIN_PASS_HASH, role: 'admin', status: 'approved' };
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
  }
}

// ── GitHub: fetch approved list ──
export async function fetchApprovedList(force) {
  if (!force && _approved && Date.now() - _approvedTimestamp < CACHE_TTL) {
    return _approved;
  }
  try {
    const res = await fetch('https://raw.githubusercontent.com/GdeFeChile/cancionero/main/usuarios.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    _approved = data;
    _approvedTimestamp = Date.now();
    return data;
  } catch (e) {
    console.warn('fetchApprovedList falló, usando caché/local', e.message);
    return _approved || { admin: 'admin' };
  }
}

// Sync check against cached list
export function isApproved(username) {
  if (username === ADMIN_USER) return true;
  return _approved && !!_approved[username];
}

// ── Register (saves locally as pending) ──
export function register(username, password) {
  initUsers();
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');

  if (users[username]) return { ok: false, error: 'El usuario ya existe' };
  if (username.length < 3) return { ok: false, error: 'El usuario debe tener al menos 3 caracteres' };
  if (password.length < 4) return { ok: false, error: 'La contraseña debe tener al menos 4 caracteres' };
  if (username === ADMIN_USER) return { ok: false, error: 'Ese nombre de usuario no está disponible' };

  // Save as pending — no auto-login, no session
  users[username] = { password: btoa(password), role: 'user', status: 'pending' };
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  return { ok: true, status: 'pending', user: username };
}

// ── Login (checks approval against GitHub list) ──
export async function login(username, password) {
  initUsers();
  await fetchApprovedList();

  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
  const user = users[username];
  if (!user) return { ok: false, error: 'Usuario no encontrado' };
  if (btoa(password) !== user.password) return { ok: false, error: 'Contraseña incorrecta' };

  if (username !== ADMIN_USER && !_approved[username]) {
    return { ok: false, error: 'pending_approval', user: username };
  }

  // Session expires in 7 days
  const session = JSON.stringify({ user: username, role: user.role, expires: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  localStorage.setItem(SESSION_KEY, session);
  return { ok: true, user: username, role: user.role };
}

// ── Check session (sync) ──
export function checkAuth() {
  initUsers();
  const session = localStorage.getItem(SESSION_KEY);
  if (!session) return false;
  try {
    const data = JSON.parse(session);
    return data && data.user && data.expires > Date.now();
  } catch { return false; }
}

// ── Validate current session against approved list ──
// Call after fetchApprovedList(). Clears sessions for unapproved non-admin users.
export function validateSession() {
  const session = localStorage.getItem(SESSION_KEY);
  if (!session) return;
  try {
    const data = JSON.parse(session);
    if (!data || !data.user) return;
    if (data.user === ADMIN_USER) return; // admin always approved
    if (_approved && _approved[data.user]) return; // approved
    // Not approved — clear session
    localStorage.removeItem(SESSION_KEY);
  } catch { /* ignore */ }
}

// ── Logout ──
export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

// ── Get current user from session ──
export function getUser() {
  const session = localStorage.getItem(SESSION_KEY);
  if (!session) return null;
  try {
    const data = JSON.parse(session);
    if (data.expires > Date.now()) return { user: data.user, role: data.role };
  } catch { /* ignore */ }
  return null;
}

// ── Is admin? ──
export function isAdmin() {
  const u = getUser();
  return u && u.role === 'admin';
}

// ── Get pending users (from local storage) ──
export function getPendingUsers() {
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
  return Object.entries(users)
    .filter(([name, data]) => name !== ADMIN_USER && data.status === 'pending')
    .map(([name]) => name);
}

// ── Get all registered users (from local storage) ──
export function getAllLocalUsers() {
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
  return Object.entries(users)
    .filter(([name]) => name !== ADMIN_USER)
    .map(([name, data]) => ({ name, status: data.status || 'approved', role: data.role }));
}

// ── GitHub API: approve a user (commits to usuarios.json) ──
export async function approveUserRemote(username) {
  const cfg = window.__GITHUB_CONFIG;
  if (!cfg || !cfg.token) {
    return { ok: false, error: 'no_token', msg: 'No hay token de GitHub configurado. Edita usuarios.json manualmente en GitHub.' };
  }

  const url = `https://api.github.com/repos/${cfg.repo}/contents/${cfg.filePath}`;

  try {
    // 1. Get current file + SHA
    const getRes = await fetch(url, {
      headers: { Authorization: `token ${cfg.token}`, Accept: 'application/vnd.github.v3+json' }
    });
    if (!getRes.ok) throw new Error('GET falló: ' + (await getRes.text()));
    const fileData = await getRes.json();
    const sha = fileData.sha;

    // 2. Decode current content
    const current = JSON.parse(atob(fileData.content));

    // 3. Add user
    if (current[username]) {
      return { ok: false, error: 'exists', msg: `"${username}" ya está en usuarios.json` };
    }
    current[username] = 'user';
    current._ultima_actualizacion = new Date().toISOString().slice(0, 10);

    // 4. Encode and commit
    const content = btoa(JSON.stringify(current, null, 2));
    const commitRes = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `token ${cfg.token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Aprobar usuario: ${username}`,
        content,
        sha,
        branch: cfg.branch
      })
    });
    if (!commitRes.ok) throw new Error('Commit falló: ' + (await commitRes.text()));

    // 5. Update local user status
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    if (users[username]) {
      users[username].status = 'approved';
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    // 6. Invalidate cache so next fetch picks up the change
    _approved = null;
    _approvedTimestamp = 0;

    return { ok: true, msg: `"${username}" aprobado y comiteado a GitHub.` };
  } catch (e) {
    return { ok: false, error: 'api_error', msg: e.message };
  }
}

// ── GitHub API: reject/remove a user (commits to usuarios.json) ──
export async function rejectUserRemote(username) {
  const cfg = window.__GITHUB_CONFIG;
  if (!cfg || !cfg.token) {
    return { ok: false, error: 'no_token', msg: 'No hay token de GitHub configurado.' };
  }

  const url = `https://api.github.com/repos/${cfg.repo}/contents/${cfg.filePath}`;

  try {
    const getRes = await fetch(url, {
      headers: { Authorization: `token ${cfg.token}`, Accept: 'application/vnd.github.v3+json' }
    });
    if (!getRes.ok) throw new Error('GET falló');
    const fileData = await getRes.json();
    const sha = fileData.sha;

    const current = JSON.parse(atob(fileData.content));
    delete current[username];
    current._ultima_actualizacion = new Date().toISOString().slice(0, 10);

    const content = btoa(JSON.stringify(current, null, 2));
    const commitRes = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `token ${cfg.token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Rechazar usuario: ${username}`,
        content,
        sha,
        branch: cfg.branch
      })
    });
    if (!commitRes.ok) throw new Error('Commit falló');

    _approved = null;
    _approvedTimestamp = 0;

    return { ok: true, msg: `"${username}" rechazado/eliminado.` };
  } catch (e) {
    return { ok: false, error: 'api_error', msg: e.message };
  }
}
