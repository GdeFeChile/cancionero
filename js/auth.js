// ── Auth Module ──
// Client-side access control. No real security (JS is visible),
// but keeps casual users out.

const SESSION_KEY = 'gdefe_session';
const USERS_KEY = 'gdefe_users';

// Admin credentials (base64 encoded to avoid plain text in source)
const ADMIN_USER = 'admin';
const ADMIN_PASS_HASH = btoa('Salvagrace123!');

function initUsers() {
  const stored = localStorage.getItem(USERS_KEY);
  if (!stored) {
    const defaultUsers = {};
    defaultUsers[ADMIN_USER] = { password: ADMIN_PASS_HASH, role: 'admin' };
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
  }
}

export function checkAuth() {
  initUsers();
  const session = localStorage.getItem(SESSION_KEY);
  if (!session) return false;
  try {
    const data = JSON.parse(session);
    return data && data.user && data.expires > Date.now();
  } catch { return false; }
}

export function login(username, password) {
  initUsers();
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
  const user = users[username];
  if (!user) return { ok: false, error: 'Usuario no encontrado' };
  if (btoa(password) !== user.password) return { ok: false, error: 'Contraseña incorrecta' };

  // Session expires in 7 days
  const session = JSON.stringify({ user: username, role: user.role, expires: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  localStorage.setItem(SESSION_KEY, session);
  return { ok: true, user: username, role: user.role };
}

export function register(username, password) {
  initUsers();
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');

  if (users[username]) return { ok: false, error: 'El usuario ya existe' };
  if (username.length < 3) return { ok: false, error: 'El usuario debe tener al menos 3 caracteres' };
  if (password.length < 4) return { ok: false, error: 'La contraseña debe tener al menos 4 caracteres' };
  if (username === ADMIN_USER) return { ok: false, error: 'Ese nombre de usuario no está disponible' };

  users[username] = { password: btoa(password), role: 'user' };
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  // Auto-login after register
  const session = JSON.stringify({ user: username, role: 'user', expires: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  localStorage.setItem(SESSION_KEY, session);
  return { ok: true, user: username, role: 'user' };
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function getUser() {
  const session = localStorage.getItem(SESSION_KEY);
  if (!session) return null;
  try {
    const data = JSON.parse(session);
    if (data.expires > Date.now()) return { user: data.user, role: data.role };
  } catch { /* ignore */ }
  return null;
}

export function isAdmin() {
  const u = getUser();
  return u && u.role === 'admin';
}
