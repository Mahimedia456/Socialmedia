// backend/routes/inbox.routes.js
import { Router } from "express";
import { supabase } from "../config/supabase.js";
import {
  requireAuth,
  requireWorkspaceAccess,
  isGlobalAdmin,
  verifyAccessFromQuery,
} from "../middleware/auth_.js";
import { env } from "../config/env.js";
import { sendFacebookPageMessage, sendInstagramMessage } from "../services/meta/metaSend.js";

import {
  inboxStore,
  buildThreadId,
  normalizeText,
  tsNum,
  upsertThreadInMemory,
  upsertMessageInMemory,
  listThreadsFromMemory,
  listMessagesFromMemory,
  sseWrite,
  addSseClient,
  removeSseClient,
  emitToWorkspace,
} from "../services/inbox/inboxMemory.js";

const router = Router();

const T_CHANNELS = "workspace_channels";
const T_CHANNEL_TOKENS = "channel_tokens";
const CHANNEL_STATUS_CONNECTED = env.CHANNEL_STATUS_CONNECTED || "connected";

/* ---------------- Tokens ---------------- */
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

/* --------- FB Messenger pagination --------- */
async function fetchPageConversations({ pageId, pageToken, limit = 50, after = null, platform = null }) {
  const url = new URL(`https://graph.facebook.com/${env.META_GRAPH_VERSION}/${pageId}/conversations`);
  url.searchParams.set("fields", "id,updated_time,snippet,participants");
  url.searchParams.set("limit", String(limit));
  if (after) url.searchParams.set("after", after);
  if (platform) url.searchParams.set("platform", platform);
  url.searchParams.set("access_token", pageToken);

  const r = await fetch(url.toString());
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(j?.error?.message || "Failed to fetch conversations");
    e.meta = j?.error || j;
    throw e;
  }
  return { data: j?.data || [], paging: j?.paging || null };
}

async function fetchConversationMessages({ conversationId, pageToken, limit = 50, after = null }) {
  const url = new URL(`https://graph.facebook.com/${env.META_GRAPH_VERSION}/${conversationId}/messages`);
  url.searchParams.set("fields", "id,created_time,from,message");
  url.searchParams.set("limit", String(limit));
  if (after) url.searchParams.set("after", after);
  url.searchParams.set("access_token", pageToken);

  const r = await fetch(url.toString());
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(j?.error?.message || "Failed to fetch conversation messages");
    e.meta = j?.error || j;
    throw e;
  }
  return { data: j?.data || [], paging: j?.paging || null };
}

async function fetchAllPageConversations({ pageId, pageToken, maxConvos = 500, platform = null }) {
  const all = [];
  let after = null;
  while (true) {
    const { data, paging } = await fetchPageConversations({ pageId, pageToken, limit: 50, after, platform });
    all.push(...(data || []));
    const nextAfter = paging?.cursors?.after || null;
    if (!nextAfter) break;
    after = nextAfter;
    if (all.length >= maxConvos) break;
  }
  return all;
}

async function fetchAllConversationMessages({ conversationId, pageToken, maxMsgs = 500 }) {
  const all = [];
  let after = null;
  while (true) {
    const { data, paging } = await fetchConversationMessages({ conversationId, pageToken, limit: 50, after });
    all.push(...(data || []));
    const nextAfter = paging?.cursors?.after || null;
    if (!nextAfter) break;
    after = nextAfter;
    if (all.length >= maxMsgs) break;
  }
  return all;
}

/* --------- IG Messaging (attempt) --------- */
async function fetchIgConversations({ igUserId, token, limit = 50, after = null }) {
  const url = new URL(`https://graph.facebook.com/${env.META_GRAPH_VERSION}/${igUserId}/conversations`);
  url.searchParams.set("fields", "id,updated_time,participants");
  url.searchParams.set("limit", String(limit));
  if (after) url.searchParams.set("after", after);
  url.searchParams.set("access_token", token);

  const r = await fetch(url.toString());
  const j = await r.json().catch(() => ({}));

  if (!r.ok) {
    const e = new Error(j?.error?.message || "Failed to fetch IG conversations");
    e.meta = j?.error || j;
    throw e;
  }
  return { data: j?.data || [], paging: j?.paging || null };
}

