import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { requireAuth, isGlobalAdmin } from "../middleware/auth_.js";
import { exchangeMetaCodeForToken } from "../services/meta/metaAuth.js";
import { fetchMetaPages } from "../services/meta/metaPages.js";

const router = Router();

router.post("/meta/exchange", requireAuth, async (req, res, next) => {
  try {

    const { code, workspaceId } = req.body;

    if (!code || !workspaceId)
      return res.status(400).json({ error: "code and workspaceId required" });

    const token = await exchangeMetaCodeForToken({ code });

    const pages = await fetchMetaPages({
      userAccessToken: token.access_token,
    });

    const normalized = pages.map((p) => {
      const ig = p.instagram_business_account || p.connected_instagram_account;

      return {
        pageId: p.id,
        pageName: p.name,
        pageToken: p.access_token,
        igId: ig?.id || null,
        igUsername: ig?.username || null,
      };
    });

    res.json({
      ok: true,
      user_access_token: token.access_token,
      expires_in: token.expires_in,
      pages: normalized,
    });

  } catch (e) {
    console.error("META EXCHANGE ERROR:", e);
    res.status(500).json({ error: e.message });
  }
});

router.post("/meta/connect-pages", requireAuth, async (req, res) => {
  try {

    const { workspaceId, selections } = req.body;

    if (!workspaceId || !selections)
      return res.status(400).json({ error: "Invalid payload" });

    const channels = [];

    for (const s of selections) {

      const pageId = s.pageId;
      const pageName = s.pageName;
      const pageToken = s.pageToken;
      const igId = s.igId;

      if (!pageId) continue;

      if (s.connectFacebook) {

        await supabase.from("workspace_channels").upsert({
          workspace_id: workspaceId,
          provider: "meta",
          platform: "facebook",
          external_id: pageId,
          display_name: pageName,
          status: "connected",
        });

        channels.push("facebook");
      }

      if (s.connectInstagram && igId) {

        await supabase.from("workspace_channels").upsert({
          workspace_id: workspaceId,
          provider: "meta",
          platform: "instagram",
          external_id: pageId,
          display_name: `IG ${pageName}`,
          meta: {
            ig_user_id: igId,
            page_id: pageId,
          },
          status: "connected",
        });

        channels.push("instagram");
      }

      if (pageToken) {

        await supabase.from("channel_tokens").upsert({
          workspace_id: workspaceId,
          provider: "meta",
          external_id: pageId,
          token_type: "page",
          access_token: pageToken,
        });
      }
    }

    res.json({ ok: true, channels });

  } catch (e) {

    console.error("META CONNECT ERROR:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;