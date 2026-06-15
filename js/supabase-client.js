// ── Supabase Client ──
// Thin wrapper around Supabase REST + Auth APIs using native fetch.
// Zero external dependencies.

const SUPABASE_URL = 'https://qjswcvgbvnarincgafmo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqc3djdmdidm5hcmluY2dhZm1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NjU2MjMsImV4cCI6MjA5NzA0MTYyM30.mkY7mMai1ngvlD8xf2GSKGztWaUNSf6XDk4OzMApTPI';

export const ADMIN_EMAIL = 'admin@cancionero.app';

export function usernameToEmail(username) {
  return `${username.toLowerCase()}@cancionero.app`;
}

export function emailToUsername(email) {
  return email.replace(/@cancionero\.app$/, '');
}

// ── Auth Token helpers ──
function getStoredToken() {
  return localStorage.getItem('sb_access_token');
}

function storeTokens(accessToken, refreshToken) {
  if (accessToken) localStorage.setItem('sb_access_token', accessToken);
  if (refreshToken) localStorage.setItem('sb_refresh_token', refreshToken);
}

function clearTokens() {
  localStorage.removeItem('sb_access_token');
  localStorage.removeItem('sb_refresh_token');
}

// ── Auth API (GoTrue) ──
export const auth = {
  async signUp({ email, password }) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || data.error_description || data.error || 'Error al registrar');
    // Store tokens if returned (happens when email confirm is disabled)
    if (data.access_token) {
      storeTokens(data.access_token, data.refresh_token);
    }
    return data;
  },

  async signInWithPassword({ email, password }) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || data.error || 'Error al iniciar sesión');
    storeTokens(data.access_token, data.refresh_token);
    return data;
  },

  async signOut() {
    const token = getStoredToken();
    if (token) {
      // Fire-and-forget: best effort logout
      fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }).catch(() => {});
    }
    clearTokens();
  },

  async getUser() {
    const token = getStoredToken();
    if (!token) return null;
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        // Token expired or invalid — try refresh
        const newToken = await refreshAccessToken();
        if (!newToken) return null;
        const retry = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${newToken}`
          }
        });
        if (!retry.ok) { clearTokens(); return null; }
        return retry.json();
      }
      return res.json();
    } catch {
      return null;
    }
  }
};

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('sb_refresh_token');
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    if (!res.ok) { clearTokens(); return null; }
    const data = await res.json();
    storeTokens(data.access_token, data.refresh_token);
    return data.access_token;
  } catch {
    clearTokens();
    return null;
  }
}

// ── Database API (PostgREST) ──
function buildHeaders(useAuth) {
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    'Content-Type': 'application/json'
  };
  if (useAuth !== false) {
    const token = getStoredToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function buildUrl(table, options = {}) {
  let url = `${SUPABASE_URL}/rest/v1/${table}`;
  const params = new URLSearchParams();

  if (options.select) params.set('select', options.select);
  if (options.order) params.set('order', options.order);

  // Filters: eq, neq, lt, gt, like, ilike
  for (const filterType of ['eq', 'neq', 'lt', 'gt', 'gte', 'lte', 'like', 'ilike']) {
    if (options[filterType]) {
      for (const [col, val] of Object.entries(options[filterType])) {
        params.set(`${col}`, `${filterType}.${val}`);
      }
    }
  }

  if (options.limit !== undefined) params.set('limit', String(options.limit));

  const qs = params.toString();
  if (qs) url += '?' + qs;
  return url;
}

export const db = {
  async select(table, options = {}) {
    const url = buildUrl(table, options);
    const res = await fetch(url, { headers: buildHeaders(options.useAuth) });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `Error ${res.status} al consultar`);
    }
    const data = await res.json();

    if (options.single) {
      return { data: data[0] || null, error: null };
    }
    return { data, error: null };
  },

  async insert(table, records, options = {}) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: { ...buildHeaders(options.useAuth), Prefer: 'return=representation' },
      body: JSON.stringify(Array.isArray(records) ? records : [records])
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      return { data: null, error: errBody };
    }
    const data = await res.json();
    return { data, error: null };
  },

  async update(table, updates, filters, options = {}) {
    let url = `${SUPABASE_URL}/rest/v1/${table}`;
    const params = new URLSearchParams();
    if (filters?.eq) {
      for (const [col, val] of Object.entries(filters.eq)) {
        params.set(`${col}`, `eq.${val}`);
      }
    }
    const qs = params.toString();
    if (qs) url += '?' + qs;

    const res = await fetch(url, {
      method: 'PATCH',
      headers: { ...buildHeaders(options.useAuth), Prefer: 'return=representation' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      return { data: null, error: errBody };
    }
    const data = await res.json();
    return { data, error: null };
  },

  async remove(table, filters, options = {}) {
    let url = `${SUPABASE_URL}/rest/v1/${table}`;
    const params = new URLSearchParams();
    if (filters?.eq) {
      for (const [col, val] of Object.entries(filters.eq)) {
        params.set(`${col}`, `eq.${val}`);
      }
    }
    const qs = params.toString();
    if (qs) url += '?' + qs;

    const res = await fetch(url, {
      method: 'DELETE',
      headers: buildHeaders(options.useAuth)
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      return { data: null, error: errBody };
    }
    return { data: null, error: null };
  }
};