async function fetchIgMessages({ conversationId, token, limit = 50, after = null }) {
  const url = new URL(`https://graph.facebook.com/${env.META_GRAPH_VERSION}/${conversationId}/messages`);
  url.searchParams.set("fields", "id,created_time,from,to,message");
  url.searchParams.set("limit", String(limit));
  if (after) url.searchParams.set("after", after);
  url.searchParams.set("access_token", token);

  const r = await fetch(url.toString());
  const j = await r.json().catch(() => ({}));

  if (!r.ok) {
    const e = new Error(j?.error?.message || "Failed to fetch IG messages");
    e.meta = j?.error || j;
    throw e;
  }
  return { data: j?.data || [], paging: j?.paging || null };
}

async function fetchAllIgConversations({ igUserId, token, maxConvos = 500 }) {
  const all = [];
  let after = null;
  while (true) {
    const { data, paging } = await fetchIgConversations({ igUserId, token, limit: 50, after });
    all.push(...(data || []));
    const nextAfter = paging?.cursors?.after || null;
    if (!nextAfter) break;
    after = nextAfter;
    if (all.length >= maxConvos) break;
  }
  return all;
}

async function fetchAllIgMessages({ conversationId, token, maxMsgs = 500 }) {
  const all = [];
  let after = null;
  while (true) {
    const { data, paging } = await fetchIgMessages({ conversationId, token, limit: 50, after });
    all.push(...(data || []));
    const nextAfter = paging?.cursors?.after || null;
    if (!nextAfter) break;
    after = nextAfter;
    if (all.length >= maxMsgs) break;
  }
  return all;
}

/**
 * ✅ SSE realtime stream
 * GET /api/workspaces/:workspaceId/inbox/stream?access_token=...
 */
router.get("/workspaces/:workspaceId/inbox/stream", async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const decoded = await verifyAccessFromQuery(req, res);
    if (!decoded) return;

    if (!isGlobalAdmin(decoded.role)) {
      const { data, error } = await supabase
        .from("workspace_members")
        .select("role,status")
        .eq("workspace_id", workspaceId)
        .eq("user_id", decoded.sub)
        .maybeSingle();
      if (error) throw error;
      if (!data || data.status !== "active") return res.status(403).json({ error: "WORKSPACE_FORBIDDEN" });
    }

    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    if (typeof res.flushHeaders === "function") res.flushHeaders();

    addSseClient(workspaceId, res);
    sseWrite(res, "hello", { ok: true, workspaceId, ts: Date.now() });

    const keepAlive = setInterval(() => {
      try {
        sseWrite(res, "ping", { ts: Date.now() });
      } catch {}
    }, 25000);

    req.on("close", () => {
      clearInterval(keepAlive);
      removeSseClient(workspaceId, res);
    });
  } catch (e) {
    res.status(500).json({ error: "SERVER_ERROR", message: e?.message || "stream failed" });
  }
});

