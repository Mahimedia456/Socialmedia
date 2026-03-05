import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { corsMiddleware } from "./config/cors.js";

/* ROUTES */
import authRoutes from "./routes/auth.routes.js";
import workspacesRoutes from "./routes/workspaces.routes.js";
import channelsRoutes from "./routes/channels.routes.js";
import feedsRoutes from "./routes/feeds.routes.js";
import inboxRoutes from "./routes/inbox.routes.js";
import metaRoutes from "./routes/meta.routes.js";
import metaWebhookRoutes from "./routes/meta.webhook.routes.js";
import publisherRoutes from "./routes/publisher.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import healthRoutes from "./routes/health.routes.js";

const app = express();

/* -------------------------------------------------- */
/* TRUST PROXY (needed for Vercel / Render / proxies) */
/* -------------------------------------------------- */

app.set("trust proxy", 1);

/* -------------------------------------------------- */
/* CORS (FIRST)                                       */
/* -------------------------------------------------- */

app.use(corsMiddleware);
app.options("*", corsMiddleware);

/* -------------------------------------------------- */
/* SECURITY                                           */
/* -------------------------------------------------- */

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

/* -------------------------------------------------- */
/* META WEBHOOK                                       */
/* Must run BEFORE express.json()                     */
/* -------------------------------------------------- */

app.use("/api", metaWebhookRoutes);

/* -------------------------------------------------- */
/* BODY PARSING                                       */
/* -------------------------------------------------- */

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* -------------------------------------------------- */
/* ROUTES                                             */
/* -------------------------------------------------- */

app.use("/api/health", healthRoutes);

app.use("/api/auth", authRoutes);

/* workspace routes contain / and /:workspaceId */
app.use("/api/workspaces", workspacesRoutes);

/* other modules include full paths internally */
app.use("/api", channelsRoutes);
app.use("/api", feedsRoutes);
app.use("/api", inboxRoutes);
app.use("/api", metaRoutes);
app.use("/api", publisherRoutes);
app.use("/api", analyticsRoutes);

/* -------------------------------------------------- */
/* 404 HANDLER                                        */
/* -------------------------------------------------- */

app.use((req, res) => {
  res.status(404).json({
    error: "NOT_FOUND",
    method: req.method,
    path: req.originalUrl,
  });
});

/* -------------------------------------------------- */
/* GLOBAL ERROR HANDLER                               */
/* -------------------------------------------------- */

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  res.status(err.status || 500).json({
    error: err.code || "SERVER_ERROR",
    message: err.message || "Unexpected server error",
  });
});

export default app;