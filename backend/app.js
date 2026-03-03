// backend/app.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import crypto from "crypto";

/* ---------------- Load .env (absolute path; Windows safe) ---------------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

/* ---------------- Env ---------------- */
const PORT = Number(process.env.PORT || 4000);
const CORS_ORIGINS = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET;
const RESET_SECRET = process.env.RESET_TOKEN_SECRET;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// ✅ Needed for Supabase Realtime auth token minting (Option B realtime)
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || "";

// ✅ Meta webhook verify token (support BOTH env names)
const META_VERIFY_TOKEN =
  process.env.META_VERIFY_TOKEN ||
  process.env.META_WEBHOOK_VERIFY_TOKEN ||
  "";

const META_GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v19.0";

if (!ACCESS_SECRET || !REFRESH_SECRET || !RESET_SECRET) {
  throw new Error(
    "Missing ACCESS_TOKEN_SECRET / REFRESH_TOKEN_SECRET / RESET_TOKEN_SECRET in backend/.env"
  );
}
if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    "Missing SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) in backend/.env"
  );
}

/* ---------------- Supabase client ---------------- */
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

/* ---------------- Tables ---------------- */
const T_USERS = "app_users";
const T_REFRESH = "refresh_tokens";
const T_OTP = "password_reset_otps";
const T_WORKSPACES = "workspaces";
const T_WSM = "workspace_members";

// Inbox tables
const T_INBOX_THREADS = "inbox_threads";
const T_INBOX_MESSAGES = "inbox_messages";

// Connections
const T_CHANNELS = "workspace_channels";
const T_CHANNEL_TOKENS = "channel_tokens";

/* ---------------- Channel status mapping ---------------- */
const CHANNEL_STATUS_CONNECTED =
  process.env.CHANNEL_STATUS_CONNECTED || "connected";
const CHANNEL_STATUS_DISCONNECTED =
  process.env.CHANNEL_STATUS_DISCONNECTED || "disconnected";

/* ---------------- Helpers ---------------- */
function safeEmail(v) {
  const s = String(v || "").trim().toLowerCase();
  return s.includes("@") ? s : "";
}
function randomCode6() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
function signAccess(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });
}
function signRefresh(payload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "30d" });
}
function verifyRefresh(token) {
  return jwt.verify(token, REFRESH_SECRET);
}
function verifyAccess(token) {
  return jwt.verify(token, ACCESS_SECRET);
}
function signReset(payload) {
  return jwt.sign(payload, RESET_SECRET, { expiresIn: "10m" });
}
function verifyReset(token) {
  return jwt.verify(token, RESET_SECRET);
}
function isGlobalAdmin(role) {
  const r = String(role || "").toLowerCase();
  return r === "owner" || r === "admin";
}
function providerMeta() {
  return "meta";
}

// ✅ Mint Supabase-compatible JWT for realtime (client uses anon key + this JWT)
function signRealtimeJwt({ userId, workspaceId }) {
  if (!SUPABASE_JWT_SECRET) throw new Error("Missing SUPABASE_JWT_SECRET");

  return jwt.sign(
    {
      sub: String(userId),
      role: "authenticated",
      workspace_id: String(workspaceId),
    },
    SUPABASE_JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: "60m",
      audience: "authenticated",
      issuer: "supabase",
    }
  );
}

/* ---------------- Email (DEV or SMTP) ---------------- */
const EMAIL_MODE = String(process.env.EMAIL_MODE || "dev").toLowerCase();
const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE || "false") === "true";
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM =
  process.env.SMTP_FROM ||
  "Mahimedia Solutions <no-reply@mahimediasolutions.com>";

function buildOtpEmailHtml({ email, code }) {
  const year = new Date().getFullYear();
  return `<!doctype html><html><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Password reset code</title></head>
<body style="margin:0;padding:0;background:#071a17;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#071a17;padding:28px 14px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0"
style="width:600px;max-width:600px;background:#071f1b;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
<tr><td style="padding:22px 24px;background:linear-gradient(135deg,#0e3b35,#071a17);border-bottom:1px solid rgba(255,255,255,0.08);">
<div style="color:#67e8d2;font-weight:700;letter-spacing:1px;font-size:12px;text-transform:uppercase;">Mahimedia Solutions</div>
<div style="color:#ffffff;font-size:20px;font-weight:800;margin-top:6px;">Password Reset Code</div>
</td></tr>
<tr><td style="padding:22px 24px;color:#d7fff6;">
<div style="font-size:14px;line-height:1.6;color:#baf7ea;">We received a request to reset your password for:
<span style="color:#ffffff;font-weight:700;">${email}</span></div>
<div style="margin-top:18px;padding:18px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;">
<div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#67e8d2;font-weight:700;">Your 6-digit code</div>
<div style="margin-top:12px;text-align:center;">
<span style="display:inline-block;background:#14b8a6;color:#04110f;font-size:34px;font-weight:900;letter-spacing:10px;padding:10px 16px;border-radius:12px;">${code}</span>
</div>
<div style="margin-top:10px;font-size:12px;color:#99f6e4;text-align:center;">This code expires in 10 minutes.</div>
</div>
<div style="margin-top:18px;font-size:13px;line-height:1.6;color:#baf7ea;">If you did not request this, you can ignore this email.</div>
<div style="margin-top:18px;font-size:12px;color:#5eead4;">For help, contact support.</div>
</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid rgba(255,255,255,0.08);color:#2dd4bf;font-size:11px;text-align:center;">© ${year} Mahimedia Solutions. All rights reserved.</td></tr>
</table>
<div style="margin-top:10px;color:#14b8a6;font-size:11px;">This is an automated message; please do not reply.</div>
</td></tr></table></body></html>`;
}

