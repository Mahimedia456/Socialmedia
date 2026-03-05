// backend/app.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import workspacesRoutes from "./routes/workspaces.routes.js";
import channelsRoutes from "./routes/channels.routes.js";
import feedsRoutes from "./routes/feeds.routes.js";
import inboxRoutes from "./routes/inbox.routes.js";
import metaRoutes from "./routes/meta.routes.js";
import metaWebhookRoutes from "./routes/meta.webhook.routes.js";
import publisherRoutes from "./routes/publisher.routes.js";
import healthRoutes from "./routes/health.routes.js";

const app = express();
app.set("trust proxy", 1);

/* ============================
   CORS CONFIG (VERCEL + LOCAL)
   ============================ */

// Your “main” frontend production domain
const FRONTEND_PROD = "https://socialmedia-brown-five.vercel.app";

// Allow all Vercel preview domains for THIS project name
// e.g. https://socialmedia-brown-five-git-main-xxxx.vercel.app
// e.g. https://socialmedia-brown-five-xxxx.vercel.app
const FRONTEND_VERCEL_PREVIEW_RE = /^https:\/\/socialmedia-brown-five(-[a-z0-9-]+)?\.vercel\.app$/i;

const allowedExactOrigins = new Set([
  FRONTEND_PROD,
  "http://localhost:5173",
  "http://localhost:5174",
]);

function isAllowedOrigin(origin) {
  if (!origin) return true; // server-to-server, Postman, curl
  if (allowedExactOrigins.has(origin)) return true;
  if (FRONTEND_VERCEL_PREVIEW_RE.test(origin)) return true;
  return false;
}

const corsOptions = {
  origin: (origin, cb) => {
    if (isAllowedOrigin(origin)) return cb(null, true);

    // IMPORTANT:
    // returning false causes missing ACAO header (browser shows your exact error).
    // returning an Error is cleaner and easier to debug.
    console.warn("❌ CORS blocked origin:", origin);
    return cb(new Error(`CORS blocked for origin: ${origin}`), false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

// Apply CORS before everything
app.use(cors(corsOptions));
// Preflight for all routes
app.options("*", cors(corsOptions));

/* ============================
   SECURITY
   ============================ */
app.use(helmet());

/* ============================
   WEBHOOK RAW BODY
   (must be before json parser)
   ============================ */
// Your metaWebhookRoutes should internally use express.raw for webhook endpoints.
// Mount it BEFORE express.json.
app.use("/api", metaWebhookRoutes);

/* ============================
   BODY PARSERS
   ============================ */
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

/* ============================
   REQUEST LOGGER (optional)
   ============================ */
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

/* ============================
   ROUTES
   ============================ */
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);

// Base workspace routes: /api/workspaces and /api/workspaces/:workspaceId
app.use("/api/workspaces", workspacesRoutes);

// Workspace-scoped modules (they already include /workspaces/:workspaceId/... inside)
app.use("/api", channelsRoutes);
app.use("/api", feedsRoutes);
app.use("/api", inboxRoutes);
app.use("/api", metaRoutes);
app.use("/api", publisherRoutes);

/* ============================
   404 HANDLER
   ============================ */
app.use("/api", (req, res) => {
  res.status(404).json({
    error: "NOT_FOUND",
    message: `No route: ${req.method} ${req.originalUrl}`,
  });
});

/* ============================
   ERROR HANDLER
   ============================ */
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err?.message || err);

  // If the error is CORS-related, return 403 (clearer in logs)
  if (String(err?.message || "").toLowerCase().includes("cors blocked")) {
    return res.status(403).json({
      error: "CORS_BLOCKED",
      message: err.message,
      origin: req.headers.origin || null,
    });
  }

  res.status(err.status || 500).json({
    error: "SERVER_ERROR",
    message: err.message || "Unexpected error",
  });
});

export default app;