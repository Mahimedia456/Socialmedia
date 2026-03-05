import { env } from "../../config/env.js";

export async function sendFacebookPageMessage({ pageToken, recipientId, text }) {
  const url = new URL(`https://graph.facebook.com/${env.META_GRAPH_VERSION}/me/messages`);
  url.searchParams.set("access_token", pageToken);

  const body = {
    messaging_type: "RESPONSE",
    recipient: { id: recipientId },
    message: { text },
  };

  const r = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(j?.error?.message || "FB send failed");
    e.meta = j?.error || j;
    throw e;
  }
  return j;
}

/**
 * IMPORTANT:
 * igUserId MUST be the IG user id (from meta.ig_user_id if you migrated external_id=page_id)
 */
export async function sendInstagramMessage({ igUserId, token, recipientId, text }) {
  const url = new URL(`https://graph.facebook.com/${env.META_GRAPH_VERSION}/${igUserId}/messages`);
  url.searchParams.set("access_token", token);

  const body = {
    recipient: { id: recipientId },
    message: { text },
  };

  const r = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(j?.error?.message || "IG send failed");
    e.meta = j?.error || j;
    throw e;
  }
  return j;
}