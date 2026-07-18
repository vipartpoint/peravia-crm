const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export const api = {
  async get(endpoint: string, options: RequestInit = {}) {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      credentials: 'include',
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    if (res.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async post(endpoint: string, body: any, options: RequestInit = {}) {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify(body),
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    if (res.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async put(endpoint: string, body: any, options: RequestInit = {}) {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      credentials: 'include',
      body: JSON.stringify(body),
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    if (res.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async patch(endpoint: string, body: any, options: RequestInit = {}) {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      credentials: 'include',
      body: JSON.stringify(body),
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    if (res.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async delete(endpoint: string, body?: any, options: RequestInit = {}) {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    if (res.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};
