// backend/routes/feeds.routes.js
import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { requireAuth, requireWorkspaceAccess } from "../middleware/auth_.js";
import { env } from "../config/env.js";

const router = Router();

const T_CHANNELS = "workspace_channels";
const T_CHANNEL_TOKENS = "channel_tokens";

const CHANNEL_STATUS_CONNECTED = env.CHANNEL_STATUS_CONNECTED || "connected";

async function metaGet(url) {
  const r = await fetch(url);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(j?.error?.message || "Meta request failed");
    e.meta = j?.error || j;
    throw e;
  }
  return j;
}

async function metaPostForm(url, formObj) {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(formObj || {})) {
    if (v === undefined || v === null) continue;
    body.set(k, String(v));
  }

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(j?.error?.message || "Meta POST failed");
    e.meta = j?.error || j;
    throw e;
  }
  return j;
}

async function getTokenFromDB({ workspaceId, externalId, token_type }) {
  const { data, error } = await supabase
    .from(T_CHANNEL_TOKENS)
    .select("access_token")
    .eq("workspace_id", workspaceId)
    .eq("provider", "meta")
    .eq("external_id", externalId)
    .eq("token_type", token_type)
    .maybeSingle();
  if (error) throw error;
  return data?.access_token || "";
}

async function getChannelById({ workspaceId, channelId }) {
  const { data, error } = await supabase
    .from(T_CHANNELS)
    .select("id,workspace_id,provider,platform,external_id,display_name,meta,status")
    .eq("workspace_id", workspaceId)
    .eq("id", channelId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

/* ---------------- Facebook Page feed ---------------- */
router.get(
  "/workspaces/:workspaceId/feeds/facebook",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res, next) => {
    try {
      const { workspaceId } = req.params;

      const page_channel_id = String(req.query.page_channel_id || "");
      const limit = Math.min(50, Math.max(1, Number(req.query.limit || 25)));
      const after = String(req.query.after || "");

      if (!page_channel_id) {
        return res.status(400).json({ error: "VALIDATION_ERROR", message: "page_channel_id is required" });
      }

      const ch = await getChannelById({ workspaceId, channelId: page_channel_id });
      if (!ch) return res.status(404).json({ error: "CHANNEL_NOT_FOUND" });

      if (ch.provider !== "meta" || ch.platform !== "facebook" || ch.status !== CHANNEL_STATUS_CONNECTED) {
        return res.status(400).json({ error: "INVALID_CHANNEL", message: "Not a connected Facebook channel" });
      }

      const pageId = String(ch.external_id);
      const pageToken = await getTokenFromDB({ workspaceId, externalId: pageId, token_type: "page" });
      if (!pageToken) return res.status(400).json({ error: "MISSING_TOKEN", message: "Missing page token" });

      const url = new URL(`https://graph.facebook.com/${env.META_GRAPH_VERSION}/${pageId}/feed`);
      url.searchParams.set(
        "fields",
        [
          "id",
          "message",
          "story",
          "created_time",
          "permalink_url",
          "full_picture",
          "attachments{media_type,media,url,title,description}",
          "likes.summary(true).limit(0)",
          "comments.summary(true).limit(5){id,message,from,created_time,comment_count}",
        ].join(",")
      );
      url.searchParams.set("limit", String(limit));
      if (after) url.searchParams.set("after", after);
      url.searchParams.set("access_token", pageToken);

      const j = await metaGet(url.toString());
      return res.json({
        ok: true,
        channel: { id: ch.id, display_name: ch.display_name, external_id: pageId },
        data: j?.data || [],
        paging: j?.paging || null,
      });
    } catch (e) {
      next(e);
    }
  }
);

/* ---------------- Facebook: Fetch comments for a post ----------------
   GET /workspaces/:workspaceId/feeds/facebook/comments?page_channel_id=...&post_id=...&limit=50&after=...
*/
router.get(
  "/workspaces/:workspaceId/feeds/facebook/comments",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res, next) => {
    try {
      const { workspaceId } = req.params;

      const page_channel_id = String(req.query.page_channel_id || "");
      const post_id = String(req.query.post_id || "");
      const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
      const after = String(req.query.after || "");

      if (!page_channel_id) return res.status(400).json({ error: "VALIDATION_ERROR", message: "page_channel_id is required" });
      if (!post_id) return res.status(400).json({ error: "VALIDATION_ERROR", message: "post_id is required" });

      const ch = await getChannelById({ workspaceId, channelId: page_channel_id });
      if (!ch) return res.status(404).json({ error: "CHANNEL_NOT_FOUND" });

      if (ch.provider !== "meta" || ch.platform !== "facebook" || ch.status !== CHANNEL_STATUS_CONNECTED) {
        return res.status(400).json({ error: "INVALID_CHANNEL", message: "Not a connected Facebook channel" });
      }

      const pageId = String(ch.external_id);
      const pageToken = await getTokenFromDB({ workspaceId, externalId: pageId, token_type: "page" });
      if (!pageToken) return res.status(400).json({ error: "MISSING_TOKEN", message: "Missing page token" });

      const url = new URL(`https://graph.facebook.com/${env.META_GRAPH_VERSION}/${post_id}/comments`);
      url.searchParams.set(
        "fields",
        ["id", "message", "from", "created_time", "comment_count", "like_count", "user_likes", "parent"].join(",")
      );
      url.searchParams.set("limit", String(limit));
      if (after) url.searchParams.set("after", after);
      url.searchParams.set("access_token", pageToken);

      const j = await metaGet(url.toString());
      return res.json({ ok: true, post_id, data: j?.data || [], paging: j?.paging || null });
    } catch (e) {
      next(e);
    }
  }
);

