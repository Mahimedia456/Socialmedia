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

app.use(cors({ /* your config */ }));
app.use(helmet());

// ✅ webhooks must be BEFORE express.json (and router uses raw internally too)
app.use("/api", metaWebhookRoutes);

app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);

// workspacesRoutes uses router.get("/") and router.get("/:workspaceId")
app.use("/api/workspaces", workspacesRoutes);

// others contain full "/workspaces/:workspaceId/..." paths
app.use("/api", channelsRoutes);
app.use("/api", feedsRoutes);
app.use("/api", inboxRoutes);
app.use("/api", metaRoutes);
app.use("/api", publisherRoutes);

export default app;