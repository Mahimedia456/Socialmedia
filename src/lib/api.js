// src/lib/api.js

const API_BASE = import.meta.env.VITE_API_BASE?.trim() || "http://localhost:4000";

/* =========================
   Session helpers
   ========================= */

const STORAGE_KEYS = {
  access: "access_token",
  refresh: "refresh_token",
  user: "user",
};

export function setSession({ access_token, refresh_token, user }) {
  if (access_token) localStorage.setItem(STORAGE_KEYS.access, access_token);
  if (refresh_token) localStorage.setItem(STORAGE_KEYS.refresh, refresh_token);
  if (user) localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
}

export function getSession() {
  const access_token = localStorage.getItem(STORAGE_KEYS.access) || "";
  const refresh_token = localStorage.getItem(STORAGE_KEYS.refresh) || "";
  const userRaw = localStorage.getItem(STORAGE_KEYS.user) || "";
  let user = null;
  try {
    user = userRaw ? JSON.parse(userRaw) : null;
  } catch {
    user = null;
  }
  return { access_token, refresh_token, user };
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.access);
  localStorage.removeItem(STORAGE_KEYS.refresh);
  localStorage.removeItem(STORAGE_KEYS.user);
}

/* =========================
   Core fetch
   ========================= */

export async function apiFetch(path, { method = "GET", body, headers, token } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const err = new Error(data?.message || data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.payload = data; // ✅ UI uses err.payload?.message
    throw err;
  }

  return data;
}

/* =========================
   Auth APIs
   ========================= */

export async function apiLogin({ email, password }) {
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export async function apiRefreshToken({ refresh_token }) {
  return apiFetch("/api/auth/refresh-token", {
    method: "POST",
    body: { refresh_token },
  });
}

export async function apiLogout({ refresh_token }) {
  return apiFetch("/api/auth/logout", {
    method: "POST",
    body: { refresh_token },
  });
}