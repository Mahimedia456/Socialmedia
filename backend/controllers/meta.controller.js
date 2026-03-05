import { supabase } from "../config/supabase.js";

const GRAPH = "https://graph.facebook.com/v19.0";

export async function connectMetaPages(req, res) {
  try {
    const { code, workspaceId } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Missing OAuth code" });
    }

    const APP_ID = process.env.META_APP_ID;
    const APP_SECRET = process.env.META_APP_SECRET;
    const REDIRECT_URI = process.env.META_REDIRECT_URI;

    if (!APP_ID || !APP_SECRET || !REDIRECT_URI) {
      return res.status(500).json({ error: "Meta env variables missing" });
    }

    /* ---------------------------------------------------
       STEP 1 — exchange code for user access token
    --------------------------------------------------- */

    const tokenRes = await fetch(
      `${GRAPH}/oauth/access_token?client_id=${APP_ID}&redirect_uri=${REDIRECT_URI}&client_secret=${APP_SECRET}&code=${code}`
    );

    const tokenJson = await tokenRes.json();

    if (!tokenJson.access_token) {
      return res.status(400).json({
        error: "Failed to exchange code",
        details: tokenJson,
      });
    }

    const userAccessToken = tokenJson.access_token;

    /* ---------------------------------------------------
       STEP 2 — get pages
    --------------------------------------------------- */

    const pagesRes = await fetch(
      `${GRAPH}/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${userAccessToken}`
    );

    const pagesJson = await pagesRes.json();

    if (!pagesJson.data) {
      return res.status(400).json({
        error: "Failed to fetch pages",
        details: pagesJson,
      });
    }

    const pages = pagesJson.data;

    /* ---------------------------------------------------
       STEP 3 — save pages
    --------------------------------------------------- */

    const savedChannels = [];

    for (const page of pages) {
      const pageId = page.id;
      const pageToken = page.access_token;

      /* save page token */
      await supabase.from("meta_tokens").upsert({
        workspace_id: workspaceId,
        provider: "meta",
        external_id: pageId,
        access_token: pageToken,
      });

      /* save page channel */
      const { data: channel } = await supabase
        .from("workspace_channels")
        .upsert({
          workspace_id: workspaceId,
          provider: "meta",
          platform: "facebook",
          external_id: pageId,
          display_name: page.name,
          status: "connected",
        })
        .select()
        .single();

      savedChannels.push(channel);

      /* ---------------------------------------------------
         STEP 4 — check Instagram connection
      --------------------------------------------------- */

      if (page.instagram_business_account) {
        const igId = page.instagram_business_account.id;

        await supabase.from("workspace_channels").upsert({
          workspace_id: workspaceId,
          provider: "meta",
          platform: "instagram",
          external_id: igId,
          display_name: page.name + " IG",
          status: "connected",
          meta: {
            ig_user_id: igId,
            page_id: pageId,
          },
        });
      }
    }

    return res.json({
      success: true,
      pagesConnected: pages.length,
      channels: savedChannels,
    });
  } catch (err) {
    console.error("META CONNECT ERROR:", err);

    return res.status(500).json({
      error: "Meta connect failed",
      message: err.message,
    });
  }
}