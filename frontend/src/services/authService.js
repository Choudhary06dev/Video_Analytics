import { BASE, post, get } from './api';

export async function login(email, password) {
  const data = await post("/auth/login/", { email, password });
  if (data.access_token) {
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
  }
  return data;
}

export async function register(fullName, email, password) {
  return post("/auth/register/", { full_name: fullName, email, password });
}

export const fetchMe = () => get("/auth/me/");
export const fetchPermissions = () => get("/auth/permissions/");

export function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}
