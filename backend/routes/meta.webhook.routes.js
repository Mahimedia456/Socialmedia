// backend/routes/meta.webhook.routes.js
import { Router } from "express";
import express from "express";
import crypto from "crypto";

import { supabase } from "../config/supabase.js";
import { env } from "../config/env.js";

import {
  buildThreadId,
  upsertThreadInMemory,
  upsertMessageInMemory,
  emitToWorkspace,
} from "../services/inbox/inboxMemory.js";

const router = Router();

const T_CHANNELS = "workspace_channels";
const CHANNEL_STATUS_CONNECTED = env.CHANNEL_STATUS_CONNECTED || "connected";

// support BOTH env names
const META_VERIFY_TOKEN = env.META_VERIFY_TOKEN || env.META_WEBHOOK_VERIFY_TOKEN || "";

/**
 * IMPORTANT:
 * We must keep RAW body for signature verification.
 * We mount router with /api and use raw middleware ONLY for these webhook paths.
 */
router.use("/meta/webhook", express.raw({ type: "application/json" }));
router.use("/webhooks/meta", express.raw({ type: "application/json" }));

function verifyMetaSignature({ rawBody, signatureHeader }) {
  const appSecret = env.META_APP_SECRET || "";
  if (!appSecret) return { ok: true, skipped: true };
  if (!signatureHeader) return { ok: true, skipped: true };

  const sig = String(signatureHeader || "");
  if (!sig.startsWith("sha256=")) return { ok: false, reason: "BAD_SIGNATURE_FORMAT" };

  const expected = crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const got = sig.slice("sha256=".length);

  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(got, "hex");
  if (a.length !== b.length) return { ok: false, reason: "SIGNATURE_LEN_MISMATCH" };

  const ok = crypto.timingSafeEqual(a, b);
  return ok ? { ok: true } : { ok: false, reason: "SIGNATURE_MISMATCH" };
}

