// backend/app.js
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { corsMiddleware } from "./config/cors.js";

import authRoutes from "./routes/auth.routes.js";
import workspacesRoutes from "./routes/workspaces.routes.js";
import channelsRoutes from "./routes/channels.routes.js";
import feedsRoutes from "./routes/feeds.routes.js";
import inboxRoutes from "./routes/inbox.routes.js";
import metaRoutes from "./routes/meta.routes.js";
import metaWebhookRoutes from "./routes/meta.webhook.routes.js";
import publisherRoutes from "./routes/publisher.routes.js";
import healthRoutes from "./routes/health.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";

const app = express();
app.set("trust proxy", 1);

// CORS FIRST
app.use(corsMiddleware);
app.options("*", corsMiddleware);

app.use(helmet());

// webhook BEFORE json (as you already do)
app.use("/api", metaWebhookRoutes);

app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

// routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspacesRoutes);
app.use("/api", channelsRoutes);
app.use("/api", feedsRoutes);
app.use("/api", inboxRoutes);
app.use("/api", metaRoutes);
app.use("/api", publisherRoutes);
app.use("/api", analyticsRoutes);

export default app;