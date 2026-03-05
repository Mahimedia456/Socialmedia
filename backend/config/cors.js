// backend/config/cors.js
import cors from "cors";
import { env } from "./env.js";

// FRONTEND prod
const FRONTEND_PROD = "https://socialmedia-brown-five.vercel.app";

// allow vercel preview domains for your frontend project
const FRONTEND_VERCEL_PREVIEW_RE =
  /^https:\/\/socialmedia-brown-five(-[a-z0-9-]+)?\.vercel\.app$/i;

function parseOrigins(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(s => String(s).trim()).filter(Boolean);
  return String(v)
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}

const envOrigins = parseOrigins(env.CORS_ORIGINS);

const allowedExact = new Set([
  FRONTEND_PROD,
  "http://localhost:5173",
  "http://localhost:5174",
  ...envOrigins,
]);

function isAllowed(origin) {
  if (!origin) return true; // postman/curl/server-to-server
  if (allowedExact.has(origin)) return true;
  if (FRONTEND_VERCEL_PREVIEW_RE.test(origin)) return true;
  return false;
}

export const corsMiddleware = cors({
  origin: (origin, cb) => {
    if (isAllowed(origin)) return cb(null, true);

    console.warn("❌ CORS blocked:", origin);
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
});