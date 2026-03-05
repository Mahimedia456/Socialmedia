import express from "express";
import { metaAnalyticsController } from "../controllers/analytics.controller.js";

const router = express.Router();

router.get(
  "/workspaces/:workspaceId/analytics/meta",
  metaAnalyticsController
);

export default router;