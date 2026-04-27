export const BASE = "http://localhost:8000";
export const EVENTS_URL = `${BASE}/events`;
export const VIDEO_FEED_URL = `${BASE}/video_feed`;

export async function get(path, params = {}) {
  const url = new URL(BASE + path);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString(), {
      headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
  });
  if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
  }
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}

export async function post(path, body) {
    const res = await fetch(`${BASE}${path}`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(body),
    });
    if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
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
    const res = await fetch(`${BASE}${path}`, {
        method: "PUT",
        headers: { 
            "Content-Type": "application/json",
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(body),
    });
    if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
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
    const res = await fetch(`${BASE}${path}`, {
        method: "PATCH",
        headers: { 
            "Content-Type": "application/json",
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(body),
    });
    if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
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
    const res = await fetch(`${BASE}${path}`, {
        method: "DELETE",
        headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
    });
    if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
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
