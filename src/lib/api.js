// src/lib/api.js

const RAW_API_BASE =
  import.meta.env.VITE_API_BASE?.trim() ||
  import.meta.env.VITE_API_URL?.trim() ||
  "http://localhost:4000";

export const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

/* =========================
   Session helpers
   ========================= */

const STORAGE_KEYS = {
  access: "access_token",
  refresh: "refresh_token",
  user: "user",
  permissions: "permissions",
  activeWorkspace: "active_workspace_id",
};

export function setSession({ access_token, refresh_token, user, permissions } = {}) {
  if (access_token !== undefined && access_token !== null) {
    if (access_token) localStorage.setItem(STORAGE_KEYS.access, access_token);
    else localStorage.removeItem(STORAGE_KEYS.access);
  }

  if (refresh_token !== undefined && refresh_token !== null) {
    if (refresh_token) localStorage.setItem(STORAGE_KEYS.refresh, refresh_token);
    else localStorage.removeItem(STORAGE_KEYS.refresh);
  }

  if (user !== undefined && user !== null) {
    if (user) localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEYS.user);
  }

  if (permissions !== undefined && permissions !== null) {
    if (permissions) {
      localStorage.setItem(STORAGE_KEYS.permissions, JSON.stringify(permissions));
    } else {
      localStorage.removeItem(STORAGE_KEYS.permissions);
    }
  }
}

export function getSession() {
  const access_token = localStorage.getItem(STORAGE_KEYS.access) || "";
  const refresh_token = localStorage.getItem(STORAGE_KEYS.refresh) || "";

  const userRaw = localStorage.getItem(STORAGE_KEYS.user) || "";
  const permRaw = localStorage.getItem(STORAGE_KEYS.permissions) || "";

  let user = null;
  let permissions = null;

  try {
    user = userRaw ? JSON.parse(userRaw) : null;
  } catch {
    user = null;
  }

  try {
    permissions = permRaw ? JSON.parse(permRaw) : null;
  } catch {
    permissions = null;
  }

  return { access_token, refresh_token, user, permissions };
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.access);
  localStorage.removeItem(STORAGE_KEYS.refresh);
  localStorage.removeItem(STORAGE_KEYS.user);
  localStorage.removeItem(STORAGE_KEYS.permissions);
}

export function setActiveWorkspaceId(id) {
  const wsId = String(id || "").trim();
  if (wsId) localStorage.setItem(STORAGE_KEYS.activeWorkspace, wsId);
  else localStorage.removeItem(STORAGE_KEYS.activeWorkspace);
}

export function getActiveWorkspaceId() {
  return localStorage.getItem(STORAGE_KEYS.activeWorkspace) || "";
}

/* =========================
   Low-level request helper
   - Handles JSON + non-JSON responses
   - Never double-stringifies body
   ========================= */

