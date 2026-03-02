// backend/routes/meta.js
import express from "express";

const router = express.Router();

const META_GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v19.0";
const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
const META_REDIRECT_URI = process.env.META_REDIRECT_URI;

function must(v, name) {
  if (!v) throw new Error(`Missing ${name} in backend/.env`);
  return v;
}

async function exchangeCodeForToken(code) {
  const url = new URL(`https://graph.facebook.com/${META_GRAPH_VERSION}/oauth/access_token`);
  url.searchParams.set("client_id", must(META_APP_ID, "META_APP_ID"));
  url.searchParams.set("client_secret", must(META_APP_SECRET, "META_APP_SECRET"));
  url.searchParams.set("redirect_uri", must(META_REDIRECT_URI, "META_REDIRECT_URI"));
  url.searchParams.set("code", code);

  const r = await fetch(url.toString());
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error?.message || "Token exchange failed");
  return j; // { access_token, expires_in }
}

async function getPages(userToken) {
  const url = new URL(`https://graph.facebook.com/${META_GRAPH_VERSION}/me/accounts`);
  url.searchParams.set("fields", "id,name,access_token,instagram_business_account");
  url.searchParams.set("access_token", userToken);

  const r = await fetch(url.toString());
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error?.message || "Failed to fetch pages");
  return j?.data || [];
}

// 1) exchange code -> return pages list
router.post("/exchange", async (req, res, next) => {
  try {
    const { code, workspaceId } = req.body || {};
    if (!code || !workspaceId) return res.status(400).json({ error: "Missing code/workspaceId" });

    const token = await exchangeCodeForToken(code);
    const userAccessToken = token.access_token;

    const pages = await getPages(userAccessToken);

    // Return pages to frontend for checkbox UI
    const normalized = pages.map((p) => ({
      pageId: String(p.id),
      pageName: String(p.name || "Facebook Page"),
      // if page has IG biz account, include it as option
      igId: p.instagram_business_account?.id ? String(p.instagram_business_account.id) : null,
      igLabel: p.instagram_business_account?.id ? `IG linked to ${p.name}` : null,
      pageToken: String(p.access_token || ""), // needed for later connect-pages
    }));

    return res.json({
      ok: true,
      workspaceId,
      user_access_token: userAccessToken, // frontend will send back to connect-pages (or you can store temp)
      expires_in: token.expires_in || null,
      pages: normalized,
    });
  } catch (e) {
    next(e);
  }
});

// 2) save only selected pages/ig into DB
router.post("/connect-pages", async (req, res, next) => {
  try {
    const { workspaceId, selections, user_access_token } = req.body || {};
    if (!workspaceId || !Array.isArray(selections) || !user_access_token) {
      return res.status(400).json({ error: "Missing workspaceId/selections/user_access_token" });
    }

    const supabase = req.app.locals.supabase; // we will attach it in app.js (below)

    // selections items shape:
    // { pageId, pageName, pageToken, connectFacebook: true/false, connectInstagram: true/false, igId? }

    const channelRows = [];
    const tokenRows = [];

    // store user token (optional)
    tokenRows.push({
      workspace_id: workspaceId,
      provider: "meta",
      external_id: "meta_user",
      token_type: "user",
      access_token: user_access_token,
      expires_at: null,
    });

    for (const s of selections) {
      const pageId = String(s.pageId);
      const pageName = String(s.pageName || "Facebook Page");
      const pageToken = String(s.pageToken || "");

      if (s.connectFacebook) {
        channelRows.push({
          workspace_id: workspaceId,
          provider: "meta",
          platform: "facebook",
          display_name: pageName,
          external_id: pageId,
          status: "connected",
          meta: { type: "page" },
        });

        if (pageToken) {
          tokenRows.push({
            workspace_id: workspaceId,
            provider: "meta",
            external_id: pageId,
            token_type: "page",
            access_token: pageToken,
            expires_at: null,
          });
        }
      }

      if (s.connectInstagram && s.igId) {
        const igId = String(s.igId);

        channelRows.push({
          workspace_id: workspaceId,
          provider: "meta",
          platform: "instagram",
          display_name: `IG ${pageName}`,
          external_id: igId,
          status: "connected",
          meta: { type: "ig_business", page_id: pageId },
        });

        if (pageToken) {
          tokenRows.push({
            workspace_id: workspaceId,
            provider: "meta",
            external_id: igId,
            token_type: "page",
            access_token: pageToken,
            expires_at: null,
          });
        }
      }
    }

    if (!channelRows.length) return res.status(400).json({ error: "No selections to connect" });

    const { error: chErr } = await supabase
      .from("post_channels")
      .upsert(channelRows, { onConflict: "workspace_id,provider,platform,external_id" });

    if (chErr) throw chErr;

    const { error: tErr } = await supabase
      .from("channel_tokens")
      .upsert(tokenRows, { onConflict: "workspace_id,provider,external_id,token_type" });

    if (tErr) throw tErr;

    return res.json({ ok: true, connected: channelRows.length });
  } catch (e) {
    next(e);
  }
});

export default router;