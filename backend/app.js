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

const allowedOrigins = [
  "https://socialmedia-brown-five.vercel.app",
  "https://socialmedia-backend-nu.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
];

const corsOptions = {
  origin: function (origin, callback) {
    // allow Postman or server requests
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn("CORS blocked origin:", origin);
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

/* IMPORTANT: allow preflight */
app.options("*", cors(corsOptions));

/* ============================
   SECURITY
   ============================ */

app.use(helmet());

/* ============================
   WEBHOOK RAW BODY
   (must be before json parser)
   ============================ */

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

/* workspace base routes */
app.use("/api/workspaces", workspacesRoutes);

/* workspace scoped modules */
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
  console.error("SERVER ERROR:", err);

  res.status(err.status || 500).json({
    error: "SERVER_ERROR",
    message: err.message || "Unexpected error",
  });
});

export default app;