// routes/health.routes.js
import { Router } from "express";
import { env } from "../config/env.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "auth-api",
    email_mode: env.EMAIL_MODE,
    meta_graph: env.META_GRAPH_VERSION,
    meta_webhook: !!env.META_VERIFY_TOKEN,
    inbox_storage: "memory+sse",
    publisher: true,
  });
});

export default router;