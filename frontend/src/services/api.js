export const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
export const EVENTS_URL = `${BASE}/events`;
export const VIDEO_FEED_URL = `${BASE}/video_feed`;

const PUBLIC_PATHS = ['/settings/public', '/auth/login', '/auth/register'];

/**
 * Handle 401 responses by clearing credentials and redirecting to login.
 * Debounced to prevent multiple simultaneous redirects.
 */
let _redirecting = false;
function handleUnauthorized(path) {
    if (_redirecting) return;
    if (path === '/auth/login' || path === '/auth/login/') return;
    console.error(`API: Session expired on ${path}. Redirecting to login.`);
    _redirecting = true;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
}

export async function get(path, params = {}) {
    const url = new URL(BASE + path);
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) url.searchParams.set(k, v);
    });

    const isPublic = PUBLIC_PATHS.some(p => path === p || path === p + '/');

    const res = await fetch(url.toString(), {
        cache: 'no-store',
        credentials: 'include'
    });
    if (res.status === 401 && !isPublic) {
        handleUnauthorized(path);
    }
    if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
    return res.json();
}

export async function post(path, body) {
    const isPublic = PUBLIC_PATHS.some(p => path === p || path === p + '/');

    const res = await fetch(`${BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: 'include'
    });
    if (res.status === 401 && !isPublic) {
        handleUnauthorized(path);
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
    const isPublic = PUBLIC_PATHS.some(p => path === p || path === p + '/');

    const res = await fetch(`${BASE}${path}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: 'include'
    });
    if (res.status === 401 && !isPublic) {
        handleUnauthorized(path);
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
    const isPublic = PUBLIC_PATHS.some(p => path === p || path === p + '/');

    const res = await fetch(`${BASE}${path}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: 'include'
    });
    if (res.status === 401 && !isPublic) {
        handleUnauthorized(path);
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
    const isPublic = PUBLIC_PATHS.some(p => path === p || path === p + '/');

    const res = await fetch(`${BASE}${path}`, {
        method: "DELETE",
        credentials: 'include'
    });
    if (res.status === 401 && !isPublic) {
        handleUnauthorized(path);
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