async function rawFetch(path, { method = "GET", body, headers = {}, token } = {}) {
  const cleanPath = String(path || "").startsWith("/") ? path : `/${String(path || "")}`;
  const url = `${API_BASE}${cleanPath}`;

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const hasBody = body !== undefined && body !== null;

  const res = await fetch(url, {
    method,
    headers: {
      ...(hasBody && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: hasBody ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");

  let data = null;
  if (isJson) {
    data = await res.json().catch(() => null);
  } else {
    const text = await res.text().catch(() => "");
    data = text ? { text } : null;
  }

  if (!res.ok) {
    const err = new Error(
      (data && (data.message || data.error)) || `Request failed (${res.status})`
    );
    err.status = res.status;
    err.payload = data;
    err.url = url;
    throw err;
  }

  return data;
}

/* =========================
   Core fetch (auto token + auto refresh)
   ========================= */

export async function apiFetch(path, opts = {}) {
  const { access_token, refresh_token } = getSession();

  try {
    return await rawFetch(path, { ...opts, token: opts.token ?? access_token });
  } catch (err) {
    const isAuthError = err?.status === 401;
    const canRefresh = !!refresh_token && path !== "/api/auth/refresh-token";

    if (!isAuthError || !canRefresh) throw err;

    const refreshed = await rawFetch("/api/auth/refresh-token", {
      method: "POST",
      body: { refresh_token },
      token: null,
    });

    const newAccess = refreshed?.access_token || "";
    if (!newAccess) {
      clearSession();
      throw err;
    }

    setSession({ access_token: newAccess });

    return await rawFetch(path, { ...opts, token: newAccess });
  }
}

/* =========================
   Auth APIs
   ========================= */

export async function apiLogin({ email, password }) {
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: { email, password },
    token: null,
  });
}

export async function apiRefreshToken({ refresh_token }) {
  return apiFetch("/api/auth/refresh-token", {
    method: "POST",
    body: { refresh_token },
    token: null,
  });
}

export async function apiLogout({ refresh_token }) {
  return apiFetch("/api/auth/logout", {
    method: "POST",
    body: { refresh_token },
  });
}

/* =========================
   Workspaces
   ========================= */

export async function apiListWorkspaces() {
  return apiFetch("/api/workspaces");
}

/* =========================
   Channels / Connections
   ========================= */

export async function apiListWorkspaceChannels(workspaceId, { provider = "" } = {}) {
  const wsId = String(workspaceId || "").trim();
  const qs = new URLSearchParams();
  if (provider) qs.set("provider", provider);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch(`/api/workspaces/${wsId}/channels${suffix}`);
}

export async function apiDisconnectWorkspaceChannel(workspaceId, channelId) {
  const wsId = String(workspaceId || "").trim();
  const chId = String(channelId || "").trim();
  return apiFetch(`/api/workspaces/${wsId}/channels/${chId}/disconnect`, {
    method: "POST",
    body: {},
  });
}

/* =========================
   Meta connect
   ========================= */

export async function apiMetaExchange({ code, workspaceId }) {
  return apiFetch("/api/meta/exchange", {
    method: "POST",
    body: { code, workspaceId },
  });
}

export async function apiMetaConnectPages(payload) {
  return apiFetch("/api/meta/connect-pages", {
    method: "POST",
    body: payload,
  });
}

/* =========================
   Publisher
   ========================= */

export async function apiPublisherChannels(workspaceId, provider = "meta") {
  const wsId = String(workspaceId || "").trim();
  const qs = new URLSearchParams({ provider });
  return apiFetch(`/api/workspaces/${wsId}/publisher/channels?${qs.toString()}`);
}

export async function apiCreatePublisherPost(workspaceId, body) {
  const wsId = String(workspaceId || "").trim();
  return apiFetch(`/api/workspaces/${wsId}/publisher/posts`, {
    method: "POST",
    body,
  });
}

export async function apiPublisherDrafts(workspaceId) {
  const wsId = String(workspaceId || "").trim();
  return apiFetch(`/api/workspaces/${wsId}/publisher/posts/drafts`);
}

export async function apiPublisherScheduled(workspaceId) {
  const wsId = String(workspaceId || "").trim();
  return apiFetch(`/api/workspaces/${wsId}/publisher/posts/scheduled`);
}

export async function apiPublishNow(workspaceId, postId) {
  const wsId = String(workspaceId || "").trim();
  const pId = String(postId || "").trim();
  return apiFetch(`/api/workspaces/${wsId}/publisher/posts/${pId}/publish`, {
    method: "POST",
    body: {},
  });
}

/* =========================
   Analytics
   ========================= */

export async function apiMetaAnalytics(workspaceId, { days = 30 } = {}) {
  const wsId = String(workspaceId || "").trim();
  const qs = new URLSearchParams({ days: String(days) });
  return apiFetch(`/api/workspaces/${wsId}/analytics/meta?${qs.toString()}`);
}

/* =========================
   Feeds
   ========================= */

export async function apiFacebookFeed(
  workspaceId,
  { page_channel_id, limit = 25, after = "" } = {}
) {
  const wsId = String(workspaceId || "").trim();
  const qs = new URLSearchParams();
  qs.set("page_channel_id", String(page_channel_id || ""));
  qs.set("limit", String(limit));
  if (after) qs.set("after", String(after));
  return apiFetch(`/api/workspaces/${wsId}/feeds/facebook?${qs.toString()}`);
}

export async function apiFacebookComments(
  workspaceId,
  { page_channel_id, post_id, limit = 50, after = "" } = {}
) {
  const wsId = String(workspaceId || "").trim();
  const qs = new URLSearchParams();
  qs.set("page_channel_id", String(page_channel_id || ""));
  qs.set("post_id", String(post_id || ""));
  qs.set("limit", String(limit));
  if (after) qs.set("after", String(after));
  return apiFetch(`/api/workspaces/${wsId}/feeds/facebook/comments?${qs.toString()}`);
}

export async function apiFacebookLike(workspaceId, { page_channel_id, post_id }) {
  const wsId = String(workspaceId || "").trim();
  return apiFetch(`/api/workspaces/${wsId}/feeds/facebook/like`, {
    method: "POST",
    body: { page_channel_id, post_id },
  });
}

export async function apiFacebookComment(workspaceId, { page_channel_id, post_id, message }) {
  const wsId = String(workspaceId || "").trim();
  return apiFetch(`/api/workspaces/${wsId}/feeds/facebook/comment`, {
    method: "POST",
    body: { page_channel_id, post_id, message },
  });
}

export async function apiFacebookReplyComment(
  workspaceId,
  { page_channel_id, comment_id, message }
) {
  const wsId = String(workspaceId || "").trim();
  return apiFetch(`/api/workspaces/${wsId}/feeds/facebook/comments/reply`, {
    method: "POST",
    body: { page_channel_id, comment_id, message },
  });
}

export async function apiInstagramFeed(
  workspaceId,
  { ig_channel_id, limit = 25, after = "" } = {}
) {
  const wsId = String(workspaceId || "").trim();
  const qs = new URLSearchParams();
  qs.set("ig_channel_id", String(ig_channel_id || ""));
  qs.set("limit", String(limit));
  if (after) qs.set("after", String(after));
  return apiFetch(`/api/workspaces/${wsId}/feeds/instagram?${qs.toString()}`);
}

/* =========================
   Inbox SSE + threads/messages
   ========================= */

// EventSource can't send Authorization header.
// Use: /api/workspaces/:workspaceId/inbox/stream?access_token=...
export function inboxStreamUrl(workspaceId) {
  const wsId = String(workspaceId || "").trim();
  const { access_token } = getSession();
  const qs = new URLSearchParams({ access_token });
  return `${API_BASE}/api/workspaces/${wsId}/inbox/stream?${qs.toString()}`;
}

export async function apiInboxThreads(workspaceId, params = {}) {
  const wsId = String(workspaceId || "").trim();
  const qs = new URLSearchParams();

  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "" || v === "all") return;
    qs.set(k, String(v));
  });

  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch(`/api/workspaces/${wsId}/inbox/threads${suffix}`);
}

// Preferred workspace-scoped route
export async function apiInboxMessages(workspaceId, threadId, { limit = 100 } = {}) {
  const wsId = String(workspaceId || "").trim();
  const tId = String(threadId || "").trim();
  const qs = new URLSearchParams({ limit: String(limit) });

  try {
    return await apiFetch(
      `/api/workspaces/${wsId}/inbox/threads/${encodeURIComponent(tId)}/messages?${qs.toString()}`
    );
  } catch (err) {
    // fallback to legacy route
    return apiFetch(`/api/inbox/threads/${encodeURIComponent(tId)}/messages?${qs.toString()}`);
  }
}

export async function apiSendInboxMessage(threadId, text) {
  const tId = String(threadId || "").trim();
  return apiFetch(`/api/inbox/threads/${encodeURIComponent(tId)}/messages`, {
    method: "POST",
    body: { text },
  });
}

export async function apiSyncMetaInbox(workspaceId) {
  const wsId = String(workspaceId || "").trim();
  return apiFetch(`/api/workspaces/${wsId}/inbox/sync/meta`, {
    method: "POST",
    body: {},
  });
}