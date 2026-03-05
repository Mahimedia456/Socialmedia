// routes/channels.routes.js
import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { requireAuth, requireWorkspaceAccess } from "../middleware/auth_.js";
import { env } from "../config/env.js";

const router = Router();

const T_CHANNELS = "workspace_channels";

const CHANNEL_STATUS_CONNECTED = env.CHANNEL_STATUS_CONNECTED || "connected";
const CHANNEL_STATUS_DISCONNECTED = env.CHANNEL_STATUS_DISCONNECTED || "disconnected";

router.get("/workspaces/:workspaceId/channels", requireAuth, requireWorkspaceAccess, async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const provider = String(req.query?.provider || "").trim();

    let q = supabase
      .from(T_CHANNELS)
      .select("id,provider,platform,display_name,external_id,status,meta,updated_at")
      .eq("workspace_id", workspaceId)
      .order("updated_at", { ascending: false });

    if (provider) q = q.eq("provider", provider);

    const { data, error } = await q;
    if (error) throw error;

    res.json({ channels: data || [] });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/workspaces/:workspaceId/channels/:channelId/disconnect",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res, next) => {
    try {
      const { workspaceId, channelId } = req.params;
      const { error } = await supabase
        .from(T_CHANNELS)
        .update({ status: CHANNEL_STATUS_DISCONNECTED, updated_at: new Date().toISOString() })
        .eq("workspace_id", workspaceId)
        .eq("id", channelId);

      if (error) throw error;
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/workspaces/:workspaceId/channels/:channelId/connect",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res, next) => {
    try {
      const { workspaceId, channelId } = req.params;
      const { error } = await supabase
        .from(T_CHANNELS)
        .update({ status: CHANNEL_STATUS_CONNECTED, updated_at: new Date().toISOString() })
        .eq("workspace_id", workspaceId)
        .eq("id", channelId);

      if (error) throw error;
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  }
);

export default router;