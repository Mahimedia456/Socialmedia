// backend/routes/tiktok.routes.js
import express from "express";
import {
  providerTikTok,
  parseTikTokStateSafe,
  tiktokTokenExchange,
  tiktokGetUserInfo,
  tiktokListVideos,
} from "../services/tiktok.service.js";

export default function createTikTokRouter({
  requireAuth,
  isGlobalAdmin,
  getWorkspaceMemberRole,
  supabase,
  tables,
  channelStatusConnected,
}) {
  const router = express.Router();

  const { T_CHANNELS, T_CHANNEL_TOKENS } = tables;

  async function getWorkspaceChannel({ workspaceId, channelId }) {
    const { data, error } = await supabase
      .from(T_CHANNELS)
      .select("id,workspace_id,provider,platform,external_id,display_name,meta,status,updated_at")
      .eq("workspace_id", workspaceId)
      .eq("id", channelId)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  }

  async function getChannelToken({
    workspaceId,
    externalId,
    tokenType = "access",
    provider = providerTikTok(),
  }) {
    const { data, error } = await supabase
      .from(T_CHANNEL_TOKENS)
      .select("access_token,expires_at")
      .eq("workspace_id", workspaceId)
      .eq("provider", provider)
      .eq("external_id", externalId)
      .eq("token_type", tokenType)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  }

  router.post("/exchange", requireAuth, async (req, res, next) => {
    try {
      const code = String(req.body?.code || "").trim();
      const stateRaw = String(req.body?.state || "").trim();
      let workspaceId = String(req.body?.workspaceId || "").trim();

      if (!code) {
        return res.status(400).json({
          error: "VALIDATION_ERROR",
          message: "code is required",
        });
      }

      if (!workspaceId && stateRaw) {
        const parsed = parseTikTokStateSafe(stateRaw);
        workspaceId = String(parsed?.workspaceId || "").trim();
      }

      if (!workspaceId) {
        return res.status(400).json({
          error: "VALIDATION_ERROR",
          message: "workspaceId missing in body/state",
        });
      }

      if (!isGlobalAdmin(req.auth.role)) {
        const role = await getWorkspaceMemberRole(req.auth.userId, workspaceId);
        if (!role) {
          return res.status(403).json({ error: "WORKSPACE_FORBIDDEN" });
        }
      }

      const tokenData = await tiktokTokenExchange({ code });

      const accessToken = String(tokenData?.access_token || "").trim();
      const refreshToken = String(tokenData?.refresh_token || "").trim();
      const expiresIn = Number(tokenData?.expires_in || 0);
      const refreshExpiresIn = Number(tokenData?.refresh_expires_in || 0);
      const openIdFromToken = String(tokenData?.open_id || "").trim();
      const scope = String(tokenData?.scope || "").trim();

      let user = null;
      try {
        user = await tiktokGetUserInfo({ accessToken });
      } catch (userErr) {
        console.warn("TIKTOK USER INFO FAILED:", {
          message: userErr?.message || "Unknown user info error",
          meta: userErr?.meta || null,
        });

        if (!openIdFromToken) {
          throw userErr;
        }
      }

      const externalId = String(user?.open_id || openIdFromToken || "").trim();
      if (!externalId) {
        return res.status(400).json({
          error: "TIKTOK_OPEN_ID_MISSING",
          message: "TikTok did not return open_id",
          meta: { tokenData, user },
        });
      }

      const displayName = String(user?.display_name || "TikTok Account").trim();

      const provider = providerTikTok();
      const nowIso = new Date().toISOString();

      const accessExpiresAt = expiresIn
        ? new Date(Date.now() + expiresIn * 1000).toISOString()
        : null;

      const refreshExpiresAt = refreshExpiresIn
        ? new Date(Date.now() + refreshExpiresIn * 1000).toISOString()
        : null;

      const channelPayload = {
        workspace_id: workspaceId,
        provider,
        platform: "tiktok",
        display_name: displayName || "TikTok Account",
        external_id: externalId,
        status: channelStatusConnected,
        meta: {
          type: "tiktok_account",
          open_id: externalId,
          union_id: user?.union_id || null,
          avatar_url: user?.avatar_url || null,
          scope: scope || null,
          raw_user: user || null,
        },
        updated_at: nowIso,
      };

      const { data: upsertedChannel, error: chErr } = await supabase
        .from(T_CHANNELS)
        .upsert([channelPayload], {
          onConflict: "workspace_id,provider,platform,external_id",
        })
        .select("*")
        .maybeSingle();

      if (chErr) {
        chErr.message = `workspace_channels upsert failed: ${chErr.message}`;
        throw chErr;
      }

      const tokenRows = [
        {
          workspace_id: workspaceId,
          provider,
          external_id: externalId,
          token_type: "access",
          access_token: accessToken,
          expires_at: accessExpiresAt,
          updated_at: nowIso,
        },
      ];

      if (refreshToken) {
        tokenRows.push({
          workspace_id: workspaceId,
          provider,
          external_id: externalId,
          token_type: "refresh",
          access_token: refreshToken,
          expires_at: refreshExpiresAt,
          updated_at: nowIso,
        });
      }

      const { error: tokErr } = await supabase
        .from(T_CHANNEL_TOKENS)
        .upsert(tokenRows, {
          onConflict: "workspace_id,provider,external_id,token_type",
        });

      if (tokErr) {
        tokErr.message = `channel_tokens upsert failed: ${tokErr.message}`;
        throw tokErr;
      }

      return res.json({
        ok: true,
        workspaceId,
        provider,
        platform: "tiktok",
        channel: {
          id: upsertedChannel?.id || null,
          display_name: displayName,
          external_id: externalId,
          avatar_url: user?.avatar_url || "",
        },
        user: user || null,
        scope: scope || null,
        expires_in: expiresIn || null,
      });
    } catch (e) {
      console.error("TIKTOK EXCHANGE ERROR:", {
        message: e?.message || "Unknown TikTok exchange error",
        meta: e?.meta || null,
        details: e?.details || null,
        hint: e?.hint || null,
        code: e?.code || null,
        stack: e?.stack || null,
      });
      next(e);
    }
  });

  router.get("/workspaces/:workspaceId/feeds", requireAuth, async (req, res, next) => {
    try {
      const { workspaceId } = req.params;
      const channelId = String(req.query.channel_id || "").trim();
      const cursor = Number(req.query.cursor || 0);
      const maxCount = Math.min(20, Math.max(1, Number(req.query.limit || 10)));

      if (!channelId) {
        return res.status(400).json({
          error: "VALIDATION_ERROR",
          message: "channel_id is required",
        });
      }

      if (!isGlobalAdmin(req.auth.role)) {
        const role = await getWorkspaceMemberRole(req.auth.userId, workspaceId);
        if (!role) {
          return res.status(403).json({ error: "WORKSPACE_FORBIDDEN" });
        }
      }

      const channel = await getWorkspaceChannel({ workspaceId, channelId });
      if (!channel) {
        return res.status(404).json({ error: "CHANNEL_NOT_FOUND" });
      }

      if (
        String(channel.provider) !== "tiktok" ||
        String(channel.platform) !== "tiktok"
      ) {
        return res.status(400).json({
          error: "INVALID_CHANNEL",
          message: "Not a TikTok channel",
        });
      }

      if (
        String(channel.status || "").toLowerCase() !==
        String(channelStatusConnected).toLowerCase()
      ) {
        return res.status(400).json({
          error: "CHANNEL_NOT_CONNECTED",
          message: "TikTok channel is not connected",
        });
      }

      const tokenRow = await getChannelToken({
        workspaceId,
        externalId: String(channel.external_id),
        tokenType: "access",
      });

      const accessToken = String(tokenRow?.access_token || "").trim();
      if (!accessToken) {
        return res.status(400).json({
          error: "MISSING_TOKEN",
          message: "Missing TikTok access token",
        });
      }

      const feed = await tiktokListVideos({
        accessToken,
        cursor,
        maxCount,
      });

      const videos = (feed.videos || []).map((v) => ({
        id: v.id || "",
        title: v.title || "",
        caption: v.video_description || v.title || "",
        create_time: v.create_time || null,
        duration: Number(v.duration || 0),
        width: Number(v.width || 0),
        height: Number(v.height || 0),
        cover_image_url: v.cover_image_url || "",
        share_url: v.share_url || "",
        embed_html: v.embed_html || "",
        embed_link: v.embed_link || "",
        metrics: {
          likes: Number(v.like_count || 0),
          comments: Number(v.comment_count || 0),
          shares: Number(v.share_count || 0),
          views: Number(v.view_count || 0),
        },
        raw: v,
      }));

      return res.json({
        ok: true,
        channel: {
          id: channel.id,
          display_name: channel.display_name,
          external_id: channel.external_id,
          avatar_url: channel?.meta?.avatar_url || "",
        },
        data: videos,
        paging: {
          cursor: feed.cursor,
          has_more: !!feed.has_more,
          next_cursor: feed.has_more ? feed.cursor : null,
        },
      });
    } catch (e) {
      console.error("TIKTOK FEED ERROR:", {
        message: e?.message || "Unknown TikTok feed error",
        meta: e?.meta || null,
        details: e?.details || null,
        hint: e?.hint || null,
        code: e?.code || null,
      });
      next(e);
    }
  });

  return router;
}