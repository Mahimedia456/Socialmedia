import { apiFetch } from "./api.js";

// Named exports to match your pages imports
export function loginApi({ email, password }) {
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function logoutApi({ refresh_token }) {
  return apiFetch("/api/auth/logout", {
    method: "POST",
    body: { refresh_token },
  });
}

export function refreshTokenApi({ refresh_token }) {
  return apiFetch("/api/auth/refresh-token", {
    method: "POST",
    body: { refresh_token },
  });
}

export function forgotPasswordApi({ email }) {
  return apiFetch("/api/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

// IMPORTANT: backend expects { email, code } (no purpose)
export function verifyEmailCodeApi({ email, code }) {
  return apiFetch("/api/auth/verify-email", {
    method: "POST",
    body: { email, code },
  });
}

export function resetPasswordApi({ reset_token, new_password }) {
  return apiFetch("/api/auth/reset-password", {
    method: "POST",
    body: { reset_token, new_password },
  });
}