/* ---------------- List threads from memory ---------------- */
router.get("/workspaces/:workspaceId/inbox/threads", requireAuth, requireWorkspaceAccess, async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const platform = String(req.query.platform || "all").toLowerCase();
    const status = String(req.query.status || "all").toLowerCase();
    const q = String(req.query.q || "").trim().toLowerCase();
    const channelId = String(req.query.channelId || "all");

    let rows = listThreadsFromMemory(workspaceId);

    if (platform !== "all") rows = rows.filter((t) => String(t.platform) === platform);
    if (status !== "all") rows = rows.filter((t) => String(t.status) === status);
    if (channelId !== "all") rows = rows.filter((t) => String(t.channel_id) === channelId);

    if (q) {
      rows = rows.filter((t) => {
        return (
          String(t.participant_name || "").toLowerCase().includes(q) ||
          String(t.participant_username || "").toLowerCase().includes(q) ||
          String(t.participant_external_id || "").toLowerCase().includes(q) ||
          String(t.last_message_snippet || "").toLowerCase().includes(q) ||
          String(t.channel?.display_name || "").toLowerCase().includes(q) ||
          String(t.channel?.external_id || "").toLowerCase().includes(q)
        );
      });
    }

    rows = rows.slice().sort((a, b) => tsNum(b.last_message_at) - tsNum(a.last_message_at));
    res.json({ threads: rows });
  } catch (e) {
    next(e);
  }
});

/* ---------------- Read messages ---------------- */
router.get("/inbox/threads/:threadId/messages", requireAuth, async (req, res, next) => {
  try {
    const { threadId } = req.params;
    const limit = Math.min(500, Math.max(1, Number(req.query.limit || 100)));

    let foundWorkspaceId = "";
    for (const [wsId, ws] of inboxStore.entries()) {
      if (ws.threads.has(threadId)) {
        foundWorkspaceId = wsId;
        break;
      }
    }
    if (!foundWorkspaceId) return res.status(404).json({ error: "THREAD_NOT_FOUND" });

    if (!isGlobalAdmin(req.auth.role)) {
      const { data, error } = await supabase
        .from("workspace_members")
        .select("role,status")
        .eq("workspace_id", foundWorkspaceId)
        .eq("user_id", req.auth.userId)
        .maybeSingle();
      if (error) throw error;
      if (!data || data.status !== "active") return res.status(403).json({ error: "WORKSPACE_FORBIDDEN" });
    }

    const rows = listMessagesFromMemory(foundWorkspaceId, threadId)
      .slice()
      .sort((a, b) => tsNum(a.sent_at) - tsNum(b.sent_at))
      .slice(-limit);

    res.json({ messages: rows });
  } catch (e) {
    next(e);
  }
});

