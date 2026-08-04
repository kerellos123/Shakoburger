const API = {
  base: '/api',

  token() {
    return localStorage.getItem('token');
  },

  async request(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.token();
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(this.base + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!location.pathname.endsWith('index.html') && location.pathname !== '/') {
        location.href = 'index.html';
      }
      throw new Error('Unauthorized');
    }
    let data = null;
    try { data = await res.json(); } catch (e) { data = null; }
    if (!res.ok) {
      throw new Error((data && data.error) || `Request failed (${res.status})`);
    }
    return data;
  },

  get(path) { return this.request('GET', path); },
  post(path, body) { return this.request('POST', path, body); },
  put(path, body) { return this.request('PUT', path, body); },
  del(path) { return this.request('DELETE', path); },

  currentUser() {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch (e) { return null; }
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    location.href = 'index.html';
  },
};
