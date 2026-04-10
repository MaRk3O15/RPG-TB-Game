// API client — communicates with the Express backend

// Empty string = same origin (Express serves both static + API)
const BASE = '';

function getToken() {
  return localStorage.getItem('rpg_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  return res.json();
}

export function getCurrentUser() {
  return localStorage.getItem('rpg_user');
}

export function isLoggedIn() {
  return !!getToken();
}

export function logout() {
  localStorage.removeItem('rpg_token');
  localStorage.removeItem('rpg_user');
}

export async function register(name, password) {
  const data = await request('/api/register', {
    method: 'POST',
    body: JSON.stringify({ name, password }),
  });
  if (data.token) {
    localStorage.setItem('rpg_token', data.token);
    localStorage.setItem('rpg_user', data.name);
    localStorage.setItem('rpg_progress', JSON.stringify(data.progress));
  }
  return data;
}

export async function login(name, password) {
  const data = await request('/api/login', {
    method: 'POST',
    body: JSON.stringify({ name, password }),
  });
  if (data.token) {
    localStorage.setItem('rpg_token', data.token);
    localStorage.setItem('rpg_user', data.name);
    localStorage.setItem('rpg_progress', JSON.stringify(data.progress));
  }
  return data;
}

export async function saveProgress(progress) {
  if (!getToken()) return;
  try {
    await request('/api/progress', {
      method: 'POST',
      body: JSON.stringify({ progress }),
    });
  } catch {
    // Offline fallback — progress already in localStorage
  }
}

export async function verifyToken() {
  if (!getToken()) return false;
  try {
    const data = await request('/api/me');
    return !data.error;
  } catch {
    return false;
  }
}
