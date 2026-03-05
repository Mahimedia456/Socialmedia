// routes/meta.routes.js
import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { requireAuth, isGlobalAdmin } from "../middleware/auth_.js";
import { exchangeMetaCodeForToken } from "../services/meta/metaAuth.js";
import { fetchMetaPages } from "../services/meta/metaPages.js";
import { env } from "../config/env.js";

const router = Router();

const T_WSM = "workspace_members";
const T_CHANNELS = "workspace_channels";
const T_CHANNEL_TOKENS = "channel_tokens";

const CHANNEL_STATUS_CONNECTED = env.CHANNEL_STATUS_CONNECTED || "connected";

async function getWorkspaceMemberRole(userId, workspaceId) {
  const { data, error } = await supabase
    .from(T_WSM)
    .select("role,status")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data || data.status !== "active") return null;
  return data.role || null;
}

router.post("/meta/exchange", requireAuth, async (req, res, next) => {
  try {
    const code = String(req.body?.code || "");
    const workspaceId = String(req.body?.workspaceId || "");
    if (!code || !workspaceId) return res.status(400).json({ error: "VALIDATION_ERROR", message: "code and workspaceId required" });

    if (!isGlobalAdmin(req.auth.role)) {
      const role = await getWorkspaceMemberRole(req.auth.userId, workspaceId);
      if (!role) return res.status(403).json({ error: "WORKSPACE_FORBIDDEN" });
    }

    const token = await exchangeMetaCodeForToken({ code });
    const userAccessToken = token.access_token;

    const pages = await fetchMetaPages({ userAccessToken });

    const normalized = (pages || []).map((p) => {
      const ig = p.instagram_business_account || p.connected_instagram_account || null;
      return {
        pageId: String(p.id),
        pageName: String(p.name || "Facebook Page"),
        pageToken: String(p.access_token || ""),
        igId: ig?.id ? String(ig.id) : null,
        igUsername: ig?.username ? String(ig.username) : null,
        tasks: Array.isArray(p.tasks) ? p.tasks : [],
      };
    });

    res.json({
      ok: true,
      workspaceId,
      user_access_token: userAccessToken,
      expires_in: token.expires_in || null,
      pages: normalized,
    });
  } catch (e) {
    next(e);
  }
});

router.post("/meta/connect-pages", requireAuth, async (req, res, next) => {
  try {
    const workspaceId = String(req.body?.workspaceId || "");
    const userAccessToken = String(req.body?.user_access_token || "");
    const selections = req.body?.selections;
    const expires_in = req.body?.expires_in ?? null;

    if (!workspaceId || !userAccessToken || !Array.isArray(selections)) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "workspaceId, user_access_token, selections[] required" });
    }

    if (!isGlobalAdmin(req.auth.role)) {
      const role = await getWorkspaceMemberRole(req.auth.userId, workspaceId);
      if (!role) return res.status(403).json({ error: "WORKSPACE_FORBIDDEN" });
    }

    const provider = "meta";
    const expiresAt = expires_in ? new Date(Date.now() + Number(expires_in) * 1000).toISOString() : null;

    // save user token
    const { error: userTokErr } = await supabase.from(T_CHANNEL_TOKENS).upsert(
      [
        {
          workspace_id: workspaceId,
          provider,
          external_id: "me",
          token_type: "user",
          access_token: userAccessToken,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: "workspace_id,provider,external_id,token_type" }
    );
    if (userTokErr) throw userTokErr;

    const channelRows = [];
    const tokenRows = [];

    for (const s of selections) {
      const pageId = String(s.pageId || "");
      const pageName = String(s.pageName || "Facebook Page");
      const pageToken = String(s.pageToken || "");
      const igId = s.igId ? String(s.igId) : null;

      const connectFacebook = !!s.connectFacebook;
      const connectInstagram = !!s.connectInstagram && !!igId;

      if (!pageId) continue;
      if (!connectFacebook && !connectInstagram) continue;

      if (connectFacebook) {
        channelRows.push({
          workspace_id: workspaceId,
          provider,
          platform: "facebook",
          display_name: pageName,
          external_id: pageId, // page_id
          status: CHANNEL_STATUS_CONNECTED,
          meta: { type: "page" },
          updated_at: new Date().toISOString(),
        });

        if (pageToken) {
          tokenRows.push({
            workspace_id: workspaceId,
            provider,
            external_id: pageId, // page_id
            token_type: "page",
            access_token: pageToken,
            expires_at: null,
            updated_at: new Date().toISOString(),
          });
        }
      }

      // IMPORTANT:
      // If you use your "migration", you WANT instagram channel external_id = page_id,
      // and store ig user id in meta.ig_user_id.
      if (connectInstagram && igId) {
        channelRows.push({
          workspace_id: workspaceId,
          provider,
          platform: "instagram",
          display_name: `IG ${pageName}`,
          external_id: pageId, // <-- page_id (not ig id)
          status: CHANNEL_STATUS_CONNECTED,
          meta: { type: "ig_business", page_id: pageId, ig_user_id: igId },
          updated_at: new Date().toISOString(),
        });

        if (pageToken) {
          tokenRows.push({
            workspace_id: workspaceId,
            provider,
            external_id: pageId, // token keyed by page_id
            token_type: "page",
            access_token: pageToken,
            expires_at: null,
            updated_at: new Date().toISOString(),
          });
        }
      }
    }

    if (!channelRows.length) return res.status(400).json({ error: "VALIDATION_ERROR", message: "No selections to connect" });

    const { error: chErr } = await supabase.from(T_CHANNELS).upsert(channelRows, {
      onConflict: "workspace_id,provider,platform,external_id",
    });
    if (chErr) throw chErr;

    if (tokenRows.length) {
      const { error: tErr } = await supabase.from(T_CHANNEL_TOKENS).upsert(tokenRows, {
        onConflict: "workspace_id,provider,external_id,token_type",
      });
      if (tErr) throw tErr;
    }

    res.json({ ok: true, connected_channels: channelRows.length, connected_tokens: tokenRows.length });
  } catch (e) {
    next(e);
  }
});

export default router;