// src/lib/feedsApi.js
import { apiFetch } from "./api.js";

/* =========================
   Channels (Publisher list)
   ========================= */

export async function listPublisherChannels(workspaceId, provider = "meta") {
  const wsId = String(workspaceId || "").trim();
  const qs = new URLSearchParams();
  if (provider) qs.set("provider", provider);
  return apiFetch(`/api/workspaces/${wsId}/publisher/channels?${qs.toString()}`);
}

/* =========================
   Feeds
   Backend expects:
   - facebook: page_channel_id
   - instagram: ig_channel_id
   ========================= */

export async function fetchFacebookFeed({ workspaceId, pageChannelId, after = "", limit = 10 }) {
  const wsId = String(workspaceId || "").trim();
  const qs = new URLSearchParams();
  qs.set("page_channel_id", String(pageChannelId || ""));
  qs.set("limit", String(limit || 10));
  if (after) qs.set("after", String(after));
  return apiFetch(`/api/workspaces/${wsId}/feeds/facebook?${qs.toString()}`);
}

export async function fetchInstagramFeed({ workspaceId, igChannelId, after = "", limit = 10 }) {
  const wsId = String(workspaceId || "").trim();
  const qs = new URLSearchParams();
  qs.set("ig_channel_id", String(igChannelId || ""));
  qs.set("limit", String(limit || 10));
  if (after) qs.set("after", String(after));
  return apiFetch(`/api/workspaces/${wsId}/feeds/instagram?${qs.toString()}`);
}

/* =========================
   Facebook Comments / Like / Comment / Reply
   YOU MUST HAVE these backend routes:
   - GET  /api/workspaces/:workspaceId/feeds/facebook/comments?page_channel_id=...&post_id=...&limit=...&after=...
   - POST /api/workspaces/:workspaceId/feeds/facebook/comments/reply  { page_channel_id, comment_id, message }
   - POST /api/workspaces/:workspaceId/feeds/facebook/like           { page_channel_id, post_id }
   - POST /api/workspaces/:workspaceId/feeds/facebook/comment        { page_channel_id, post_id, message }
   If any is missing, you will get 404/400.
   ========================= */

export async function fetchFacebookComments({ workspaceId, pageChannelId, postId, after = "", limit = 50 }) {
  const wsId = String(workspaceId || "").trim();
  const qs = new URLSearchParams();
  qs.set("page_channel_id", String(pageChannelId || ""));
  qs.set("post_id", String(postId || ""));
  qs.set("limit", String(limit || 50));
  if (after) qs.set("after", String(after));
  // ✅ GET with querystring (no body)
  return apiFetch(`/api/workspaces/${wsId}/feeds/facebook/comments?${qs.toString()}`);
}

export async function replyFacebookComment({ workspaceId, pageChannelId, commentId, message }) {
  const wsId = String(workspaceId || "").trim();
  return apiFetch(`/api/workspaces/${wsId}/feeds/facebook/comments/reply`, {
    method: "POST",
    body: {
      page_channel_id: String(pageChannelId || ""),
      comment_id: String(commentId || ""),
      message: String(message || ""),
    },
  });
}

export async function likeFacebookPost({ workspaceId, pageChannelId, postId }) {
  const wsId = String(workspaceId || "").trim();
  return apiFetch(`/api/workspaces/${wsId}/feeds/facebook/like`, {
    method: "POST",
    body: {
      page_channel_id: String(pageChannelId || ""),
      post_id: String(postId || ""),
    },
  });
}

export async function commentFacebookPost({ workspaceId, pageChannelId, postId, message }) {
  const wsId = String(workspaceId || "").trim();
  return apiFetch(`/api/workspaces/${wsId}/feeds/facebook/comment`, {
    method: "POST",
    body: {
      page_channel_id: String(pageChannelId || ""),
      post_id: String(postId || ""),
      message: String(message || ""),
    },
  });
}