/* ---------------- Facebook: Reply to a comment ----------------
   POST /workspaces/:workspaceId/feeds/facebook/comments/reply
   body: { page_channel_id, comment_id, message }
*/
router.post(
  "/workspaces/:workspaceId/feeds/facebook/comments/reply",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res, next) => {
    try {
      const { workspaceId } = req.params;

      const page_channel_id = String(req.body?.page_channel_id || "");
      const comment_id = String(req.body?.comment_id || "");
      const message = String(req.body?.message || "").trim();

      if (!page_channel_id) return res.status(400).json({ error: "VALIDATION_ERROR", message: "page_channel_id is required" });
      if (!comment_id) return res.status(400).json({ error: "VALIDATION_ERROR", message: "comment_id is required" });
      if (!message) return res.status(400).json({ error: "VALIDATION_ERROR", message: "message is required" });

      const ch = await getChannelById({ workspaceId, channelId: page_channel_id });
      if (!ch) return res.status(404).json({ error: "CHANNEL_NOT_FOUND" });

      if (ch.provider !== "meta" || ch.platform !== "facebook" || ch.status !== CHANNEL_STATUS_CONNECTED) {
        return res.status(400).json({ error: "INVALID_CHANNEL", message: "Not a connected Facebook channel" });
      }

      const pageId = String(ch.external_id);
      const pageToken = await getTokenFromDB({ workspaceId, externalId: pageId, token_type: "page" });
      if (!pageToken) return res.status(400).json({ error: "MISSING_TOKEN", message: "Missing page token" });

      const url = `https://graph.facebook.com/${env.META_GRAPH_VERSION}/${comment_id}/comments`;

      const j = await metaPostForm(url, { access_token: pageToken, message });
      return res.json({ ok: true, result: j });
    } catch (e) {
      next(e);
    }
  }
);

/* ---------------- Facebook: Like a post ----------------
   POST /workspaces/:workspaceId/feeds/facebook/like
   body: { page_channel_id, post_id }
*/
router.post(
  "/workspaces/:workspaceId/feeds/facebook/like",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res, next) => {
    try {
      const { workspaceId } = req.params;

      const page_channel_id = String(req.body?.page_channel_id || "");
      const post_id = String(req.body?.post_id || "");

      if (!page_channel_id) return res.status(400).json({ error: "VALIDATION_ERROR", message: "page_channel_id is required" });
      if (!post_id) return res.status(400).json({ error: "VALIDATION_ERROR", message: "post_id is required" });

      const ch = await getChannelById({ workspaceId, channelId: page_channel_id });
      if (!ch) return res.status(404).json({ error: "CHANNEL_NOT_FOUND" });

      if (ch.provider !== "meta" || ch.platform !== "facebook" || ch.status !== CHANNEL_STATUS_CONNECTED) {
        return res.status(400).json({ error: "INVALID_CHANNEL", message: "Not a connected Facebook channel" });
      }

      const pageId = String(ch.external_id);
      const pageToken = await getTokenFromDB({ workspaceId, externalId: pageId, token_type: "page" });
      if (!pageToken) return res.status(400).json({ error: "MISSING_TOKEN", message: "Missing page token" });

      const url = `https://graph.facebook.com/${env.META_GRAPH_VERSION}/${post_id}/likes`;
      const j = await metaPostForm(url, { access_token: pageToken });
      return res.json({ ok: true, result: j });
    } catch (e) {
      next(e);
    }
  }
);

