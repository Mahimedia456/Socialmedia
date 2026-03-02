// src/lib/metaConnect.js

function b64urlEncode(str) {
  const b64 = btoa(unescape(encodeURIComponent(str)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64urlDecode(str) {
  try {
    const pad = str.length % 4 ? "=".repeat(4 - (str.length % 4)) : "";
    const b64 = (str + pad).replace(/-/g, "+").replace(/_/g, "/");
    return decodeURIComponent(escape(atob(b64)));
  } catch {
    return "";
  }
}

function randomString(len = 12) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function buildMetaAuthUrl({ workspaceId }) {
  const META_APP_ID = import.meta.env.VITE_META_APP_ID;
  const REDIRECT_URI = import.meta.env.VITE_META_REDIRECT_URI;

  if (!META_APP_ID) throw new Error("Missing VITE_META_APP_ID");
  if (!REDIRECT_URI) throw new Error("Missing VITE_META_REDIRECT_URI");
  if (!workspaceId) throw new Error("Missing workspaceId");

  const SCOPES = [
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_metadata",
    "pages_messaging",
    "instagram_basic",
    "instagram_manage_messages",
  ].join(",");

  const state = b64urlEncode(
    JSON.stringify({ workspaceId, t: Date.now(), nonce: randomString(12) })
  );

  const url = new URL("https://www.facebook.com/v19.0/dialog/oauth");
  url.searchParams.set("client_id", META_APP_ID);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("state", state);

  url.searchParams.set("auth_type", "rerequest");
  url.searchParams.set("display", "popup");
  url.searchParams.set("prompt", "select_account");

  return url.toString();
}

export function parseState(stateRaw) {
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