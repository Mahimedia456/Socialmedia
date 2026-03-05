// backend/config/env.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Load backend/.env (NOT parent)
dotenv.config({ path: path.join(__dirname, "..", ".env") });

function reqEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name} in backend/.env`);
  return v;
}

export const env = {
  PORT: Number(process.env.PORT || 4000),

  CORS_ORIGINS: (process.env.CORS_ORIGINS || "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  ACCESS_SECRET: reqEnv("ACCESS_TOKEN_SECRET"),
  REFRESH_SECRET: reqEnv("REFRESH_TOKEN_SECRET"),
  RESET_SECRET: reqEnv("RESET_TOKEN_SECRET"),

  SUPABASE_URL: reqEnv("SUPABASE_URL"),
  SUPABASE_KEY:
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    reqEnv("SUPABASE_SECRET_KEY"),

  META_VERIFY_TOKEN:
    process.env.META_VERIFY_TOKEN ||
    process.env.META_WEBHOOK_VERIFY_TOKEN ||
    "",

  META_GRAPH_VERSION: process.env.META_GRAPH_VERSION || "v19.0",

  CHANNEL_STATUS_CONNECTED: process.env.CHANNEL_STATUS_CONNECTED || "connected",
  CHANNEL_STATUS_DISCONNECTED: process.env.CHANNEL_STATUS_DISCONNECTED || "disconnected",

  EMAIL_MODE: String(process.env.EMAIL_MODE || "dev").toLowerCase(),
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: Number(process.env.SMTP_PORT || 587),
  SMTP_SECURE: String(process.env.SMTP_SECURE || "false") === "true",
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  SMTP_FROM:
    process.env.SMTP_FROM ||
    "Mahimedia Solutions <no-reply@mahimediasolutions.com>",

  PUBLISHER_WORKER: String(process.env.PUBLISHER_WORKER || "true") === "true",
};