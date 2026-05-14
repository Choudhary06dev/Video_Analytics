export const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
export const EVENTS_URL = `${BASE}/events`;
export const VIDEO_FEED_URL = `${BASE}/video_feed`;

export async function get(path, params = {}) {
  const url = new URL(BASE + path);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  });
  const token = localStorage.getItem('token');
  const headers = {};
  
  // Public routes that don't need a token
  const publicPaths = ['/settings', '/auth/login'];
  const isPublic = publicPaths.some(p => path === p || path === p + '/');

  if (!isPublic && (!token || token === 'null' || token === 'undefined')) {
    console.warn(`API: Protected route ${path} called without token. Aborting.`);
    throw new Error(`Unauthorized: No token for ${path}`);
  }

  if (token && token !== 'null' && token !== 'undefined') {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url.toString(), {
      cache: 'no-store',
      headers: headers
  });
  if (res.status === 401 && path !== '/auth/login') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
          window.location.href = '/login';
      }
  }
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}

export async function post(path, body) {
    const token = localStorage.getItem('token');
    const headers = { "Content-Type": "application/json" };

    // Public routes that don't need a token
    const publicPaths = ['/settings', '/auth/login'];
    const isPublic = publicPaths.some(p => path === p || path === p + '/');

    if (!isPublic && (!token || token === 'null' || token === 'undefined')) {
        console.warn(`API: Protected POST ${path} called without token. Aborting.`);
        throw new Error(`Unauthorized: No token for ${path}`);
    }

    if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE}${path}`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body),
    });
    if (res.status === 401 && path !== '/auth/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
    }
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        let msg = "POST failed";
        if (typeof err.detail === 'string') msg = err.detail;
        else if (Array.isArray(err.detail)) msg = err.detail.map(e => e.msg || JSON.stringify(e)).join(", ");
        else if (err.detail) msg = JSON.stringify(err.detail);
        throw new Error(msg);
    }
    return res.json();
}

export async function put(path, body) {
    const token = localStorage.getItem('token');
    const headers = { "Content-Type": "application/json" };

    // Public routes that don't need a token
    const publicPaths = ['/settings', '/auth/login'];
    const isPublic = publicPaths.some(p => path === p || path === p + '/');

    if (!isPublic && (!token || token === 'null' || token === 'undefined')) {
        console.warn(`API: Protected PUT ${path} called without token. Aborting.`);
        throw new Error(`Unauthorized: No token for ${path}`);
    }

    if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE}${path}`, {
        method: "PUT",
        headers: headers,
        body: JSON.stringify(body),
    });
    if (res.status === 401 && path !== '/auth/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
    }
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        let msg = "PUT failed";
        if (typeof err.detail === 'string') msg = err.detail;
        else if (Array.isArray(err.detail)) msg = err.detail.map(e => e.msg || JSON.stringify(e)).join(", ");
        else if (err.detail) msg = JSON.stringify(err.detail);
        throw new Error(msg);
    }
    return res.json();
}

export async function patch(path, body) {
    const token = localStorage.getItem('token');
    const headers = { "Content-Type": "application/json" };

    // Public routes that don't need a token
    const publicPaths = ['/settings', '/auth/login'];
    const isPublic = publicPaths.some(p => path === p || path === p + '/');

    if (!isPublic && (!token || token === 'null' || token === 'undefined')) {
        console.warn(`API: Protected PATCH ${path} called without token. Aborting.`);
        throw new Error(`Unauthorized: No token for ${path}`);
    }

    if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE}${path}`, {
        method: "PATCH",
        headers: headers,
        body: JSON.stringify(body),
    });
    if (res.status === 401 && path !== '/auth/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
    }
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        let msg = "PATCH failed";
        if (typeof err.detail === 'string') msg = err.detail;
        else if (Array.isArray(err.detail)) msg = err.detail.map(e => e.msg || JSON.stringify(e)).join(", ");
        else if (err.detail) msg = JSON.stringify(err.detail);
        throw new Error(msg);
    }
    return res.json();
}

export async function del(path) {
    const token = localStorage.getItem('token');
    const headers = {};

    // Public routes that don't need a token
    const publicPaths = ['/settings', '/auth/login'];
    const isPublic = publicPaths.some(p => path === p || path === p + '/');

    if (!isPublic && (!token || token === 'null' || token === 'undefined')) {
        console.warn(`API: Protected DELETE ${path} called without token. Aborting.`);
        throw new Error(`Unauthorized: No token for ${path}`);
    }

    if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE}${path}`, {
        method: "DELETE",
        headers: headers,
    });
    if (res.status === 401 && path !== '/auth/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
    }
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        let msg = "DELETE failed";
        if (typeof err.detail === 'string') msg = err.detail;
        else if (Array.isArray(err.detail)) msg = err.detail.map(e => e.msg || JSON.stringify(e)).join(", ");
        else if (err.detail) msg = JSON.stringify(err.detail);
        throw new Error(msg);
    }
    return res.json();
}
