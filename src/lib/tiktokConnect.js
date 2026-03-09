// src/lib/tiktokConnect.js

function b64urlEncode(str) {
  const b64 = btoa(unescape(encodeURIComponent(str)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64urlDecode(str) {
  try {
    const raw = String(str || "");
    const pad = raw.length % 4 ? "=".repeat(4 - (raw.length % 4)) : "";
    const b64 = (raw + pad).replace(/-/g, "+").replace(/_/g, "/");
    return decodeURIComponent(escape(atob(b64)));
  } catch {
    return "";
  }
}

function randomString(len = 24) {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < len; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

const DEFAULT_SCOPES = (
  import.meta.env.VITE_TIKTOK_SCOPES || "user.info.basic,video.publish,video.list"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const AUTH_URL =
  import.meta.env.VITE_TIKTOK_AUTH_URL ||
  "https://www.tiktok.com/v2/auth/authorize/";

export function buildTikTokAuthUrl({ workspaceId }) {
  const CLIENT_KEY = import.meta.env.VITE_TIKTOK_CLIENT_KEY;
  const REDIRECT_URI = import.meta.env.VITE_TIKTOK_REDIRECT_URI;

  if (!CLIENT_KEY) throw new Error("Missing VITE_TIKTOK_CLIENT_KEY");
  if (!REDIRECT_URI) throw new Error("Missing VITE_TIKTOK_REDIRECT_URI");
  if (!workspaceId) throw new Error("Missing workspaceId");

  const nonce = randomString(24);

  const stateObj = {
    workspaceId: String(workspaceId),
    nonce,
    t: Date.now(),
  };

  const state = b64urlEncode(JSON.stringify(stateObj));

  localStorage.setItem("tiktok_oauth_state", state);
  localStorage.setItem("tiktok_oauth_nonce", nonce);
  localStorage.setItem("tiktok_oauth_workspace_id", String(workspaceId));

  const url = new URL(AUTH_URL);
  url.searchParams.set("client_key", CLIENT_KEY);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", DEFAULT_SCOPES.join(","));
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("state", state);

  return url.toString();
}

export function parseTikTokState(stateRaw) {
  const decoded = b64urlDecode(String(stateRaw || ""));
  if (!decoded) return null;

  try {
    const obj = JSON.parse(decoded);
    if (!obj?.workspaceId) return null;
    return obj;
  } catch {
    return null;
  }
}

export function validateStoredTikTokState(stateRaw) {
  const incoming = String(stateRaw || "");
  const saved = localStorage.getItem("tiktok_oauth_state") || "";
  const parsed = parseTikTokState(incoming);

  if (!incoming || !saved || incoming !== saved || !parsed) {
    return {
      ok: false,
      parsed: null,
    };
  }

  const savedNonce = localStorage.getItem("tiktok_oauth_nonce") || "";
  if (savedNonce && parsed?.nonce && savedNonce !== parsed.nonce) {
    return {
      ok: false,
      parsed: null,
    };
  }

  return {
    ok: true,
    parsed,
  };
}

export function getStoredTikTokWorkspaceId() {
  return localStorage.getItem("tiktok_oauth_workspace_id") || "";
}

export function clearTikTokOAuthState() {
  localStorage.removeItem("tiktok_oauth_state");
  localStorage.removeItem("tiktok_oauth_nonce");
  localStorage.removeItem("tiktok_oauth_workspace_id");
}