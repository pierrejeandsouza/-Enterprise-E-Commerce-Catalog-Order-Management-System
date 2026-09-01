// Thin fetch() wrapper around the P01 REST API. Every call returns the
// parsed JSON body ({ success, message, data } or { success:false,
// message, errorCode }) and throws an Error with that message on failure,
// so callers can just `try { await api.post(...) } catch (e) { toast(e.message) }`.

const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('p01_token');
}

function setToken(token) {
  if (token) localStorage.setItem('p01_token', token);
  else localStorage.removeItem('p01_token');
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('p01_user') || 'null');
  } catch {
    return null;
  }
}

function setUser(user) {
  if (user) localStorage.setItem('p01_user', JSON.stringify(user));
  else localStorage.removeItem('p01_user');
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(API_BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let json;
  try {
    json = await res.json();
  } catch {
    json = { success: false, message: 'Unexpected server response' };
  }

  if (!res.ok || json.success === false) {
    const err = new Error(json.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.errorCode = json.errorCode;
    throw err;
  }

  return json.data;
}

const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  del: (path) => request('DELETE', path),
};
