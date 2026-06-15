// ── Auth Module (Supabase) ──
// Login, registro y aprobación de usuarios via Supabase Auth + user_profiles.

import { auth, db, ADMIN_EMAIL, usernameToEmail, emailToUsername } from './supabase-client.js';

// Cached current user (sync access, no await needed for getters)
let _currentUser = null;

// ── Refresh cached user from Supabase session ──
export async function refreshUser() {
  const supabaseUser = await auth.getUser();
  if (supabaseUser && supabaseUser.email) {
    const email = supabaseUser.email;
    const role = email === ADMIN_EMAIL ? 'admin' : 'user';
    _currentUser = {
      user: emailToUsername(email),
      email,
      role
    };
  } else {
    _currentUser = null;
  }
  return _currentUser;
}

// ── Register ──
// Crea usuario en Supabase Auth + perfil pendiente, luego cierra sesión.
export async function register(username, password) {
  if (username.length < 3) return { ok: false, error: 'El usuario debe tener al menos 3 caracteres' };
  if (password.length < 4) return { ok: false, error: 'La contraseña debe tener al menos 4 caracteres' };
  if (username.toLowerCase() === 'admin') return { ok: false, error: 'Ese nombre de usuario no está disponible' };

  const email = usernameToEmail(username);

  // 1. Create user in Auth
  try {
    await auth.signUp({ email, password });
  } catch (e) {
    if (e.message.includes('already') || e.message.includes('exists') || e.message.includes('registered')) {
      return { ok: false, error: 'El usuario ya existe' };
    }
    return { ok: false, error: e.message };
  }

  // 2. Sign out (user needs admin approval)
  await auth.signOut();
  _currentUser = null;

  // 3. Insert profile as pending (using anon key, no auth needed)
  const { error: profileErr } = await db.insert('user_profiles', {
    email,
    username,
    role: 'user',
    status: 'pending'
  }, { useAuth: false });

  if (profileErr) {
    console.warn('Error al crear perfil:', profileErr);
    // Non-critical: auth user exists, profile can be fixed by admin
  }

  return { ok: true, status: 'pending', user: username };
}

// ── Login ──
export async function login(username, password) {
  const email = usernameToEmail(username);

  let authData;
  try {
    authData = await auth.signInWithPassword({ email, password });
  } catch (e) {
    return { ok: false, error: 'Usuario o contraseña incorrectos' };
  }

  // Admin bypasses approval check
  if (email === ADMIN_EMAIL) {
    _currentUser = { user: 'admin', email, role: 'admin' };
    return { ok: true, user: 'admin', role: 'admin' };
  }

  // Check approval status
  try {
    const { data: profile } = await db.select('user_profiles', {
      eq: { email },
      single: true
    });

    if (!profile || profile.status !== 'approved') {
      await auth.signOut();
      _currentUser = null;
      return { ok: false, error: 'pending_approval', user: username };
    }

    _currentUser = { user: username, email, role: profile.role };
    return { ok: true, user: username, role: profile.role };
  } catch (e) {
    console.warn('Error al verificar perfil:', e);
    await auth.signOut();
    _currentUser = null;
    return { ok: false, error: 'Error al verificar usuario' };
  }
}

// ── Check if session exists (async) ──
export async function checkAuth() {
  const user = await auth.getUser();
  return !!user;
}

// ── Logout ──
export async function logout() {
  await auth.signOut();
  _currentUser = null;
}

// ── Get current user (sync — uses cached value) ──
export function getUser() {
  return _currentUser;
}

// ── Is admin? (sync) ──
export function isAdmin() {
  return _currentUser?.role === 'admin';
}

// ── Get pending users ──
export async function getPendingUsers() {
  try {
    const { data } = await db.select('user_profiles', {
      eq: { status: 'pending' },
      neq: { email: ADMIN_EMAIL }
    });
    return (data || []).map(p => ({
      email: p.email,
      username: p.username || emailToUsername(p.email)
    }));
  } catch (e) {
    console.warn('Error al obtener pendientes:', e);
    return [];
  }
}

// ── Get all registered users ──
export async function getAllUsers() {
  try {
    const { data } = await db.select('user_profiles', {
      neq: { email: ADMIN_EMAIL }
    });
    return (data || []).map(p => ({
      name: p.username || emailToUsername(p.email),
      email: p.email,
      status: p.status || 'approved',
      role: p.role
    }));
  } catch (e) {
    console.warn('Error al obtener usuarios:', e);
    return [];
  }
}

// ── Approve user ──
export async function approveUser(email) {
  const { error } = await db.update(
    'user_profiles',
    { status: 'approved' },
    { eq: { email } }
  );
  if (error) return { ok: false, msg: 'Error al aprobar' };
  return { ok: true, msg: '✅ Usuario aprobado' };
}

// ── Reject/remove user ──
export async function rejectUser(email) {
  const { error } = await db.update(
    'user_profiles',
    { status: 'rejected' },
    { eq: { email } }
  );
  if (error) return { ok: false, msg: 'Error al rechazar' };
  return { ok: true, msg: '✕ Usuario rechazado' };
}
