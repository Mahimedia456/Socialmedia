// backend/routes/tiktok.publisher.routes.js
import express from "express";
import {
  providerTikTok,
  tiktokCreatorInfoQuery,
  tiktokDirectPostVideoFromUrl,
  tiktokDirectPostPhotoFromUrl,
  tiktokUploadPhotoDraftFromUrl,
  pickTikTokPrivacyLevel,
} from "../services/tiktok.publisher.service.js";

export default function createTikTokPublisherRouter({
  requireAuth,
  isGlobalAdmin,
  getWorkspaceMemberRole,
  supabase,
  tables,
}) {
  const router = express.Router();
  const { T_CHANNELS, T_CHANNEL_TOKENS } = tables;

  async function getWorkspaceChannel({ workspaceId, channelId }) {
    const { data, error } = await supabase
      .from(T_CHANNELS)
      .select(
        "id,workspace_id,provider,platform,external_id,display_name,meta,status"
      )
      .eq("workspace_id", workspaceId)
      .eq("id", channelId)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  }

  async function getChannelAccessToken({ workspaceId, externalId }) {
    const { data, error } = await supabase
      .from(T_CHANNEL_TOKENS)
      .select("access_token,expires_at")
      .eq("workspace_id", workspaceId)
      .eq("provider", providerTikTok())
      .eq("external_id", externalId)
      .eq("token_type", "access")
      .maybeSingle();

    if (error) throw error;
    return data?.access_token || "";
  }

  router.get(
    "/workspaces/:workspaceId/channels/:channelId/creator-info",
    requireAuth,
    async (req, res, next) => {
      try {
        const { workspaceId, channelId } = req.params;

        if (!isGlobalAdmin(req.auth.role)) {
          const role = await getWorkspaceMemberRole(
            req.auth.userId,
            workspaceId
          );
          if (!role) {
            return res.status(403).json({ error: "WORKSPACE_FORBIDDEN" });
          }
        }

        const channel = await getWorkspaceChannel({ workspaceId, channelId });
        if (!channel) {
          return res.status(404).json({ error: "CHANNEL_NOT_FOUND" });
        }

        if (channel.provider !== "tiktok" || channel.platform !== "tiktok") {
          return res.status(400).json({
            error: "INVALID_CHANNEL",
            message: "Not a TikTok channel",
          });
        }

        const accessToken = await getChannelAccessToken({
          workspaceId,
          externalId: String(channel.external_id),
        });

        if (!accessToken) {
          return res.status(400).json({
            error: "MISSING_TOKEN",
            message: "Missing TikTok access token",
          });
        }

        const creatorInfo = await tiktokCreatorInfoQuery({ accessToken });
        const privacyLevel = pickTikTokPrivacyLevel(creatorInfo);

        return res.json({
          ok: true,
          channel,
          creator_info: creatorInfo?.data || null,
          privacy_level: privacyLevel,
          raw: creatorInfo,
        });
      } catch (e) {
        next(e);
      }
    }
  );

  router.post(
    "/workspaces/:workspaceId/channels/:channelId/direct-post",
    requireAuth,
    async (req, res, next) => {
      try {
        const { workspaceId, channelId } = req.params;
        const mediaUrls = Array.isArray(req.body?.media_urls)
          ? req.body.media_urls
          : [];
        const text = String(req.body?.text || "");
        const mode = String(req.body?.mode || "direct").toLowerCase(); // direct | draft
        const mediaKind = String(req.body?.media_kind || "").toLowerCase();

        if (!isGlobalAdmin(req.auth.role)) {
          const role = await getWorkspaceMemberRole(
            req.auth.userId,
            workspaceId
          );
          if (!role) {
            return res.status(403).json({ error: "WORKSPACE_FORBIDDEN" });
          }
        }

        const channel = await getWorkspaceChannel({ workspaceId, channelId });
        if (!channel) {
          return res.status(404).json({ error: "CHANNEL_NOT_FOUND" });
        }

        if (channel.provider !== "tiktok" || channel.platform !== "tiktok") {
          return res.status(400).json({
            error: "INVALID_CHANNEL",
            message: "Not a TikTok channel",
          });
        }

        const accessToken = await getChannelAccessToken({
          workspaceId,
          externalId: String(channel.external_id),
        });

        if (!accessToken) {
          return res.status(400).json({
            error: "MISSING_TOKEN",
            message: "Missing TikTok access token",
          });
        }

        const creatorInfo = await tiktokCreatorInfoQuery({ accessToken });
        const privacyLevel = pickTikTokPrivacyLevel(creatorInfo);

        let result = null;

        if (mediaKind === "video") {
          const videoUrl = String(mediaUrls[0] || "").trim();

          if (!videoUrl) {
            return res.status(400).json({
              error: "VALIDATION_ERROR",
              message: "video media URL is required",
            });
          }

          result = await tiktokDirectPostVideoFromUrl({
            accessToken,
            videoUrl,
            title: text,
            privacyLevel,
            disableComment: false,
            disableDuet: false,
            disableStitch: false,
            coverTimestampMs: 1000,
          });
        } else if (mediaKind === "image") {
          if (!mediaUrls.length) {
            return res.status(400).json({
              error: "VALIDATION_ERROR",
              message: "image media URL is required",
            });
          }

          const photoUrls = mediaUrls
            .map((u) => String(u || "").trim())
            .filter(Boolean);

          if (!photoUrls.length) {
            return res.status(400).json({
              error: "VALIDATION_ERROR",
              message: "image media URL is required",
            });
          }

          if (mode === "draft") {
            result = await tiktokUploadPhotoDraftFromUrl({
              accessToken,
              photoUrls,
              title: text,
              description: text,
            });
          } else {
            result = await tiktokDirectPostPhotoFromUrl({
              accessToken,
              photoUrls,
              title: text,
              description: text,
              privacyLevel,
              disableComment: false,
              autoAddMusic: true,
            });
          }
        } else {
          return res.status(400).json({
            error: "VALIDATION_ERROR",
            message: "Unsupported media_kind for TikTok",
          });
        }

        return res.json({
          ok: true,
          channel: {
            id: channel.id,
            display_name: channel.display_name,
            external_id: channel.external_id,
          },
          privacy_level: privacyLevel,
          creator_info: creatorInfo?.data || null,
          result,
        });
      } catch (e) {
        next(e);
      }
    }
  );

  return router;
}