function getMailer() {
  if (EMAIL_MODE !== "smtp" && EMAIL_MODE !== "both") return null;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

async function sendOtpEmail({ to, code }) {
  const html = buildOtpEmailHtml({ email: to, code });
  const mailer = getMailer();

  if (EMAIL_MODE === "dev" || EMAIL_MODE === "both") {
    console.log("RESET OTP (DEV LOG):", { email: to, code });
  }
  if (EMAIL_MODE === "smtp" || EMAIL_MODE === "both") {
    if (!mailer) {
      console.log("SMTP config missing. Email not sent.");
      return { mode: "log-only" };
    }
    await mailer.sendMail({
      from: SMTP_FROM,
      to,
      subject: "Your password reset code (Mahimedia Solutions)",
      html,
    });
    console.log("RESET OTP EMAIL SENT:", to);
    return { mode: "email-sent" };
  }
  return { mode: "log-only" };
}

/* ---------------- DB helpers ---------------- */
async function getUserByEmail(email) {
  const { data, error } = await supabase
    .from(T_USERS)
    .select("*")
    .eq("email", email)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}
async function getUserById(id) {
  const { data, error } = await supabase
    .from(T_USERS)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}
async function setRefreshToken(userId, token) {
  const { error } = await supabase
    .from(T_REFRESH)
    .upsert([{ user_id: userId, token, updated_at: new Date().toISOString() }], {
      onConflict: "user_id",
    });
  if (error) throw error;
}
async function getRefreshToken(userId) {
  const { data, error } = await supabase
    .from(T_REFRESH)
    .select("token")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data?.token || null;
}
async function clearRefreshToken(userId) {
  const { error } = await supabase.from(T_REFRESH).delete().eq("user_id", userId);
  if (error) throw error;
}
async function setOtp(userId, code, expiresAtMs) {
  const { error } = await supabase
    .from(T_OTP)
    .upsert(
      [
        {
          user_id: userId,
          code,
          purpose: "password_reset",
          expires_at: new Date(expiresAtMs).toISOString(),
          attempts_left: 5,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: "user_id" }
    );
  if (error) throw error;
}
async function getOtp(userId) {
  const { data, error } = await supabase
    .from(T_OTP)
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    code: data.code,
    expiresAt: new Date(data.expires_at).getTime(),
    attemptsLeft: data.attempts_left,
  };
}
async function decrementOtpAttempts(userId) {
  const otp = await getOtp(userId);
  if (!otp) return;
  const next = Math.max(0, (otp.attemptsLeft || 0) - 1);
  const { error } = await supabase
    .from(T_OTP)
    .update({ attempts_left: next, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (error) throw error;
}
async function clearOtp(userId) {
  const { error } = await supabase.from(T_OTP).delete().eq("user_id", userId);
  if (error) throw error;
}
async function ensureDevUsers() {
  const pwd = process.env.DEV_PASSWORD || "mahimediasolutions";
  const hash = await bcrypt.hash(pwd, 10);

  const devs = [
    { email: "admin@mahimediasolutions.com", role: "owner" },
    { email: "aamir@mahimediasolutions.com", role: "admin" },
    { email: "editor@mahimediasolutions.com", role: "editor" },
    { email: "support@mahimediasolutions.com", role: "support" },
    { email: "viewer@mahimediasolutions.com", role: "viewer" },
  ];

  const rows = devs.map((u) => ({
    email: u.email,
    role: u.role,
    password_hash: hash,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from(T_USERS).upsert(rows, { onConflict: "email" });
  if (error) throw error;
}

/* ---------------- Auth middleware ---------------- */
function getBearerToken(req) {
  const h = String(req.headers.authorization || "");
  if (!h.toLowerCase().startsWith("bearer ")) return "";
  return h.slice(7).trim();
}
function requireAuth(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ error: "NO_ACCESS_TOKEN" });
    const decoded = verifyAccess(token);
    req.auth = { userId: decoded.sub, email: decoded.email, role: decoded.role };
    next();
  } catch {
    return res.status(401).json({ error: "INVALID_ACCESS_TOKEN" });
  }
}

/* ---------------- Workspace access ---------------- */
async function getWorkspaceMemberRole(userId, workspaceId) {
  const { data, error } = await supabase
    .from(T_WSM)
    .select("role,status")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data || data.status !== "active") return null;
  return data.role || null;
}
async function requireWorkspaceAccess(req, res, next) {
  try {
    const { workspaceId } = req.params;
    if (isGlobalAdmin(req.auth.role)) {
      req.workspaceRole = req.auth.role;
      return next();
    }
    const role = await getWorkspaceMemberRole(req.auth.userId, workspaceId);
    if (!role) return res.status(403).json({ error: "WORKSPACE_FORBIDDEN" });
    req.workspaceRole = role;
    next();
  } catch (e) {
    next(e);
  }
}

/* ================= META HELPERS ================= */
function mustEnv(v, name) {
  if (!v) throw new Error(`Missing ${name} in backend/.env`);
  return v;
}

async function exchangeMetaCodeForToken({ code }) {
  const META_APP_ID = mustEnv(process.env.META_APP_ID, "META_APP_ID");
  const META_APP_SECRET = mustEnv(process.env.META_APP_SECRET, "META_APP_SECRET");
  const META_REDIRECT_URI = mustEnv(process.env.META_REDIRECT_URI, "META_REDIRECT_URI");

  const url = new URL(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/oauth/access_token`
  );
  url.searchParams.set("client_id", META_APP_ID);
  url.searchParams.set("client_secret", META_APP_SECRET);
  url.searchParams.set("redirect_uri", META_REDIRECT_URI);
  url.searchParams.set("code", code);

  const r = await fetch(url.toString());
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = j?.error?.message || j?.error?.error_user_msg || "Token exchange failed";
    throw new Error(msg);
  }
  return j;
}

async function fetchMetaPages({ userAccessToken }) {
  const out = [];
  let after = null;

  while (true) {
    const url = new URL(`https://graph.facebook.com/${META_GRAPH_VERSION}/me/accounts`);
    url.searchParams.set(
      "fields",
      [
        "id",
        "name",
        "access_token",
        // IG Business
        "instagram_business_account{id,username}",
        // Sometimes IG is exposed here instead
        "connected_instagram_account{id,username}",
        // Useful to debug why a page is missing
        "tasks",
      ].join(",")
    );
    url.searchParams.set("limit", "100");
    if (after) url.searchParams.set("after", after);
    url.searchParams.set("access_token", userAccessToken);

    const r = await fetch(url.toString());
    const j = await r.json().catch(() => ({}));

    console.log("META /me/accounts PAGE:", JSON.stringify(j, null, 2));

    if (!r.ok) {
      const msg = j?.error?.message || "Failed to fetch pages";
      throw new Error(msg);
    }

    out.push(...(j?.data || []));

    const nextAfter = j?.paging?.cursors?.after || null;
    if (!nextAfter) break;
    after = nextAfter;

    if (out.length >= 1000) break; // safety
  }

  return out;
}

/* --------- FB Messenger pagination --------- */
async function fetchPageConversations({ pageId, pageToken, limit = 50, after = null }) {
  const url = new URL(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/${pageId}/conversations`
  );
  url.searchParams.set("fields", "id,updated_time,snippet,participants");
  url.searchParams.set("limit", String(limit));
  if (after) url.searchParams.set("after", after);
  url.searchParams.set("access_token", pageToken);

  const r = await fetch(url.toString());
  const j = await r.json().catch(() => ({}));

  if (!r.ok) {
    const msg = j?.error?.message || "Failed to fetch conversations";
    const e = new Error(msg);
    e.meta = j?.error || j;
    throw e;
  }

  return { data: j?.data || [], paging: j?.paging || null };
}

async function fetchConversationMessages({ conversationId, pageToken, limit = 50, after = null }) {
  const url = new URL(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/${conversationId}/messages`
  );
  url.searchParams.set("fields", "id,created_time,from,message");
  url.searchParams.set("limit", String(limit));
  if (after) url.searchParams.set("after", after);
  url.searchParams.set("access_token", pageToken);

  const r = await fetch(url.toString());
  const j = await r.json().catch(() => ({}));

  if (!r.ok) {
    const msg = j?.error?.message || "Failed to fetch conversation messages";
    const e = new Error(msg);
    e.meta = j?.error || j;
    throw e;
  }

  return { data: j?.data || [], paging: j?.paging || null };
}

async function fetchAllPageConversations({ pageId, pageToken, maxConvos = 500 }) {
  const all = [];
  let after = null;

  while (true) {
    const { data, paging } = await fetchPageConversations({
      pageId,
      pageToken,
      limit: 50,
      after,
    });

    all.push(...(data || []));

    const nextAfter = paging?.cursors?.after || null;
    if (!nextAfter) break;
    after = nextAfter;

    if (all.length >= maxConvos) break;
  }

  return all;
}

async function fetchAllConversationMessages({ conversationId, pageToken, maxMsgs = 500 }) {
  const all = [];
  let after = null;

  while (true) {
    const { data, paging } = await fetchConversationMessages({
      conversationId,
      pageToken,
      limit: 50,
      after,
    });

    all.push(...(data || []));

    const nextAfter = paging?.cursors?.after || null;
    if (!nextAfter) break;
    after = nextAfter;

    if (all.length >= maxMsgs) break;
  }

  return all;
}

/* --------- IG Messaging (attempt) --------- */
async function fetchIgConversations({ igUserId, token, limit = 50, after = null }) {
  const url = new URL(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/${igUserId}/conversations`
  );
  url.searchParams.set("fields", "id,updated_time,participants");
  url.searchParams.set("limit", String(limit));
  if (after) url.searchParams.set("after", after);
  url.searchParams.set("access_token", token);

  const r = await fetch(url.toString());
  const j = await r.json().catch(() => ({}));

  if (!r.ok) {
    const msg = j?.error?.message || "Failed to fetch IG conversations";
    const e = new Error(msg);
    e.meta = j?.error || j;
    throw e;
  }
  return { data: j?.data || [], paging: j?.paging || null };
}

async function fetchIgMessages({ conversationId, token, limit = 50, after = null }) {
  const url = new URL(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/${conversationId}/messages`
  );
  url.searchParams.set("fields", "id,created_time,from,to,message");
  url.searchParams.set("limit", String(limit));
  if (after) url.searchParams.set("after", after);
  url.searchParams.set("access_token", token);

  const r = await fetch(url.toString());
  const j = await r.json().catch(() => ({}));

  if (!r.ok) {
    const msg = j?.error?.message || "Failed to fetch IG messages";
    const e = new Error(msg);
    e.meta = j?.error || j;
    throw e;
  }
  return { data: j?.data || [], paging: j?.paging || null };
}

async function fetchAllIgConversations({ igUserId, token, maxConvos = 500 }) {
  const all = [];
  let after = null;
  while (true) {
    const { data, paging } = await fetchIgConversations({
      igUserId,
      token,
      limit: 50,
      after,
    });
    all.push(...(data || []));
    const nextAfter = paging?.cursors?.after || null;
    if (!nextAfter) break;
    after = nextAfter;
    if (all.length >= maxConvos) break;
  }
  return all;
}

async function fetchAllIgMessages({ conversationId, token, maxMsgs = 500 }) {
  const all = [];
  let after = null;
  while (true) {
    const { data, paging } = await fetchIgMessages({
      conversationId,
      token,
      limit: 50,
      after,
    });
    all.push(...(data || []));
    const nextAfter = paging?.cursors?.after || null;
    if (!nextAfter) break;
    after = nextAfter;
    if (all.length >= maxMsgs) break;
  }
  return all;
}

/* --------- Tokens from DB --------- */
async function getTokenFromDB({ workspaceId, externalId, token_type }) {
  const provider = providerMeta();
  const { data, error } = await supabase
    .from(T_CHANNEL_TOKENS)
    .select("access_token")
    .eq("workspace_id", workspaceId)
    .eq("provider", provider)
    .eq("external_id", externalId)
    .eq("token_type", token_type)
    .maybeSingle();
  if (error) throw error;
  return data?.access_token || "";
}

async function getPageTokenFromDB({ workspaceId, pageId }) {
  return getTokenFromDB({ workspaceId, externalId: pageId, token_type: "page" });
}

/* --------- SEND APIs --------- */
async function sendFacebookPageMessage({ pageToken, recipientId, text }) {
  const url = new URL(`https://graph.facebook.com/${META_GRAPH_VERSION}/me/messages`);
  url.searchParams.set("access_token", pageToken);

  const body = {
    messaging_type: "RESPONSE",
    recipient: { id: recipientId },
    message: { text },
  };

  const r = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(j?.error?.message || "FB send failed");
    e.meta = j?.error || j;
    throw e;
  }
  return j;
}

async function sendInstagramMessage({ igUserId, token, recipientId, text }) {
  const url = new URL(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/${igUserId}/messages`
  );
  url.searchParams.set("access_token", token);

  const body = {
    recipient: { id: recipientId },
    message: { text },
  };

  const r = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(j?.error?.message || "IG send failed");
    e.meta = j?.error || j;
    throw e;
  }
  return j;
}

/* ================= META WEBHOOK HELPERS ================= */

// Optional: verify X-Hub-Signature-256 if META_APP_SECRET is set.
function verifyMetaSignature({ rawBody, signatureHeader }) {
  const appSecret = process.env.META_APP_SECRET || "";
  if (!appSecret) return { ok: true, skipped: true };
  if (!signatureHeader) return { ok: true, skipped: true };

  const sig = String(signatureHeader || "");
  if (!sig.startsWith("sha256=")) return { ok: false, reason: "BAD_SIGNATURE_FORMAT" };

  const expected = crypto
    .createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex");

  const got = sig.slice("sha256=".length);

  // timing-safe compare
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(got, "hex");
  if (a.length !== b.length) return { ok: false, reason: "SIGNATURE_LEN_MISMATCH" };

  const ok = crypto.timingSafeEqual(a, b);
  return ok ? { ok: true } : { ok: false, reason: "SIGNATURE_MISMATCH" };
}

async function findChannelByExternalId({ provider, platform, externalId }) {
  // externalId is pageId for facebook, igUserId for instagram
  const { data, error } = await supabase
    .from(T_CHANNELS)
    .select("id,workspace_id,platform,provider,external_id,display_name,status,meta")
    .eq("provider", provider)
    .eq("platform", platform)
    .eq("external_id", externalId)
    .eq("status", CHANNEL_STATUS_CONNECTED)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function upsertInboundThreadAndMessage({
  workspaceId,
  provider,
  platform,
  channelId,
  channelExternalId,
  participantExternalId,
  participantName,
  messageId,
  text,
  sentAtISO,
  rawMeta,
}) {
  // Webhook events usually do NOT give conversation_id reliably.
  // We group by participant id under a channel.
  const externalThreadId = `p_${String(participantExternalId || "unknown")}`;

  const snippet = String(text || "").slice(0, 200);
  const now = new Date().toISOString();

  const { data: threadRow, error: thErr } = await supabase
    .from(T_INBOX_THREADS)
    .upsert(
      [
        {
          workspace_id: workspaceId,
          provider,
          platform,
          channel_id: channelId,
          external_thread_id: externalThreadId,
          participant_external_id: participantExternalId || null,
          participant_name: participantName || null,
          participant_username: null,
          last_message_at: sentAtISO || now,
          last_message_snippet: snippet,
          status: "open",
          unread_count: 0,
          updated_at: now,
        },
      ],
      { onConflict: "workspace_id,provider,platform,channel_id,external_thread_id" }
    )
    .select("*")
    .single();

  if (thErr) throw thErr;

  const extMsgId =
    messageId || `wh_${channelExternalId}_${participantExternalId}_${Date.now()}`;

  // message upsert (idempotent)
  const { error: msgErr } = await supabase.from(T_INBOX_MESSAGES).upsert(
    [
      {
        workspace_id: workspaceId,
        thread_id: threadRow.id,
        channel_id: channelId,
        provider,
        platform,
        external_message_id: String(extMsgId),
        direction: "inbound",
        sender_external_id: participantExternalId || null,
        sender_name: participantName || null,
        message_type: "text",
        text: String(text || ""),
        sent_at: sentAtISO || now,
        meta: rawMeta || {},
      },
    ],
    { onConflict: "workspace_id,thread_id,external_message_id" }
  );
  if (msgErr) throw msgErr;

  return { threadId: threadRow.id };
}

/* ---------------- App ---------------- */
const app = express();

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (CORS_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(helmet());

// ✅ IMPORTANT: keep Meta webhook RAW (for signature verification).
// Must be BEFORE express.json().
// We support BOTH routes so even if Meta dashboard is set to /api/webhooks/meta it will work.
app.use("/api/meta/webhook", express.raw({ type: "application/json" }));
app.use("/api/webhooks/meta", express.raw({ type: "application/json" }));

app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

// request log
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

/* ---------------- Health ---------------- */
app.get("/api/health", (req, res) =>
  res.json({
    ok: true,
    service: "auth-api",
    email_mode: EMAIL_MODE,
    meta_graph: META_GRAPH_VERSION,
    supabase_realtime: !!SUPABASE_JWT_SECRET,
    meta_webhook: !!META_VERIFY_TOKEN,
  })
);

/* ============================================================
   META WEBHOOK (UPDATED)
   - GET: verification
   - POST: receive messages and upsert into inbox tables
   Works on:
     /api/meta/webhook        (recommended)
     /api/webhooks/meta       (alias - your current .env)
   ============================================================ */

function handleMetaWebhookGet(req, res) {
  try {
    const mode = String(req.query["hub.mode"] || "");
    const token = String(req.query["hub.verify_token"] || "");
    const challenge = String(req.query["hub.challenge"] || "");

    if (
      mode === "subscribe" &&
      token &&
      META_VERIFY_TOKEN &&
      token === META_VERIFY_TOKEN
    ) {
      console.log("META WEBHOOK VERIFIED");
      return res.status(200).send(challenge);
    }
    return res.status(403).json({ error: "WEBHOOK_VERIFY_FAILED" });
  } catch (e) {
    return res
      .status(500)
      .json({ error: "SERVER_ERROR", message: e?.message || "Webhook verify failed" });
  }
}

async function handleMetaWebhookPost(req, res) {
  // ALWAYS respond quickly.
  try {
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
    const sig = req.headers["x-hub-signature-256"];

    const sigCheck = verifyMetaSignature({ rawBody, signatureHeader: sig });
    if (!sigCheck.ok) {
      console.warn("META WEBHOOK SIGNATURE FAIL:", sigCheck.reason);
      return res.status(401).json({ error: "INVALID_SIGNATURE" });
    }

    const payload = JSON.parse(rawBody.toString("utf8") || "{}");
    const provider = providerMeta();

    const objectType = String(payload?.object || "").toLowerCase();
    const entries = Array.isArray(payload?.entry) ? payload.entry : [];

    let processed = 0;
    let ignored = 0;
    const errors = [];

    for (const entry of entries) {
      const entryId = entry?.id ? String(entry.id) : "";
      if (!entryId) {
        ignored += 1;
        continue;
      }

      const platform = objectType === "instagram" ? "instagram" : "facebook";

      const channel = await findChannelByExternalId({
        provider,
        platform,
        externalId: entryId,
      });

      if (!channel) {
        ignored += 1;
        continue;
      }

      const messagingEvents = Array.isArray(entry?.messaging) ? entry.messaging : [];
      if (!messagingEvents.length) {
        ignored += 1;
        continue;
      }

      for (const ev of messagingEvents) {
        try {
          const senderId = ev?.sender?.id ? String(ev.sender.id) : null;
          const recipientId = ev?.recipient?.id ? String(ev.recipient.id) : null;

          const mid = ev?.message?.mid ? String(ev.message.mid) : null;
          const text = ev?.message?.text ? String(ev.message.text) : "";

          // ignore echo/delivery/read
          const isEcho = !!ev?.message?.is_echo;
          if (isEcho) {
            ignored += 1;
            continue;
          }
          if (!senderId || !text) {
            ignored += 1;
            continue;
          }

          const tsMs = typeof ev?.timestamp === "number" ? ev.timestamp : Date.now();
          const sentAtISO = new Date(tsMs).toISOString();

          await upsertInboundThreadAndMessage({
            workspaceId: channel.workspace_id,
            provider,
            platform: channel.platform,
            channelId: channel.id,
            channelExternalId: channel.external_id,
            participantExternalId: senderId,
            participantName: null,
            messageId: mid,
            text,
            sentAtISO,
            rawMeta: {
              webhook: true,
              object: objectType,
              recipient_id: recipientId,
            },
          });

          processed += 1;
        } catch (e) {
          errors.push({ message: e?.message || "Webhook event failed" });
        }
      }
    }

    return res.status(200).json({ ok: true, processed, ignored, errors });
  } catch (e) {
    console.error("META WEBHOOK ERROR:", e?.message || e);
    // Still return 200 for Meta to avoid retries storm
    return res.status(200).json({ ok: false, error: "WEBHOOK_HANDLER_FAILED" });
  }
}

app.get("/api/meta/webhook", handleMetaWebhookGet);
app.get("/api/webhooks/meta", handleMetaWebhookGet);

app.post("/api/meta/webhook", handleMetaWebhookPost);
app.post("/api/webhooks/meta", handleMetaWebhookPost);

/* ============================================================
   AUTH APIs
   ============================================================ */
app.post("/api/auth/login", async (req, res, next) => {
  try {
    const email = safeEmail(req.body?.email);
    const password = String(req.body?.password || "");
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "VALIDATION_ERROR", message: "Email and password required." });
    }
    const user = await getUserByEmail(email);
    if (!user) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = signAccess(payload);
    const refresh_token = signRefresh(payload);
    await setRefreshToken(user.id, refresh_token);

    return res.json({
      access_token,
      refresh_token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (e) {
    next(e);
  }
});

app.post("/api/auth/refresh-token", async (req, res) => {
  try {
    const token = String(req.body?.refresh_token || "");
    if (!token) return res.status(401).json({ error: "NO_REFRESH_TOKEN" });

    const decoded = verifyRefresh(token);
    const user = await getUserById(decoded.sub);
    if (!user) return res.status(401).json({ error: "INVALID_REFRESH_TOKEN" });

    const saved = await getRefreshToken(user.id);
    if (saved !== token) return res.status(401).json({ error: "REFRESH_REVOKED" });

    const access_token = signAccess({ sub: user.id, email: user.email, role: user.role });
    return res.json({ access_token });
  } catch {
    return res.status(401).json({ error: "INVALID_REFRESH_TOKEN" });
  }
});

app.post("/api/auth/logout", async (req, res, next) => {
  try {
    const token = String(req.body?.refresh_token || "");
    if (token) {
      try {
        const decoded = verifyRefresh(token);
        await clearRefreshToken(decoded.sub);
      } catch {}
    }
    return res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

app.post("/api/auth/forgot-password", async (req, res, next) => {
  try {
    const email = safeEmail(req.body?.email);
    if (!email)
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "Email required." });

    const user = await getUserByEmail(email);
    if (!user) return res.json({ ok: true });

    const code = randomCode6();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    await setOtp(user.id, code, expiresAt);
    await sendOtpEmail({ to: email, code });
    return res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

app.post("/api/auth/verify-email", async (req, res, next) => {
  try {
    const email = safeEmail(req.body?.email);
    const code = String(req.body?.code || "").trim();
    if (!email || code.length !== 6) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "Email and 6-digit code required.",
      });
    }

    const user = await getUserByEmail(email);
    if (!user) return res.status(400).json({ error: "INVALID_CODE" });

    const otp = await getOtp(user.id);
    if (!otp) return res.status(400).json({ error: "INVALID_CODE" });

    if (Date.now() > otp.expiresAt) {
      await clearOtp(user.id);
      return res.status(400).json({ error: "CODE_EXPIRED" });
    }

    if (otp.attemptsLeft <= 0) {
      await clearOtp(user.id);
      return res.status(429).json({ error: "TOO_MANY_ATTEMPTS" });
    }

    if (otp.code !== code) {
      await decrementOtpAttempts(user.id);
      return res.status(400).json({ error: "INVALID_CODE" });
    }

    await clearOtp(user.id);
    const reset_token = signReset({ sub: user.id, email: user.email, purpose: "password_reset" });
    return res.json({ reset_token });
  } catch (e) {
    next(e);
  }
});

app.post("/api/auth/reset-password", async (req, res, next) => {
  try {
    const reset_token = String(req.body?.reset_token || "");
    const new_password = String(req.body?.new_password || "");
    if (!reset_token || new_password.length < 8) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "reset_token and new_password (min 8) required.",
      });
    }

    let decoded;
    try {
      decoded = verifyReset(reset_token);
    } catch {
      return res.status(401).json({ error: "INVALID_RESET_TOKEN" });
    }
    if (decoded.purpose !== "password_reset") {
      return res.status(401).json({ error: "INVALID_RESET_TOKEN" });
    }

    const user = await getUserById(decoded.sub);
    if (!user) return res.status(401).json({ error: "INVALID_RESET_TOKEN" });

    const hash = await bcrypt.hash(new_password, 10);
    const { error } = await supabase
      .from(T_USERS)
      .update({ password_hash: hash, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (error) throw error;

    await clearRefreshToken(user.id);
    return res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/* ============================================================
   WORKSPACES APIs
   ============================================================ */
app.get("/api/workspaces", requireAuth, async (req, res, next) => {
  try {
    if (isGlobalAdmin(req.auth.role)) {
      const { data, error } = await supabase
        .from(T_WORKSPACES)
        .select("id,name,description,plan,created_at,created_by")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return res.json({
        workspaces: (data || []).map((w) => ({ ...w, my_role: req.auth.role })),
      });
    }

    const { data, error } = await supabase
      .from(T_WSM)
      .select("role, workspaces:workspace_id ( id, name, description, plan, created_at, created_by )")
      .eq("user_id", req.auth.userId)
      .eq("status", "active")
      .order("joined_at", { ascending: false });
    if (error) throw error;

    const rows = (data || []).map((r) => ({
      id: r.workspaces?.id,
      name: r.workspaces?.name,
      description: r.workspaces?.description,
      plan: r.workspaces?.plan,
      created_at: r.workspaces?.created_at,
      created_by: r.workspaces?.created_by,
      my_role: r.role,
    }));
    res.json({ workspaces: rows });
  } catch (e) {
    next(e);
  }
});

/* ============================================================
   CHANNELS APIs
   ============================================================ */
app.get(
  "/api/workspaces/:workspaceId/channels",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res, next) => {
    try {
      const { workspaceId } = req.params;
      const provider = String(req.query?.provider || "").trim();

      let q = supabase
        .from(T_CHANNELS)
        .select("id,provider,platform,display_name,external_id,status,meta,updated_at")
        .eq("workspace_id", workspaceId)
        .order("updated_at", { ascending: false });

      if (provider) q = q.eq("provider", provider);

      const { data, error } = await q;
      if (error) throw error;
      res.json({ channels: data || [] });
    } catch (e) {
      next(e);
    }
  }
);

app.post(
  "/api/workspaces/:workspaceId/channels/:channelId/disconnect",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res, next) => {
    try {
      const { workspaceId, channelId } = req.params;
      const { error } = await supabase
        .from(T_CHANNELS)
        .update({ status: CHANNEL_STATUS_DISCONNECTED, updated_at: new Date().toISOString() })
        .eq("workspace_id", workspaceId)
        .eq("id", channelId);
      if (error) throw error;
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  }
);

/* ============================================================
   META CONNECT APIs
   ============================================================ */
app.post("/api/meta/exchange", requireAuth, async (req, res, next) => {
  try {
    const code = String(req.body?.code || "");
    const workspaceId = String(req.body?.workspaceId || "");
    if (!code || !workspaceId) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "code and workspaceId required" });
    }

    if (!isGlobalAdmin(req.auth.role)) {
      const role = await getWorkspaceMemberRole(req.auth.userId, workspaceId);
      if (!role) return res.status(403).json({ error: "WORKSPACE_FORBIDDEN" });
    }

    const token = await exchangeMetaCodeForToken({ code });
    const userAccessToken = token.access_token;
    const pages = await fetchMetaPages({ userAccessToken });

const normalized = (pages || []).map((p) => {
  const ig =
    p.instagram_business_account ||
    p.connected_instagram_account ||
    null;

  return {
    pageId: String(p.id),
    pageName: String(p.name || "Facebook Page"),
    pageToken: String(p.access_token || ""),
    igId: ig?.id ? String(ig.id) : null,
    igUsername: ig?.username ? String(ig.username) : null,
    tasks: Array.isArray(p.tasks) ? p.tasks : [],
  };
});

    return res.json({
      ok: true,
      workspaceId,
      user_access_token: userAccessToken,
      expires_in: token.expires_in || null,
      pages: normalized,
    });
  } catch (e) {
    next(e);
  }
});

app.post("/api/meta/connect-pages", requireAuth, async (req, res, next) => {
  try {
    const workspaceId = String(req.body?.workspaceId || "");
    const userAccessToken = String(req.body?.user_access_token || "");
    const selections = req.body?.selections;
    const expires_in = req.body?.expires_in ?? null;

    if (!workspaceId || !userAccessToken || !Array.isArray(selections)) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "workspaceId, user_access_token, selections[] required",
      });
    }

    if (!isGlobalAdmin(req.auth.role)) {
      const role = await getWorkspaceMemberRole(req.auth.userId, workspaceId);
      if (!role) return res.status(403).json({ error: "WORKSPACE_FORBIDDEN" });
    }

    const provider = providerMeta();
    const expiresAt = expires_in
      ? new Date(Date.now() + Number(expires_in) * 1000).toISOString()
      : null;

    // store user token (optional)
    const { error: userTokErr } = await supabase.from(T_CHANNEL_TOKENS).upsert(
      [
        {
          workspace_id: workspaceId,
          provider,
          external_id: "me",
          token_type: "user",
          access_token: userAccessToken,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: "workspace_id,provider,external_id,token_type" }
    );
    if (userTokErr) throw userTokErr;

    const channelRows = [];
    const tokenRows = [];

    for (const s of selections) {
      const pageId = String(s.pageId || "");
      const pageName = String(s.pageName || "Facebook Page");
      const pageToken = String(s.pageToken || "");
      const igId = s.igId ? String(s.igId) : null;

      const connectFacebook = !!s.connectFacebook;
      const connectInstagram = !!s.connectInstagram && !!igId;

      if (!pageId) continue;
      if (!connectFacebook && !connectInstagram) continue;

      if (connectFacebook) {
        channelRows.push({
          workspace_id: workspaceId,
          provider,
          platform: "facebook",
          display_name: pageName,
          external_id: pageId,
          status: CHANNEL_STATUS_CONNECTED,
          meta: { type: "page" },
          updated_at: new Date().toISOString(),
        });

        if (pageToken) {
          tokenRows.push({
            workspace_id: workspaceId,
            provider,
            external_id: pageId,
            token_type: "page",
            access_token: pageToken,
            expires_at: null,
            updated_at: new Date().toISOString(),
          });
        }
      }

      if (connectInstagram && igId) {
        channelRows.push({
          workspace_id: workspaceId,
          provider,
          platform: "instagram",
          display_name: `IG ${pageName}`,
          external_id: igId,
          status: CHANNEL_STATUS_CONNECTED,
          meta: { type: "ig_business", page_id: pageId },
          updated_at: new Date().toISOString(),
        });

        // NOTE: storing page token under igId as "page" token_type.
        if (pageToken) {
          tokenRows.push({
            workspace_id: workspaceId,
            provider,
            external_id: igId,
            token_type: "page",
            access_token: pageToken,
            expires_at: null,
            updated_at: new Date().toISOString(),
          });
        }
      }
    }

    if (!channelRows.length) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "No selections to connect" });
    }

    const { error: chErr } = await supabase.from(T_CHANNELS).upsert(channelRows, {
      onConflict: "workspace_id,provider,platform,external_id",
    });
    if (chErr) throw chErr;

    if (tokenRows.length) {
      const { error: tErr } = await supabase.from(T_CHANNEL_TOKENS).upsert(tokenRows, {
        onConflict: "workspace_id,provider,external_id,token_type",
      });
      if (tErr) throw tErr;
    }

    return res.json({
      ok: true,
      connected_channels: channelRows.length,
      connected_tokens: tokenRows.length,
    });
  } catch (e) {
    next(e);
  }
});

/* ============================================================
   INBOX APIs
   ============================================================ */

// ✅ Realtime token for Supabase Realtime (Option B)
app.get(
  "/api/workspaces/:workspaceId/realtime/token",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res) => {
    try {
      const { workspaceId } = req.params;

      if (!SUPABASE_JWT_SECRET) {
        return res.status(500).json({
          error: "SERVER_ERROR",
          message: "SUPABASE_JWT_SECRET missing in backend/.env",
        });
      }

      const token = signRealtimeJwt({ userId: req.auth.userId, workspaceId });
      return res.json({ ok: true, token });
    } catch (e) {
      return res.status(500).json({
        error: "SERVER_ERROR",
        message: e?.message || "Failed to create realtime token",
      });
    }
  }
);

// List threads (workspace) — includes channel join
app.get(
  "/api/workspaces/:workspaceId/inbox/threads",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res, next) => {
    try {
      const { workspaceId } = req.params;
      const platform = String(req.query.platform || "all").toLowerCase();
      const status = String(req.query.status || "all").toLowerCase();
      const q = String(req.query.q || "").trim().toLowerCase();
      const channelId = String(req.query.channelId || "all");

      let query = supabase
        .from(T_INBOX_THREADS)
        .select(
          `
          *,
          channel:channel_id (
            id,
            display_name,
            external_id,
            platform,
            provider
          )
        `
        )
        .eq("workspace_id", workspaceId)
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (platform !== "all") query = query.eq("platform", platform);
      if (status !== "all") query = query.eq("status", status);
      if (channelId !== "all") query = query.eq("channel_id", channelId);

      const { data, error } = await query;
      if (error) throw error;

      const filtered = (data || []).filter((t) => {
        if (!q) return true;
        return (
          String(t.participant_name || "").toLowerCase().includes(q) ||
          String(t.participant_username || "").toLowerCase().includes(q) ||
          String(t.participant_external_id || "").toLowerCase().includes(q) ||
          String(t.last_message_snippet || "").toLowerCase().includes(q) ||
          String(t.channel?.display_name || "").toLowerCase().includes(q) ||
          String(t.channel?.external_id || "").toLowerCase().includes(q)
        );
      });

      res.json({ threads: filtered });
    } catch (e) {
      next(e);
    }
  }
);

// Read messages (thread)
app.get("/api/inbox/threads/:threadId/messages", requireAuth, async (req, res, next) => {
  try {
    const { threadId } = req.params;
    const limit = Math.min(500, Math.max(1, Number(req.query.limit || 100)));

    const { data: thread, error: thErr } = await supabase
      .from(T_INBOX_THREADS)
      .select("id,workspace_id")
      .eq("id", threadId)
      .maybeSingle();
    if (thErr) throw thErr;
    if (!thread) return res.status(404).json({ error: "THREAD_NOT_FOUND" });

    if (!isGlobalAdmin(req.auth.role)) {
      const role = await getWorkspaceMemberRole(req.auth.userId, thread.workspace_id);
      if (!role) return res.status(403).json({ error: "WORKSPACE_FORBIDDEN" });
    }

    const { data, error } = await supabase
      .from(T_INBOX_MESSAGES)
      .select("*")
      .eq("thread_id", threadId)
      .order("sent_at", { ascending: true })
      .limit(limit);
    if (error) throw error;

    res.json({ messages: data || [] });
  } catch (e) {
    next(e);
  }
});

// Send outbound message (DB + Meta send if possible)
app.post("/api/inbox/threads/:threadId/messages", requireAuth, async (req, res, next) => {
  try {
    const { threadId } = req.params;
    const text = String(req.body?.text || "").trim();
    if (!text) return res.status(400).json({ error: "VALIDATION_ERROR", message: "text required" });

    const { data: thread, error: thErr } = await supabase
      .from(T_INBOX_THREADS)
      .select("*")
      .eq("id", threadId)
      .maybeSingle();
    if (thErr) throw thErr;
    if (!thread) return res.status(404).json({ error: "THREAD_NOT_FOUND" });

    if (!isGlobalAdmin(req.auth.role)) {
      const role = await getWorkspaceMemberRole(req.auth.userId, thread.workspace_id);
      if (!role) return res.status(403).json({ error: "WORKSPACE_FORBIDDEN" });
    }

    const external_message_id = `local_${Date.now()}`;
    const sentAt = new Date().toISOString();

    const { data: msgRow, error: msgErr } = await supabase
      .from(T_INBOX_MESSAGES)
      .insert([
        {
          workspace_id: thread.workspace_id,
          thread_id: thread.id,
          channel_id: thread.channel_id,
          provider: thread.provider,
          platform: thread.platform,
          external_message_id,
          direction: "outbound",
          sender_external_id: req.auth.userId,
          sender_name: req.auth.email,
          message_type: "text",
          text,
          sent_at: sentAt,
          meta: { local_only: true },
        },
      ])
      .select("*")
      .single();
    if (msgErr) throw msgErr;

    let sendResult = null;
    let sendError = null;

    try {
      const provider = String(thread.provider || "");
      const platform = String(thread.platform || "");
      const recipientId = String(thread.participant_external_id || "");

      if (provider === "meta" && platform === "facebook") {
        const { data: ch, error: chErr } = await supabase
          .from(T_CHANNELS)
          .select("external_id")
          .eq("id", thread.channel_id)
          .maybeSingle();
        if (chErr) throw chErr;

        const pageId = String(ch?.external_id || "");
        const pageToken = await getPageTokenFromDB({ workspaceId: thread.workspace_id, pageId });

        if (!pageToken) throw new Error("Missing page token for sending");
        if (!recipientId) throw new Error("Missing recipient PSID (participant_external_id)");

        sendResult = await sendFacebookPageMessage({ pageToken, recipientId, text });
      }

      if (provider === "meta" && platform === "instagram") {
        const { data: ch, error: chErr } = await supabase
          .from(T_CHANNELS)
          .select("external_id")
          .eq("id", thread.channel_id)
          .maybeSingle();
        if (chErr) throw chErr;

        const igUserId = String(ch?.external_id || "");
        const igToken = await getTokenFromDB({
          workspaceId: thread.workspace_id,
          externalId: igUserId,
          token_type: "page",
        });

        if (!igToken) throw new Error("Missing IG token for sending");
        if (!recipientId) throw new Error("Missing IG recipient id (participant_external_id)");

        sendResult = await sendInstagramMessage({
          igUserId,
          token: igToken,
          recipientId,
          text,
        });
      }
    } catch (e) {
      sendError = { message: e?.message || "Send failed", meta: e?.meta || null };
      console.warn("SEND ERROR:", sendError);
    }

    const { error: upErr } = await supabase
      .from(T_INBOX_THREADS)
      .update({
        last_message_at: sentAt,
        last_message_snippet: text.slice(0, 200),
        updated_at: new Date().toISOString(),
      })
      .eq("id", thread.id);
    if (upErr) throw upErr;

    if (sendResult) {
      await supabase
        .from(T_INBOX_MESSAGES)
        .update({ meta: { local_only: false, send: sendResult } })
        .eq("id", msgRow.id);
    } else if (sendError) {
      await supabase
        .from(T_INBOX_MESSAGES)
        .update({ meta: { local_only: true, send_error: sendError } })
        .eq("id", msgRow.id);
    }

    res.json({
      ok: true,
      message: { ...msgRow, meta: sendResult ? { local_only: false } : msgRow.meta },
      sendResult,
      sendError,
    });
  } catch (e) {
    next(e);
  }
});

/**
 * ✅ SYNC META INBOX (FB + IG)
 * POST /api/workspaces/:workspaceId/inbox/sync/meta
 */
app.post(
  "/api/workspaces/:workspaceId/inbox/sync/meta",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const provider = providerMeta();

      const igErrors = [];

      // ---------- FB Pages ----------
      const { data: fbPages, error: fbErr } = await supabase
        .from(T_CHANNELS)
        .select("id,external_id,display_name,platform,provider,status,meta")
        .eq("workspace_id", workspaceId)
        .eq("provider", provider)
        .eq("platform", "facebook")
        .eq("status", CHANNEL_STATUS_CONNECTED);

      if (fbErr) throw fbErr;

      let threadsUpserted = 0;
      let messagesUpserted = 0;

      for (const ch of fbPages || []) {
        const pageId = String(ch.external_id);
        const pageToken = await getPageTokenFromDB({ workspaceId, pageId });
        if (!pageToken) continue;

        const convos = await fetchAllPageConversations({
          pageId,
          pageToken,
          maxConvos: 500,
        });

        for (const c of convos) {
          const externalThreadId = String(c.id);
          const updated = c.updated_time
            ? new Date(c.updated_time).toISOString()
            : new Date().toISOString();
          const snippet = String(c.snippet || "").slice(0, 200);

          const participants = c?.participants?.data || [];
          const other = participants?.[0] || null;

          const participantExternalId = other?.id ? String(other.id) : null;
          const participantName = other?.name ? String(other.name) : "Messenger User";

          const { data: threadRow, error: thUpErr } = await supabase
            .from(T_INBOX_THREADS)
            .upsert(
              [
                {
                  workspace_id: workspaceId,
                  provider,
                  platform: "facebook",
                  channel_id: ch.id,
                  external_thread_id: externalThreadId,
                  participant_external_id: participantExternalId,
                  participant_name: participantName,
                  participant_username: null,
                  last_message_at: updated,
                  last_message_snippet: snippet,
                  status: "open",
                  unread_count: 0,
                  updated_at: new Date().toISOString(),
                },
              ],
              { onConflict: "workspace_id,provider,platform,channel_id,external_thread_id" }
            )
            .select("*")
            .single();

          if (thUpErr) throw thUpErr;
          threadsUpserted += 1;

          const msgs = await fetchAllConversationMessages({
            conversationId: externalThreadId,
            pageToken,
            maxMsgs: 500,
          });

          for (const m of msgs || []) {
            const mid = String(m.id);
            const created = m.created_time
              ? new Date(m.created_time).toISOString()
              : new Date().toISOString();

            const fromId = m?.from?.id ? String(m.from.id) : null;
            const fromName = m?.from?.name ? String(m.from.name) : null;
            const text = String(m.message || "").trim();

            const direction = "inbound";

            const { error: msgUpErr } = await supabase
              .from(T_INBOX_MESSAGES)
              .upsert(
                [
                  {
                    workspace_id: workspaceId,
                    thread_id: threadRow.id,
                    channel_id: ch.id,
                    provider,
                    platform: "facebook",
                    external_message_id: mid,
                    direction,
                    sender_external_id: fromId,
                    sender_name: fromName,
                    message_type: "text",
                    text,
                    sent_at: created,
                    meta: {},
                  },
                ],
                { onConflict: "workspace_id,thread_id,external_message_id" }
              );

            if (msgUpErr) throw msgUpErr;
            messagesUpserted += 1;
          }
        }
      }

      // ---------- Instagram ----------
      const { data: igAccounts, error: igErr } = await supabase
        .from(T_CHANNELS)
        .select("id,external_id,display_name,platform,provider,status,meta")
        .eq("workspace_id", workspaceId)
        .eq("provider", provider)
        .eq("platform", "instagram")
        .eq("status", CHANNEL_STATUS_CONNECTED);

      if (igErr) throw igErr;

      let igThreadsUpserted = 0;
      let igMessagesUpserted = 0;

      for (const igCh of igAccounts || []) {
        const igUserId = String(igCh.external_id);

        const igToken = await getTokenFromDB({
          workspaceId,
          externalId: igUserId,
          token_type: "page",
        });

        if (!igToken) continue;

        let convos = [];
        try {
          convos = await fetchAllIgConversations({ igUserId, token: igToken, maxConvos: 200 });
        } catch (e) {
          const code = e?.meta?.code || e?.meta?.error?.code || null;
          console.warn("IG CONVO FETCH FAILED:", e?.message, e?.meta || "");

          igErrors.push({
            igUserId,
            message: e?.message || "IG conversations fetch failed",
            meta: e?.meta || null,
            hint:
              Number(code) === 3
                ? "Meta app lacks Instagram Messaging capability (needs product setup + app review/permissions)."
                : "Check token scopes + app mode + IG professional account + permissions.",
          });

          continue;
        }

        for (const c of convos || []) {
          const externalThreadId = String(c.id);
          const updated = c.updated_time
            ? new Date(c.updated_time).toISOString()
            : new Date().toISOString();

          const participants = c?.participants?.data || [];
          const other = participants?.[0] || null;

          const participantExternalId = other?.id ? String(other.id) : null;
          const participantName =
            other?.username || other?.name ? String(other.username || other.name) : "IG User";

          const { data: threadRow, error: thUpErr } = await supabase
            .from(T_INBOX_THREADS)
            .upsert(
              [
                {
                  workspace_id: workspaceId,
                  provider,
                  platform: "instagram",
                  channel_id: igCh.id,
                  external_thread_id: externalThreadId,
                  participant_external_id: participantExternalId,
                  participant_name: participantName,
                  participant_username: other?.username ? String(other.username) : null,
                  last_message_at: updated,
                  last_message_snippet: "",
                  status: "open",
                  unread_count: 0,
                  updated_at: new Date().toISOString(),
                },
              ],
              { onConflict: "workspace_id,provider,platform,channel_id,external_thread_id" }
            )
            .select("*")
            .single();

          if (thUpErr) throw thUpErr;
          igThreadsUpserted += 1;

          let msgs = [];
          try {
            msgs = await fetchAllIgMessages({
              conversationId: externalThreadId,
              token: igToken,
              maxMsgs: 200,
            });
          } catch (e) {
            console.warn("IG MSG FETCH FAILED:", e?.message, e?.meta || "");
            igErrors.push({
              igUserId,
              conversationId: externalThreadId,
              message: e?.message || "IG messages fetch failed",
              meta: e?.meta || null,
            });
            continue;
          }

          const latest = (msgs || [])[0] || null;

          for (const m of msgs || []) {
            const mid = String(m.id);
            const created = m.created_time
              ? new Date(m.created_time).toISOString()
              : new Date().toISOString();

            const fromId = m?.from?.id ? String(m.from.id) : null;
            const fromName =
              m?.from?.username || m?.from?.name ? String(m.from.username || m.from.name) : null;
            const text = String(m.message || "").trim();

            const direction = "inbound";

            const { error: msgUpErr } = await supabase
              .from(T_INBOX_MESSAGES)
              .upsert(
                [
                  {
                    workspace_id: workspaceId,
                    thread_id: threadRow.id,
                    channel_id: igCh.id,
                    provider,
                    platform: "instagram",
                    external_message_id: mid,
                    direction,
                    sender_external_id: fromId,
                    sender_name: fromName,
                    message_type: "text",
                    text,
                    sent_at: created,
                    meta: {},
                  },
                ],
                { onConflict: "workspace_id,thread_id,external_message_id" }
              );

            if (msgUpErr) throw msgUpErr;
            igMessagesUpserted += 1;
          }

          if (latest?.message) {
            await supabase
              .from(T_INBOX_THREADS)
              .update({
                last_message_snippet: String(latest.message || "").slice(0, 200),
                updated_at: new Date().toISOString(),
              })
              .eq("id", threadRow.id);
          }
        }
      }

      return res.json({
        ok: true,
        threads_upserted: threadsUpserted,
        messages_upserted: messagesUpserted,
        ig_threads_upserted: igThreadsUpserted,
        ig_messages_upserted: igMessagesUpserted,
        ig_errors: igErrors,
      });
    } catch (e) {
      console.error("SYNC ERROR:", e?.message, e?.meta || "");
      const msg = e?.message || "Sync failed";
      const meta = e?.meta || null;
      return res.status(400).json({ error: "SYNC_FAILED", message: msg, meta });
    }
  }
);

/* ---------------- 404 for /api ---------------- */
app.use("/api", (req, res) => {
  return res.status(404).json({
    error: "NOT_FOUND",
    message: `No route: ${req.method} ${req.originalUrl}`,
  });
});

/* ---------------- Error handler ---------------- */
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    error: "SERVER_ERROR",
    message: err.message || "Something went wrong",
  });
});

/* ---------------- Start ---------------- */
export default app;
export { ensureDevUsers };
