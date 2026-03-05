// backend/routes/auth.routes.js
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { supabase } from "../config/supabase.js";
import { env } from "../config/env.js";
import { sendOtpEmail } from "../services/emailService.js";
import { ensureDevUsers } from "../services/devUsers.service.js";

const router = Router();

const T_USERS = "app_users";
const T_REFRESH = "refresh_tokens";
const T_OTP = "password_reset_otps";

function safeEmail(v) {
  const s = String(v || "").trim().toLowerCase();
  return s.includes("@") ? s : "";
}
function randomCode6() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
function signAccess(payload) {
  return jwt.sign(payload, env.ACCESS_SECRET, { expiresIn: "15m" });
}
function signRefresh(payload) {
  return jwt.sign(payload, env.REFRESH_SECRET, { expiresIn: "30d" });
}
function verifyRefresh(token) {
  return jwt.verify(token, env.REFRESH_SECRET);
}
function signReset(payload) {
  return jwt.sign(payload, env.RESET_SECRET, { expiresIn: "10m" });
}
function verifyReset(token) {
  return jwt.verify(token, env.RESET_SECRET);
}

async function getUserByEmail(email) {
  const { data, error } = await supabase.from(T_USERS).select("*").eq("email", email).maybeSingle();
  if (error) throw error;
  return data || null;
}
async function getUserById(id) {
  const { data, error } = await supabase.from(T_USERS).select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data || null;
}
async function setRefreshToken(userId, token) {
  const { error } = await supabase
    .from(T_REFRESH)
    .upsert([{ user_id: userId, token, updated_at: new Date().toISOString() }], { onConflict: "user_id" });
  if (error) throw error;
}
async function getRefreshToken(userId) {
  const { data, error } = await supabase.from(T_REFRESH).select("token").eq("user_id", userId).maybeSingle();
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
  const { data, error } = await supabase.from(T_OTP).select("*").eq("user_id", userId).maybeSingle();
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

/** DEV: seed users */
router.post("/dev/seed", async (req, res, next) => {
  try {
    await ensureDevUsers();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/** POST /api/auth/login */
router.post("/login", async (req, res, next) => {
  try {
    const email = safeEmail(req.body?.email);
    const password = String(req.body?.password || "");
    if (!email || !password) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "Email and password required." });
    }

    const user = await getUserByEmail(email);
    if (!user) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = signAccess(payload);
    const refresh_token = signRefresh(payload);

    await setRefreshToken(user.id, refresh_token);

    res.json({
      access_token,
      refresh_token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (e) {
    next(e);
  }
});

/** POST /api/auth/refresh-token */
router.post("/refresh-token", async (req, res) => {
  try {
    const token = String(req.body?.refresh_token || "");
    if (!token) return res.status(401).json({ error: "NO_REFRESH_TOKEN" });

    const decoded = verifyRefresh(token);
    const user = await getUserById(decoded.sub);
    if (!user) return res.status(401).json({ error: "INVALID_REFRESH_TOKEN" });

    const saved = await getRefreshToken(user.id);
    if (saved !== token) return res.status(401).json({ error: "REFRESH_REVOKED" });

    const access_token = signAccess({ sub: user.id, email: user.email, role: user.role });
    res.json({ access_token });
  } catch {
    res.status(401).json({ error: "INVALID_REFRESH_TOKEN" });
  }
});

/** POST /api/auth/logout */
router.post("/logout", async (req, res, next) => {
  try {
    const token = String(req.body?.refresh_token || "");
    if (token) {
      try {
        const decoded = verifyRefresh(token);
        await clearRefreshToken(decoded.sub);
      } catch {}
    }
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/** POST /api/auth/forgot-password */
router.post("/forgot-password", async (req, res, next) => {
  try {
    const email = safeEmail(req.body?.email);
    if (!email) return res.status(400).json({ error: "VALIDATION_ERROR", message: "Email required." });

    const user = await getUserByEmail(email);
    if (!user) return res.json({ ok: true }); // don't leak

    const code = randomCode6();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    await setOtp(user.id, code, expiresAt);

    await sendOtpEmail({ to: email, code });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/** POST /api/auth/verify-email */
router.post("/verify-email", async (req, res, next) => {
  try {
    const email = safeEmail(req.body?.email);
    const code = String(req.body?.code || "").trim();
    if (!email || code.length !== 6) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "Email and 6-digit code required." });
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
    res.json({ reset_token });
  } catch (e) {
    next(e);
  }
});

/** POST /api/auth/reset-password */
router.post("/reset-password", async (req, res, next) => {
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

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;