// backend/routes/tiktok.routes.js

import express from "express";
import {
  providerTikTok,
  parseTikTokStateSafe,
  tiktokTokenExchange,
  tiktokGetUserInfo,
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

      const displayName = String(
        user?.display_name || tokenData?.display_name || "TikTok Account"
      ).trim();

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
        display_name: displayName,
        external_id: externalId,
        status: channelStatusConnected,
        meta: {
          type: "tiktok_account",
          open_id: externalId,
          union_id: user?.union_id || null,
          avatar_url: user?.avatar_url || null,
          bio_description: user?.bio_description || null,
          profile_deep_link: user?.profile_deep_link || null,
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

      if (chErr) throw chErr;

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

      if (tokErr) throw tokErr;

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
        expires_in: expiresIn || null,
      });
    } catch (e) {
      console.error("TIKTOK EXCHANGE ERROR:", {
        message: e?.message || "Unknown TikTok exchange error",
        meta: e?.meta || null,
        stack: e?.stack || null,
      });
      next(e);
    }
  });

  return router;
}