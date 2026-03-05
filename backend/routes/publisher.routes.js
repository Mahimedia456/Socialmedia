// routes/publisher.routes.js
import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { requireAuth, requireWorkspaceAccess } from "../middleware/auth_.js";
import { publishPostNow } from "../services/publisher/publisherEngine.js";
import { env } from "../config/env.js";

const router = Router();

const T_SOCIAL_POSTS = "social_posts";
const T_SOCIAL_POST_TARGETS = "social_post_targets";
const T_CHANNELS = "workspace_channels";

const CHANNEL_STATUS_CONNECTED = env.CHANNEL_STATUS_CONNECTED || "connected";

router.get("/workspaces/:workspaceId/publisher/channels", requireAuth, requireWorkspaceAccess, async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const provider = String(req.query.provider || "meta");

    const { data, error } = await supabase
      .from(T_CHANNELS)
      .select("id,provider,platform,display_name,external_id,status,meta,updated_at")
      .eq("workspace_id", workspaceId)
      .eq("provider", provider)
      .eq("status", CHANNEL_STATUS_CONNECTED)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    const channels = (data || []).map((c) => ({
      ...c,
      capabilities:
        c.platform === "facebook"
          ? { text: true, link: true, image: true }
          : c.platform === "instagram"
          ? { text: false, link: false, image: true }
          : { text: false, link: false, image: false },
    }));

    res.json({ channels });
  } catch (e) {
    next(e);
  }
});

router.post("/workspaces/:workspaceId/publisher/posts", requireAuth, requireWorkspaceAccess, async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    const content_type = String(req.body?.content_type || "text");
    const text = String(req.body?.text || "");
    const link_url = String(req.body?.link_url || "");
    const media_urls = Array.isArray(req.body?.media_urls) ? req.body.media_urls : [];
    const selected_channel_ids = Array.isArray(req.body?.channel_ids) ? req.body.channel_ids : [];

    const action = String(req.body?.action || "draft"); // draft | scheduled | publish_now
    const scheduled_at = req.body?.scheduled_at ? new Date(req.body.scheduled_at).toISOString() : null;

    if (!selected_channel_ids.length) return res.status(400).json({ error: "VALIDATION_ERROR", message: "Select at least one channel." });
    if (!text && !link_url && !media_urls.length) return res.status(400).json({ error: "VALIDATION_ERROR", message: "Post content is empty." });

    let status = "draft";
    if (action === "scheduled") {
      if (!scheduled_at) return res.status(400).json({ error: "VALIDATION_ERROR", message: "scheduled_at required." });
      status = "scheduled";
    }
    if (action === "publish_now") status = "publishing";

    const { data: postRow, error: postErr } = await supabase
      .from(T_SOCIAL_POSTS)
      .insert([
        {
          workspace_id: workspaceId,
          created_by: req.auth.userId,
          status,
          content_type,
          text,
          link_url,
          media_urls,
          scheduled_at,
          meta: { ui: { action } },
        },
      ])
      .select("*")
      .maybeSingle();
    if (postErr) throw postErr;

    const { data: chans, error: chErr } = await supabase
      .from(T_CHANNELS)
      .select("id,workspace_id,provider,platform,external_id,display_name,meta,status")
      .eq("workspace_id", workspaceId)
      .in("id", selected_channel_ids);
    if (chErr) throw chErr;

    // NOTE:
    // If instagram channel external_id = page_id and ig user id in meta.ig_user_id,
    // store ig_user_id into target meta so publisherEngine can publish correctly.
    const targetRows = (chans || []).map((c) => ({
      post_id: postRow.id,
      workspace_id: workspaceId,
      channel_id: c.id,
      provider: c.provider,
      platform: c.platform,
      external_id: c.external_id, // facebook: page_id, instagram: page_id (after migration)
      status: action === "publish_now" ? "publishing" : "queued",
      meta: {
        channel_name: c.display_name,
        ...(c.platform === "instagram" ? { ig_user_id: c?.meta?.ig_user_id || null } : {}),
      },
    }));

    const { error: tErr } = await supabase.from(T_SOCIAL_POST_TARGETS).insert(targetRows);
    if (tErr) throw tErr;

    if (action === "publish_now") {
      const result = await publishPostNow({ workspaceId, postId: postRow.id });
      return res.json({ ok: true, post: result.post, targets: result.targets });
    }

    res.json({ ok: true, post: postRow });
  } catch (e) {
    next(e);
  }
});

router.get("/workspaces/:workspaceId/publisher/posts/drafts", requireAuth, requireWorkspaceAccess, async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { data, error } = await supabase
      .from(T_SOCIAL_POSTS)
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json({ posts: data || [] });
  } catch (e) {
    next(e);
  }
});

router.get("/workspaces/:workspaceId/publisher/posts/scheduled", requireAuth, requireWorkspaceAccess, async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { data, error } = await supabase
      .from(T_SOCIAL_POSTS)
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("status", "scheduled")
      .order("scheduled_at", { ascending: true })
      .limit(50);

    if (error) throw error;
    res.json({ posts: data || [] });
  } catch (e) {
    next(e);
  }
});

router.post("/workspaces/:workspaceId/publisher/posts/:postId/publish", requireAuth, requireWorkspaceAccess, async (req, res, next) => {
  try {
    const { workspaceId, postId } = req.params;
    const result = await publishPostNow({ workspaceId, postId });
    res.json({ ok: true, post: result.post, targets: result.targets });
  } catch (e) {
    next(e);
  }
});

export default router;