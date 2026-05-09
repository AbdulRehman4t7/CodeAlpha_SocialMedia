// ===== API UTILITY =====
const API_BASE = '/api';

const api = {
  getToken: () => localStorage.getItem('sp_token'),
  setToken: (t) => localStorage.setItem('sp_token', t),
  removeToken: () => localStorage.removeItem('sp_token'),
  getUser: () => { try { return JSON.parse(localStorage.getItem('sp_user')); } catch { return null; } },
  setUser: (u) => localStorage.setItem('sp_user', JSON.stringify(u)),
  removeUser: () => localStorage.removeItem('sp_user'),

  request: async (method, path, body = null, isFormData = false) => {
    const headers = {};
    const token = api.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!isFormData && body) headers['Content-Type'] = 'application/json';

    const options = { method, headers };
    if (body) options.body = isFormData ? body : JSON.stringify(body);

    const res = await fetch(`${API_BASE}${path}`, options);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  },

  get: (path) => api.request('GET', path),
  post: (path, body) => api.request('POST', path, body),
  put: (path, body) => api.request('PUT', path, body),
  delete: (path) => api.request('DELETE', path),
  postForm: (path, formData) => api.request('POST', path, formData, true),
  putForm: (path, formData) => api.request('PUT', path, formData, true),
};