async function findFacebookChannelByPageId(pageId) {
  const { data, error } = await supabase
    .from(T_CHANNELS)
    .select("id,workspace_id,platform,provider,external_id,display_name,status,meta")
    .eq("provider", "meta")
    .eq("platform", "facebook")
    .eq("external_id", pageId)
    .eq("status", CHANNEL_STATUS_CONNECTED)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

/**
 * Your IG schema:
 * - instagram channel external_id = page_id
 * - actual ig user id is in meta.ig_user_id
 * Webhook entry.id for instagram is typically the IG user id,
 * so we locate the channel by scanning meta.ig_user_id.
 */
async function findInstagramChannelByIgUserId(igUserId) {
  const { data, error } = await supabase
    .from(T_CHANNELS)
    .select("id,workspace_id,platform,provider,external_id,display_name,status,meta")
    .eq("provider", "meta")
    .eq("platform", "instagram")
    .eq("status", CHANNEL_STATUS_CONNECTED)
    .limit(200);
  if (error) throw error;

  const rows = data || [];
  return rows.find((c) => String(c?.meta?.ig_user_id || "") === String(igUserId)) || null;
}

async function upsertInboundThreadAndMessageMemory({
  workspaceId,
  provider,
  platform,
  channel,
  participantExternalId,
  participantName,
  messageId,
  text,
  sentAtISO,
  rawMeta,
}) {
  const now = new Date().toISOString();

  // Webhook doesn't reliably give conversation id => group by participant per channel
  const externalThreadId = `p_${String(participantExternalId || "unknown")}`;

  // IMPORTANT: for instagram, channel.external_id is page_id (your schema)
  const threadId = buildThreadId({
    provider,
    platform,
    channelExternalId: String(channel.external_id),
    externalThreadId,
  });

  const snippet = String(text || "").slice(0, 200);

  const thread = upsertThreadInMemory(workspaceId, {
    id: threadId,
    workspace_id: workspaceId,
    provider,
    platform,
    channel_id: channel.id,
    channel: {
      id: channel.id,
      display_name: channel.display_name,
      external_id: channel.external_id,
      platform: channel.platform,
      provider: channel.provider,
      meta: channel.meta || {},
    },
    external_thread_id: externalThreadId,
    participant_external_id: participantExternalId || null,
    participant_name: participantName || null,
    participant_username: null,
    last_message_at: sentAtISO || now,
    last_message_snippet: snippet,
    status: "open",
    unread_count: 0,
    updated_at: now,
  });

  const extMsgId = messageId || `wh_${channel.external_id}_${participantExternalId}_${Date.now()}`;

  const msg = upsertMessageInMemory(workspaceId, threadId, {
    id: `mem_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    workspace_id: workspaceId,
    thread_id: threadId,
    channel_id: channel.id,
    provider,
    platform,
    external_message_id: String(extMsgId),
    direction: "inbound",
    sender_external_id: participantExternalId || null,
    sender_name: participantName || null,
    message_type: "text",
    text: String(text || ""),
    sent_at: sentAtISO || now,
    meta: rawMeta || {},
  });

  emitToWorkspace(workspaceId, "thread_upsert", thread);
  emitToWorkspace(workspaceId, "message_upsert", msg);

  return { threadId };
}

function handleMetaWebhookGet(req, res) {
  try {
    const mode = String(req.query["hub.mode"] || "");
    const token = String(req.query["hub.verify_token"] || "");
    const challenge = String(req.query["hub.challenge"] || "");

    if (mode === "subscribe" && token && META_VERIFY_TOKEN && token === META_VERIFY_TOKEN) {
      console.log("META WEBHOOK VERIFIED");
      return res.status(200).send(challenge);
    }
    return res.status(403).json({ error: "WEBHOOK_VERIFY_FAILED" });
  } catch (e) {
    return res.status(500).json({ error: "SERVER_ERROR", message: e?.message || "Webhook verify failed" });
  }
}

async function handleMetaWebhookPost(req, res) {
  try {
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
    const sig = req.headers["x-hub-signature-256"];

    const sigCheck = verifyMetaSignature({ rawBody, signatureHeader: sig });
    if (!sigCheck.ok) {
      console.warn("META WEBHOOK SIGNATURE FAIL:", sigCheck.reason);
      return res.status(401).json({ error: "INVALID_SIGNATURE" });
    }

    let payload = {};
    try {
      payload = JSON.parse(rawBody.toString("utf8") || "{}");
    } catch {
      payload = {};
    }

    const provider = "meta";
    const objectType = String(payload?.object || "").toLowerCase(); // page | instagram
    const entries = Array.isArray(payload?.entry) ? payload.entry : [];

    let processed = 0;
    let ignored = 0;
    const errors = [];

    function extractMessagingEvents(entry) {
      const m = Array.isArray(entry?.messaging) ? entry.messaging : [];
      if (m.length) return m;

      const changes = Array.isArray(entry?.changes) ? entry.changes : [];
      const out = [];

      for (const ch of changes) {
        const field = String(ch?.field || "").toLowerCase();
        const value = ch?.value || {};

        if (field.includes("message") || field.includes("messaging")) {
          if (Array.isArray(value?.messaging)) out.push(...value.messaging);
          if (Array.isArray(value?.messages)) out.push(...value.messages);
          if (Array.isArray(value?.entry?.[0]?.messaging)) out.push(...value.entry[0].messaging);
        }
      }
      return out;
    }

    for (const entry of entries) {
      const entryId = entry?.id ? String(entry.id) : "";
      if (!entryId) {
        ignored += 1;
        continue;
      }

      const platform = objectType === "instagram" ? "instagram" : "facebook";

      let channel = null;
      if (platform === "facebook") {
        channel = await findFacebookChannelByPageId(entryId);
      } else {
        channel = await findInstagramChannelByIgUserId(entryId);
      }

      if (!channel) {
        ignored += 1;
        continue;
      }

      const messagingEvents = extractMessagingEvents(entry);
      if (!messagingEvents.length) {
        ignored += 1;
        continue;
      }

      for (const ev of messagingEvents) {
        try {
          const senderId = ev?.sender?.id ? String(ev.sender.id) : null;
          const recipientId = ev?.recipient?.id ? String(ev.recipient.id) : null;

          const mid = ev?.message?.mid
            ? String(ev.message.mid)
            : ev?.message?.id
            ? String(ev.message.id)
            : null;

          const text = ev?.message?.text
            ? String(ev.message.text)
            : ev?.message?.message
            ? String(ev.message.message)
            : "";

          const isEcho = !!ev?.message?.is_echo;
          if (isEcho) {
            ignored += 1;
            continue;
          }
          if (!senderId || !text) {
            ignored += 1;
            continue;
          }

          const tsMs = typeof ev?.timestamp === "number" ? ev.timestamp : Date.now();
          const sentAtISO = new Date(tsMs).toISOString();

          await upsertInboundThreadAndMessageMemory({
            workspaceId: channel.workspace_id,
            provider,
            platform: channel.platform,
            channel,
            participantExternalId: senderId,
            participantName: null,
            messageId: mid,
            text,
            sentAtISO,
            rawMeta: {
              webhook: true,
              object: objectType,
              recipient_id: recipientId,
              entry_id: entryId,
            },
          });

          processed += 1;
        } catch (e) {
          errors.push({ message: e?.message || "Webhook event failed", meta: e?.meta || null });
        }
      }
    }

    return res.status(200).json({ ok: true, processed, ignored, errors });
  } catch (e) {
    console.error("META WEBHOOK ERROR:", e?.message || e);
    // Meta expects 200 quickly
    return res.status(200).json({ ok: false, error: "WEBHOOK_HANDLER_FAILED" });
  }
}

router.get("/meta/webhook", handleMetaWebhookGet);
router.get("/webhooks/meta", handleMetaWebhookGet);
router.post("/meta/webhook", handleMetaWebhookPost);
router.post("/webhooks/meta", handleMetaWebhookPost);

export default router;