/* ---------------- Facebook: Comment on a post ----------------
   POST /workspaces/:workspaceId/feeds/facebook/comment
   body: { page_channel_id, post_id, message }
*/
router.post(
  "/workspaces/:workspaceId/feeds/facebook/comment",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res, next) => {
    try {
      const { workspaceId } = req.params;

      const page_channel_id = String(req.body?.page_channel_id || "");
      const post_id = String(req.body?.post_id || "");
      const message = String(req.body?.message || "").trim();

      if (!page_channel_id) return res.status(400).json({ error: "VALIDATION_ERROR", message: "page_channel_id is required" });
      if (!post_id) return res.status(400).json({ error: "VALIDATION_ERROR", message: "post_id is required" });
      if (!message) return res.status(400).json({ error: "VALIDATION_ERROR", message: "message is required" });

      const ch = await getChannelById({ workspaceId, channelId: page_channel_id });
      if (!ch) return res.status(404).json({ error: "CHANNEL_NOT_FOUND" });

      if (ch.provider !== "meta" || ch.platform !== "facebook" || ch.status !== CHANNEL_STATUS_CONNECTED) {
        return res.status(400).json({ error: "INVALID_CHANNEL", message: "Not a connected Facebook channel" });
      }

      const pageId = String(ch.external_id);
      const pageToken = await getTokenFromDB({ workspaceId, externalId: pageId, token_type: "page" });
      if (!pageToken) return res.status(400).json({ error: "MISSING_TOKEN", message: "Missing page token" });

      const url = `https://graph.facebook.com/${env.META_GRAPH_VERSION}/${post_id}/comments`;
      const j = await metaPostForm(url, { access_token: pageToken, message });
      return res.json({ ok: true, result: j });
    } catch (e) {
      next(e);
    }
  }
);

/* ---------------- Instagram media feed ---------------- */
router.get(
  "/workspaces/:workspaceId/feeds/instagram",
  requireAuth,
  requireWorkspaceAccess,
  async (req, res, next) => {
    try {
      const { workspaceId } = req.params;

      const ig_channel_id = String(req.query.ig_channel_id || "");
      const limit = Math.min(50, Math.max(1, Number(req.query.limit || 25)));
      const after = String(req.query.after || "");

      if (!ig_channel_id) return res.status(400).json({ error: "VALIDATION_ERROR", message: "ig_channel_id is required" });

      const ch = await getChannelById({ workspaceId, channelId: ig_channel_id });
      if (!ch) return res.status(404).json({ error: "CHANNEL_NOT_FOUND" });

      if (ch.provider !== "meta" || ch.platform !== "instagram" || ch.status !== CHANNEL_STATUS_CONNECTED) {
        return res.status(400).json({ error: "INVALID_CHANNEL", message: "Not a connected Instagram channel" });
      }

      // instagram channel external_id = page_id, ig user id in meta.ig_user_id
      const pageId = String(ch.external_id);
      const igUserId = String(ch?.meta?.ig_user_id || "");

      if (!igUserId) {
        return res.status(400).json({
          error: "IG_CONFIG_ERROR",
          message: "Instagram channel missing meta.ig_user_id. Reconnect channel.",
        });
      }

      const token = await getTokenFromDB({ workspaceId, externalId: pageId, token_type: "page" });
      if (!token) return res.status(400).json({ error: "MISSING_TOKEN", message: "Missing IG token (page token)" });

      const url = new URL(`https://graph.facebook.com/${env.META_GRAPH_VERSION}/${igUserId}/media`);
      url.searchParams.set(
        "fields",
        ["id", "caption", "media_type", "media_url", "thumbnail_url", "permalink", "timestamp", "username", "like_count", "comments_count"].join(",")
      );
      url.searchParams.set("limit", String(limit));
      if (after) url.searchParams.set("after", after);
      url.searchParams.set("access_token", token);

      const j = await metaGet(url.toString());
      return res.json({
        ok: true,
        channel: { id: ch.id, display_name: ch.display_name, external_id: pageId, ig_user_id: igUserId },
        data: j?.data || [],
        paging: j?.paging || null,
      });
    } catch (e) {
      next(e);
    }
  }
);

export default router;