import crypto from "crypto";
import { env } from "../../config/env.js";
import { supabase } from "../../config/supabase.js";
import { upsertInboundThreadAndMessageMemory } from "./metaInbox.js";

const T_CHANNELS = "workspace_channels";

function providerMeta() {
  return "meta";
}

function verifyMetaSignature({ rawBody, signatureHeader }) {
  const appSecret = process.env.META_APP_SECRET || "";
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

async function findChannelByExternalId({ provider, platform, externalId }) {
  const { data, error } = await supabase
    .from(T_CHANNELS)
    .select("id,workspace_id,platform,provider,external_id,display_name,status,meta")
    .eq("provider", provider)
    .eq("platform", platform)
    .eq("external_id", externalId)
    .eq("status", env.CHANNEL_STATUS_CONNECTED)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export function handleMetaWebhookGet(req, res) {
  try {
    const mode = String(req.query["hub.mode"] || "");
    const token = String(req.query["hub.verify_token"] || "");
    const challenge = String(req.query["hub.challenge"] || "");

    if (mode === "subscribe" && token && env.META_VERIFY_TOKEN && token === env.META_VERIFY_TOKEN) {
      console.log("META WEBHOOK VERIFIED");
      return res.status(200).send(challenge);
    }
    return res.status(403).json({ error: "WEBHOOK_VERIFY_FAILED" });
  } catch (e) {
    return res.status(500).json({ error: "SERVER_ERROR", message: e?.message || "Webhook verify failed" });
  }
}

export async function handleMetaWebhookPost(req, res) {
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

    const provider = providerMeta();
    const objectType = String(payload?.object || "").toLowerCase();
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
      if (!entryId) { ignored += 1; continue; }

      const platform = objectType === "instagram" ? "instagram" : "facebook";

      const channel = await findChannelByExternalId({ provider, platform, externalId: entryId });
      if (!channel) { ignored += 1; continue; }

      const messagingEvents = extractMessagingEvents(entry);
      if (!messagingEvents.length) { ignored += 1; continue; }

      for (const ev of messagingEvents) {
        try {
          const senderId = ev?.sender?.id ? String(ev.sender.id) : null;
          const recipientId = ev?.recipient?.id ? String(ev.recipient.id) : null;

          const mid = ev?.message?.mid ? String(ev.message.mid) : ev?.message?.id ? String(ev.message.id) : null;

          const text =
            ev?.message?.text ? String(ev.message.text)
            : ev?.message?.message ? String(ev.message.message)
            : "";

          const isEcho = !!ev?.message?.is_echo;
          if (isEcho) { ignored += 1; continue; }
          if (!senderId || !text) { ignored += 1; continue; }

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
            rawMeta: { webhook: true, object: objectType, recipient_id: recipientId },
          });

          processed += 1;
        } catch (e) {
          errors.push({ message: e?.message || "Webhook event failed" });
        }
      }
    }

    return res.status(200).json({ ok: true, processed, ignored, errors });
  } catch (e) {
    console.error("META WEBHOOK ERROR:", e?.message || e);
    return res.status(200).json({ ok: false, error: "WEBHOOK_HANDLER_FAILED" });
  }
}