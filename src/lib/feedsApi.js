// src/lib/feedsApi.js
import { apiFetch } from "./api.js";

/* =========================
   Channels (Publisher list)
   ========================= */

export async function listPublisherChannels(workspaceId, provider = "") {
  const wsId = String(workspaceId || "").trim();
  const qs = new URLSearchParams();

  if (provider) {
    qs.set("provider", String(provider));
  }

  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch(`/api/workspaces/${wsId}/publisher/channels${suffix}`);
}

/* =========================
   Feeds
   Backend expects:
   - facebook: page_channel_id
   - instagram: ig_channel_id
   - tiktok: channel_id
   ========================= */

export async function fetchFacebookFeed({
  workspaceId,
  pageChannelId,
  after = "",
  limit = 10,
}) {
  const wsId = String(workspaceId || "").trim();
  const qs = new URLSearchParams();

  qs.set("page_channel_id", String(pageChannelId || ""));
  qs.set("limit", String(limit || 10));

  if (after) {
    qs.set("after", String(after));
  }

  return apiFetch(`/api/workspaces/${wsId}/feeds/facebook?${qs.toString()}`);
}

export async function fetchInstagramFeed({
  workspaceId,
  igChannelId,
  after = "",
  limit = 10,
}) {
  const wsId = String(workspaceId || "").trim();
  const qs = new URLSearchParams();

  qs.set("ig_channel_id", String(igChannelId || ""));
  qs.set("limit", String(limit || 10));

  if (after) {
    qs.set("after", String(after));
  }

  return apiFetch(`/api/workspaces/${wsId}/feeds/instagram?${qs.toString()}`);
}

export async function fetchTikTokFeed({
  workspaceId,
  channelId,
  cursor = 0,
  limit = 10,
}) {
  const wsId = String(workspaceId || "").trim();
  const qs = new URLSearchParams();

  qs.set("channel_id", String(channelId || ""));
  qs.set("cursor", String(cursor || 0));
  qs.set("limit", String(limit || 10));

  return apiFetch(
    `/api/tiktok/workspaces/${wsId}/feeds?${qs.toString()}`
  );
}

/* =========================
   Facebook Comments / Like / Comment / Reply
   Backend routes:
   - GET  /api/workspaces/:workspaceId/feeds/facebook/comments?page_channel_id=...&post_id=...&limit=...&after=...
   - POST /api/workspaces/:workspaceId/feeds/facebook/comments/reply  { page_channel_id, comment_id, message }
   - POST /api/workspaces/:workspaceId/feeds/facebook/like           { page_channel_id, post_id }
   - POST /api/workspaces/:workspaceId/feeds/facebook/comment        { page_channel_id, post_id, message }
   ========================= */

export async function fetchFacebookComments({
  workspaceId,
  pageChannelId,
  postId,
  after = "",
  limit = 50,
}) {
  const wsId = String(workspaceId || "").trim();
  const qs = new URLSearchParams();

  qs.set("page_channel_id", String(pageChannelId || ""));
  qs.set("post_id", String(postId || ""));
  qs.set("limit", String(limit || 50));

  if (after) {
    qs.set("after", String(after));
  }

  return apiFetch(`/api/workspaces/${wsId}/feeds/facebook/comments?${qs.toString()}`);
}

export async function replyFacebookComment({
  workspaceId,
  pageChannelId,
  commentId,
  message,
}) {
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

export async function likeFacebookPost({
  workspaceId,
  pageChannelId,
  postId,
}) {
  const wsId = String(workspaceId || "").trim();

  return apiFetch(`/api/workspaces/${wsId}/feeds/facebook/like`, {
    method: "POST",
    body: {
      page_channel_id: String(pageChannelId || ""),
      post_id: String(postId || ""),
    },
  });
}

export async function commentFacebookPost({
  workspaceId,
  pageChannelId,
  postId,
  message,
}) {
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