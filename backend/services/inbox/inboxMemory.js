// backend/services/inbox/inboxMemory.js

/**
 * Shared in-memory inbox store + SSE fanout.
 * Used by:
 * - routes/inbox.routes.js
 * - routes/meta.webhook.routes.js
 */

const inboxStore = new Map(); // Map<workspaceId, { threads: Map, messages: Map, updatedAt }>

// SSE clients: Map<workspaceId, Set<res>>
const sseClientsByWorkspace = new Map();

function getWsStore(workspaceId) {
  const ws = String(workspaceId || "");
  if (!ws) return null;
  if (!inboxStore.has(ws)) {
    inboxStore.set(ws, {
      threads: new Map(),
      messages: new Map(),
      updatedAt: Date.now(),
    });
  }
  return inboxStore.get(ws);
}

function buildThreadId({ provider, platform, channelExternalId, externalThreadId }) {
  return `${provider}:${platform}:${channelExternalId}:${externalThreadId}`;
}

function tsNum(v) {
  const t = v ? new Date(v).getTime() : 0;
  return Number.isFinite(t) ? t : 0;
}

function normalizeText(v) {
  return String(v || "").trim();
}

function upsertThreadInMemory(workspaceId, thread) {
  const ws = getWsStore(workspaceId);
  if (!ws) return null;
  ws.updatedAt = Date.now();
  ws.threads.set(thread.id, { ...ws.threads.get(thread.id), ...thread });
  return ws.threads.get(thread.id);
}

function upsertMessageInMemory(workspaceId, threadId, message) {
  const ws = getWsStore(workspaceId);
  if (!ws) return null;
  ws.updatedAt = Date.now();
  if (!ws.messages.has(threadId)) ws.messages.set(threadId, new Map());
  const bucket = ws.messages.get(threadId);

  const key =
    message.external_message_id
      ? `ext:${String(message.external_message_id)}`
      : message.id
      ? `id:${String(message.id)}`
      : `f:${String(message.direction)}:${String(message.sent_at)}:${String(message.text)}`;

  bucket.set(key, { ...bucket.get(key), ...message });
  return bucket.get(key);
}

function listThreadsFromMemory(workspaceId) {
  const ws = getWsStore(workspaceId);
  if (!ws) return [];
  return Array.from(ws.threads.values());
}

function listMessagesFromMemory(workspaceId, threadId) {
  const ws = getWsStore(workspaceId);
  if (!ws) return [];
  const bucket = ws.messages.get(threadId);
  if (!bucket) return [];
  return Array.from(bucket.values());
}

/* ===================== SSE ===================== */

function sseWrite(res, eventName, data) {
  res.write(`event: ${eventName}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function addSseClient(workspaceId, res) {
  const wsId = String(workspaceId || "");
  if (!sseClientsByWorkspace.has(wsId)) sseClientsByWorkspace.set(wsId, new Set());
  sseClientsByWorkspace.get(wsId).add(res);
}

function removeSseClient(workspaceId, res) {
  const wsId = String(workspaceId || "");
  const set = sseClientsByWorkspace.get(wsId);
  if (!set) return;
  set.delete(res);
  if (!set.size) sseClientsByWorkspace.delete(wsId);
}

function emitToWorkspace(workspaceId, eventName, payload) {
  const wsId = String(workspaceId || "");
  const set = sseClientsByWorkspace.get(wsId);
  if (!set || !set.size) return;

  for (const res of set) {
    try {
      sseWrite(res, eventName, payload);
    } catch {}
  }
}

export {
  inboxStore,
  getWsStore,
  buildThreadId,
  tsNum,
  normalizeText,
  upsertThreadInMemory,
  upsertMessageInMemory,
  listThreadsFromMemory,
  listMessagesFromMemory,
  sseWrite,
  addSseClient,
  removeSseClient,
  emitToWorkspace,
};