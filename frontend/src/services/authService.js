import { BASE, post, get } from './api';

export async function login(email, password) {
  const data = await post("/auth/login", { email, password });
  if (data.user) {
      // The JWT token is securely stored by the browser in an HttpOnly cookie
      localStorage.setItem('user', JSON.stringify(data.user));
  }
  return data;
}

export async function register(fullName, email, password) {
  return post("/auth/register", { full_name: fullName, email, password });
}

export const fetchMe = () => get("/auth/me");
export const fetchPermissions = () => get("/auth/permissions");

export async function logout() {
    try {
        await post("/auth/logout", {});
    } catch (e) {
        console.error("Logout error:", e);
    }
    localStorage.removeItem('user');
}
