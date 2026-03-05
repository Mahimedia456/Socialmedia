import { env } from "../../config/env.js";
import { supabase } from "../../config/supabase.js";
import { metaPostForm, metaGet } from "../meta/metaClient.js";

const T_SOCIAL_POSTS = "social_posts";
const T_SOCIAL_POST_TARGETS = "social_post_targets";
const T_CHANNEL_TOKENS = "channel_tokens";

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

async function publishFacebookPost({ pageId, pageToken, message, link }) {
  const url = new URL(`https://graph.facebook.com/${env.META_GRAPH_VERSION}/${pageId}/feed`);

  const body = new URLSearchParams();
  body.set("access_token", pageToken);
  if (message) body.set("message", message);
  if (link) body.set("link", link);

  const r = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(j?.error?.message || "Facebook publish failed");
    e.meta = j?.error || j;
    throw e;
  }
  return j;
}

async function publishInstagramPost({ igUserId, token, caption, imageUrl }) {
  if (!imageUrl) throw new Error("Instagram publishing requires imageUrl (feed posts can't be text-only).");

  const createUrl = new URL(`https://graph.facebook.com/${env.META_GRAPH_VERSION}/${igUserId}/media`);
  createUrl.searchParams.set("access_token", token);

  const r1 = await fetch(createUrl.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl, caption: caption || "" }),
  });

  const j1 = await r1.json().catch(() => ({}));
  if (!r1.ok) {
    const e = new Error(j1?.error?.message || "IG create media failed");
    e.meta = j1?.error || j1;
    throw e;
  }

  const creationId = j1?.id;
  if (!creationId) throw new Error("IG create media returned no id.");

  const pubUrl = new URL(`https://graph.facebook.com/${env.META_GRAPH_VERSION}/${igUserId}/media_publish`);
  pubUrl.searchParams.set("access_token", token);

  const r2 = await fetch(pubUrl.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: creationId }),
  });

  const j2 = await r2.json().catch(() => ({}));
  if (!r2.ok) {
    const e = new Error(j2?.error?.message || "IG publish failed");
    e.meta = j2?.error || j2;
    throw e;
  }

  return { creation_id: creationId, ...j2 };
}

export async function publishPostNow({ workspaceId, postId }) {
  const { data: post, error: pErr } = await supabase
    .from(T_SOCIAL_POSTS)
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", postId)
    .maybeSingle();
  if (pErr) throw pErr;
  if (!post) throw new Error("POST_NOT_FOUND");

  await supabase
    .from(T_SOCIAL_POSTS)
    .update({ status: "publishing", error: null })
    .eq("id", postId)
    .eq("workspace_id", workspaceId);

  const { data: targets, error: tErr } = await supabase
    .from(T_SOCIAL_POST_TARGETS)
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("post_id", postId);
  if (tErr) throw tErr;

  const updates = [];
  let anyFailed = false;

  for (const t of targets || []) {
    try {
      await supabase
        .from(T_SOCIAL_POST_TARGETS)
        .update({ status: "publishing", error: null })
        .eq("id", t.id);

      // tokens stored by external_id (page_id)
      const token = await getTokenFromDB({
        workspaceId,
        externalId: String(t.external_id),
        token_type: "page",
      });
      if (!token) throw new Error(`Missing token for ${t.platform}:${t.external_id}`);

      if (t.provider === "meta" && t.platform === "facebook") {
        const r = await publishFacebookPost({
          pageId: String(t.external_id),
          pageToken: token,
          message: String(post.text || ""),
          link: post.link_url ? String(post.link_url) : "",
        });

        updates.push(
          supabase
            .from(T_SOCIAL_POST_TARGETS)
            .update({
              status: "published",
              published_id: String(r?.id || ""),
              meta: { ...(t.meta || {}), result: r },
            })
            .eq("id", t.id)
        );
      } else if (t.provider === "meta" && t.platform === "instagram") {
        // IMPORTANT: store ig_user_id into target meta at creation time (recommended)
        const igUserId = String(t?.meta?.ig_user_id || "");
        if (!igUserId) throw new Error("Missing meta.ig_user_id for instagram target");

        const mediaUrls = Array.isArray(post.media_urls) ? post.media_urls : [];
        const imageUrl = mediaUrls[0] ? String(mediaUrls[0]) : "";

        const r = await publishInstagramPost({
          igUserId,
          token, // page token
          caption: String(post.text || ""),
          imageUrl,
        });

        updates.push(
          supabase
            .from(T_SOCIAL_POST_TARGETS)
            .update({
              status: "published",
              published_id: String(r?.id || r?.creation_id || ""),
              meta: { ...(t.meta || {}), result: r },
            })
            .eq("id", t.id)
        );
      } else {
        throw new Error(`Unsupported target: ${t.provider}:${t.platform}`);
      }
    } catch (e) {
      anyFailed = true;
      updates.push(
        supabase
          .from(T_SOCIAL_POST_TARGETS)
          .update({
            status: "failed",
            error: e?.message || "Publish failed",
            meta: { ...(t.meta || {}), error_meta: e?.meta || null },
          })
          .eq("id", t.id)
      );
    }
  }

  await Promise.all(updates);

  const finalStatus = anyFailed ? "failed" : "published";
  const { data: post2 } = await supabase
    .from(T_SOCIAL_POSTS)
    .update({
      status: finalStatus,
      published_at: finalStatus === "published" ? new Date().toISOString() : null,
    })
    .eq("id", postId)
    .eq("workspace_id", workspaceId)
    .select("*")
    .maybeSingle();

  const { data: targets2 } = await supabase
    .from(T_SOCIAL_POST_TARGETS)
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("post_id", postId);

  return { post: post2 || post, targets: targets2 || [] };
}