/* ---------------- Send outbound message ---------------- */
router.post("/inbox/threads/:threadId/messages", requireAuth, async (req, res, next) => {
  try {
    const { threadId } = req.params;
    const text = normalizeText(req.body?.text);
    if (!text) return res.status(400).json({ error: "VALIDATION_ERROR", message: "text required" });

    let workspaceId = "";
    let thread = null;

    for (const [wsId, ws] of inboxStore.entries()) {
      const t = ws.threads.get(threadId);
      if (t) {
        workspaceId = wsId;
        thread = t;
        break;
      }
    }
    if (!thread || !workspaceId) return res.status(404).json({ error: "THREAD_NOT_FOUND" });

    if (!isGlobalAdmin(req.auth.role)) {
      const { data, error } = await supabase
        .from("workspace_members")
        .select("role,status")
        .eq("workspace_id", workspaceId)
        .eq("user_id", req.auth.userId)
        .maybeSingle();
      if (error) throw error;
      if (!data || data.status !== "active") return res.status(403).json({ error: "WORKSPACE_FORBIDDEN" });
    }

    let sendResult = null;
    let sendError = null;

    try {
      const provider = String(thread.provider || "");
      const platform = String(thread.platform || "");
      const recipientId = String(thread.participant_external_id || "");

      if (provider === "meta" && platform === "facebook") {
        const pageId = String(thread.channel?.external_id || "");
        const pageToken = await getTokenFromDB({ workspaceId, externalId: pageId, token_type: "page" });
        if (!pageToken) throw new Error("Missing page token for sending");
        if (!recipientId) throw new Error("Missing recipient PSID (participant_external_id)");
        sendResult = await sendFacebookPageMessage({ pageToken, recipientId, text });
      }

      if (provider === "meta" && platform === "instagram") {
        const pageId = String(thread.channel?.external_id || "");
        const igUserId = String(thread.channel?.meta?.ig_user_id || "");
        const pageToken = await getTokenFromDB({ workspaceId, externalId: pageId, token_type: "page" });

        if (!pageToken) throw new Error("Missing IG page token for sending");
        if (!igUserId) throw new Error("Missing ig_user_id (thread.channel.meta.ig_user_id)");
        if (!recipientId) throw new Error("Missing IG recipient id (participant_external_id)");

        sendResult = await sendInstagramMessage({ igUserId, token: pageToken, recipientId, text });
      }
    } catch (e) {
      sendError = { message: e?.message || "Send failed", meta: e?.meta || null };
      console.warn("SEND ERROR:", sendError);
    }

    const sentAt = new Date().toISOString();
    const external_message_id = sendResult?.message_id || sendResult?.id || `local_${Date.now()}`;

    const msg = upsertMessageInMemory(workspaceId, threadId, {
      id: `mem_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      workspace_id: workspaceId,
      thread_id: threadId,
      channel_id: thread.channel_id,
      provider: thread.provider,
      platform: thread.platform,
      external_message_id: String(external_message_id),
      direction: "outbound",
      sender_external_id: req.auth.userId,
      sender_name: req.auth.email,
      message_type: "text",
      text,
      sent_at: sentAt,
      meta: sendResult ? { send: sendResult } : { send_error: sendError },
    });

    const updatedThread = upsertThreadInMemory(workspaceId, {
      ...thread,
      last_message_at: sentAt,
      last_message_snippet: text.slice(0, 200),
      updated_at: new Date().toISOString(),
    });

    emitToWorkspace(workspaceId, "thread_upsert", updatedThread);
    emitToWorkspace(workspaceId, "message_upsert", msg);

    res.json({ ok: true, message: msg, sendResult, sendError });
  } catch (e) {
    next(e);
  }
});

/**
 * ✅ SYNC META INBOX (FB + IG) -> MEMORY only
 * POST /api/workspaces/:workspaceId/inbox/sync/meta
 */
router.post("/workspaces/:workspaceId/inbox/sync/meta", requireAuth, requireWorkspaceAccess, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const provider = "meta";

    const igErrors = [];

    // ---------- FB Pages ----------
    const { data: fbPages, error: fbErr } = await supabase
      .from(T_CHANNELS)
      .select("id,external_id,display_name,platform,provider,status,meta")
      .eq("workspace_id", workspaceId)
      .eq("provider", provider)
      .eq("platform", "facebook")
      .eq("status", CHANNEL_STATUS_CONNECTED);

    if (fbErr) throw fbErr;

    let threadsUpserted = 0;
    let messagesUpserted = 0;

    for (const ch of fbPages || []) {
      const pageId = String(ch.external_id);
      const pageToken = await getTokenFromDB({ workspaceId, externalId: pageId, token_type: "page" });
      if (!pageToken) continue;

      const convos = await fetchAllPageConversations({ pageId, pageToken, maxConvos: 500 });

      for (const c of convos) {
        const externalThreadId = String(c.id);
        const updated = c.updated_time ? new Date(c.updated_time).toISOString() : new Date().toISOString();
        const snippet = String(c.snippet || "").slice(0, 200);

        const participants = c?.participants?.data || [];
        const other = participants.find((p) => String(p?.id || "") !== String(pageId)) || participants[0] || null;

        const participantExternalId = other?.id ? String(other.id) : null;
        const participantName = other?.name ? String(other.name) : "Messenger User";

        const threadId = buildThreadId({
          provider,
          platform: "facebook",
          channelExternalId: pageId,
          externalThreadId,
        });

        const thread = upsertThreadInMemory(workspaceId, {
          id: threadId,
          workspace_id: workspaceId,
          provider,
          platform: "facebook",
          channel_id: ch.id,
          channel: {
            id: ch.id,
            display_name: ch.display_name,
            external_id: pageId,
            platform: "facebook",
            provider,
            meta: ch.meta || {},
          },
          external_thread_id: externalThreadId,
          participant_external_id: participantExternalId,
          participant_name: participantName,
          participant_username: null,
          last_message_at: updated,
          last_message_snippet: snippet,
          status: "open",
          unread_count: 0,
          updated_at: new Date().toISOString(),
        });

        threadsUpserted += 1;
        emitToWorkspace(workspaceId, "thread_upsert", thread);

        const msgs = await fetchAllConversationMessages({
          conversationId: externalThreadId,
          pageToken,
          maxMsgs: 500,
        });

        let latestText = "";

        for (const m of msgs || []) {
          const mid = String(m.id);
          const created = m.created_time ? new Date(m.created_time).toISOString() : new Date().toISOString();

          const fromId = m?.from?.id ? String(m.from.id) : null;
          const fromName = m?.from?.name ? String(m.from.name) : null;
          const text = normalizeText(m.message);

          const direction = fromId && String(fromId) === String(pageId) ? "outbound" : "inbound";
          if (text) latestText = text;

          const msg = upsertMessageInMemory(workspaceId, threadId, {
            id: `mem_${Date.now()}_${Math.random().toString(16).slice(2)}`,
            workspace_id: workspaceId,
            thread_id: threadId,
            channel_id: ch.id,
            provider,
            platform: "facebook",
            external_message_id: mid,
            direction,
            sender_external_id: fromId,
            sender_name: fromName,
            message_type: "text",
            text,
            sent_at: created,
            meta: {},
          });

          messagesUpserted += 1;
          emitToWorkspace(workspaceId, "message_upsert", msg);
        }

        if (latestText) {
          const t2 = upsertThreadInMemory(workspaceId, {
            ...thread,
            last_message_snippet: latestText.slice(0, 200),
            updated_at: new Date().toISOString(),
          });
          emitToWorkspace(workspaceId, "thread_upsert", t2);
        }
      }
    }

    // ---------- Instagram ----------
    const { data: igAccounts, error: igErr } = await supabase
      .from(T_CHANNELS)
      .select("id,external_id,display_name,platform,provider,status,meta")
      .eq("workspace_id", workspaceId)
      .eq("provider", provider)
      .eq("platform", "instagram")
      .eq("status", CHANNEL_STATUS_CONNECTED);

    if (igErr) throw igErr;

    let igThreadsUpserted = 0;
    let igMessagesUpserted = 0;

    for (const igCh of igAccounts || []) {
      // instagram channel external_id = page_id, ig user id in meta.ig_user_id
      const pageId = String(igCh.external_id);
      const igUserId = String(igCh?.meta?.ig_user_id || "");

      if (!igUserId) {
        igErrors.push({
          pageId,
          message: "IG channel missing meta.ig_user_id (reconnect required)",
        });
        continue;
      }

      const pageToken = await getTokenFromDB({ workspaceId, externalId: pageId, token_type: "page" });
      if (!pageToken) continue;

      let convos = [];
      let usedFallback = false;

      try {
        convos = await fetchAllIgConversations({ igUserId, token: pageToken, maxConvos: 200 });
      } catch (e1) {
        // fallback via page conversations? (sometimes platform=instagram works)
        try {
          convos = await fetchAllPageConversations({
            pageId,
            pageToken,
            maxConvos: 200,
            platform: "instagram",
          });
          usedFallback = true;
        } catch (e2) {
          const code = e1?.meta?.code || e1?.meta?.error?.code || null;
          igErrors.push({
            igUserId,
            pageId,
            message: e1?.message || "IG conversations fetch failed",
            meta: e1?.meta || null,
            hint:
              Number(code) === 3
                ? "Meta app lacks Instagram Messaging capability (needs product setup + app review/permissions)."
                : "Check token scopes + app mode + IG professional account + permissions.",
            fallback_error: { message: e2?.message || "Fallback failed", meta: e2?.meta || null },
          });
          continue;
        }
      }

      for (const c of convos || []) {
        const externalThreadId = String(c.id);
        const updated = c.updated_time ? new Date(c.updated_time).toISOString() : new Date().toISOString();

        const participants = c?.participants?.data || [];
        const other = participants?.[0] || null;

        const participantExternalId = other?.id ? String(other.id) : null;
        const participantName = other?.username || other?.name ? String(other.username || other.name) : "IG User";

        const threadId = buildThreadId({
          provider,
          platform: "instagram",
          channelExternalId: pageId, // IMPORTANT: channelExternalId is pageId (your schema)
          externalThreadId,
        });

        const thread = upsertThreadInMemory(workspaceId, {
          id: threadId,
          workspace_id: workspaceId,
          provider,
          platform: "instagram",
          channel_id: igCh.id,
          channel: {
            id: igCh.id,
            display_name: igCh.display_name,
            external_id: pageId,
            platform: "instagram",
            provider,
            meta: igCh.meta || {},
          },
          external_thread_id: externalThreadId,
          participant_external_id: participantExternalId,
          participant_name: participantName,
          participant_username: other?.username ? String(other.username) : null,
          last_message_at: updated,
          last_message_snippet: "",
          status: "open",
          unread_count: 0,
          updated_at: new Date().toISOString(),
        });

        igThreadsUpserted += 1;
        emitToWorkspace(workspaceId, "thread_upsert", thread);

        let msgs = [];
        try {
          msgs = await fetchAllIgMessages({ conversationId: externalThreadId, token: pageToken, maxMsgs: 200 });
        } catch (e) {
          igErrors.push({
            igUserId,
            conversationId: externalThreadId,
            message: e?.message || "IG messages fetch failed",
            meta: e?.meta || null,
          });
          continue;
        }

        let latestText = "";

        for (const m of msgs || []) {
          const mid = String(m.id);
          const created = m.created_time ? new Date(m.created_time).toISOString() : new Date().toISOString();

          const fromId = m?.from?.id ? String(m.from.id) : null;
          const fromName = m?.from?.username || m?.from?.name ? String(m.from.username || m.from.name) : null;
          const text = normalizeText(m.message);

          // best-effort: treat as outbound if from is pageId or igUserId
          const direction =
            fromId && (String(fromId) === String(igUserId) || String(fromId) === String(pageId)) ? "outbound" : "inbound";

          if (text) latestText = text;

          const msg = upsertMessageInMemory(workspaceId, threadId, {
            id: `mem_${Date.now()}_${Math.random().toString(16).slice(2)}`,
            workspace_id: workspaceId,
            thread_id: threadId,
            channel_id: igCh.id,
            provider,
            platform: "instagram",
            external_message_id: mid,
            direction,
            sender_external_id: fromId,
            sender_name: fromName,
            message_type: "text",
            text,
            sent_at: created,
            meta: { usedFallback },
          });

          igMessagesUpserted += 1;
          emitToWorkspace(workspaceId, "message_upsert", msg);
        }

        if (latestText) {
          const t2 = upsertThreadInMemory(workspaceId, {
            ...thread,
            last_message_snippet: latestText.slice(0, 200),
            updated_at: new Date().toISOString(),
          });
          emitToWorkspace(workspaceId, "thread_upsert", t2);
        }
      }
    }

    return res.json({
      ok: true,
      threads_upserted: threadsUpserted,
      messages_upserted: messagesUpserted,
      ig_threads_upserted: igThreadsUpserted,
      ig_messages_upserted: igMessagesUpserted,
      ig_errors: igErrors,
      storage: "memory",
    });
  } catch (e) {
    console.error("SYNC ERROR:", e?.message, e?.meta || "");
    return res.status(400).json({ error: "SYNC_FAILED", message: e?.message || "Sync failed", meta: e?.meta || null });
  }
});

export default router;