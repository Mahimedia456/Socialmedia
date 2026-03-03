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

// ✅ Keep scopes in ONE place
const DEFAULT_SCOPES = [
  "public_profile",
  "email",

  // Pages
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_metadata",
  "pages_messaging",

  // Useful for Business assets selection + some page operations
  "business_management",

  // Instagram (only works if your Meta app has IG Messaging product + permissions approved)
  "instagram_basic",
  "instagram_manage_messages",
];

export function buildMetaAuthUrl({ workspaceId }) {
  const META_APP_ID = import.meta.env.VITE_META_APP_ID;
  const REDIRECT_URI = import.meta.env.VITE_META_REDIRECT_URI;

  // ✅ Optional: if you are using Meta Business Login "Configuration ID"
  // This is what usually shows the nice asset picker UI (pages/IG accounts selection)
  // Add this to frontend .env if you have it:
  // VITE_META_CONFIG_ID=1234567890
  const CONFIG_ID = import.meta.env.VITE_META_CONFIG_ID;

  if (!META_APP_ID) throw new Error("Missing VITE_META_APP_ID");
  if (!REDIRECT_URI) throw new Error("Missing VITE_META_REDIRECT_URI");
  if (!workspaceId) throw new Error("Missing workspaceId");

  const scope = DEFAULT_SCOPES.join(",");

  const state = b64urlEncode(
    JSON.stringify({ workspaceId, t: Date.now(), nonce: randomString(12) })
  );

  // ✅ Use "www.facebook.com" dialog endpoint
  const url = new URL("https://www.facebook.com/v19.0/dialog/oauth");
  url.searchParams.set("client_id", META_APP_ID);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scope); // ✅ FIXED: was SCOPES (undefined)
  url.searchParams.set("state", state);

  // Ask again if user previously denied scopes
  url.searchParams.set("auth_type", "rerequest");

  // Better UX: avoid popup blocking; you can remove if not needed
  url.searchParams.set("display", "popup");

  // Helps when multiple FB accounts are logged in
  url.searchParams.set("prompt", "select_account");

  // ✅ If your app uses Business Login config, this often triggers asset selection UI
  if (CONFIG_ID) {
    url.searchParams.set("config_id", CONFIG_ID);
  }

  // Optional: include these for newer flows (safe to keep)
  // Some apps use this to persist chosen assets; doesn't break if ignored
  url.searchParams.set("extras", JSON.stringify({ setup: {} }));

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