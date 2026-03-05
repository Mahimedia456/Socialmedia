const inboxStore = new Map();
/**
 * Map<workspaceId, { threads: Map<threadId, thread>, messages: Map<threadId, Map<msgKey, msg>>, updatedAt }>
 */

function getWsStore(workspaceId) {
  const ws = String(workspaceId || "");
  if (!ws) return null;
  if (!inboxStore.has(ws)) {
    inboxStore.set(ws, { threads: new Map(), messages: new Map(), updatedAt: Date.now() });
  }
  return inboxStore.get(ws);
}

export function buildThreadId({ provider, platform, channelExternalId, externalThreadId }) {
  return `${provider}:${platform}:${channelExternalId}:${externalThreadId}`;
}

export function tsNum(v) {
  const t = v ? new Date(v).getTime() : 0;
  return Number.isFinite(t) ? t : 0;
}

export function normalizeText(v) {
  return String(v || "").trim();
}

export function upsertThread(workspaceId, thread) {
  const ws = getWsStore(workspaceId);
  if (!ws) return null;
  ws.updatedAt = Date.now();
  ws.threads.set(thread.id, { ...ws.threads.get(thread.id), ...thread });
  return ws.threads.get(thread.id);
}

export function upsertMessage(workspaceId, threadId, message) {
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

export function listThreads(workspaceId) {
  const ws = getWsStore(workspaceId);
  if (!ws) return [];
  return Array.from(ws.threads.values());
}

export function listMessages(workspaceId, threadId) {
  const ws = getWsStore(workspaceId);
  if (!ws) return [];
  const bucket = ws.messages.get(threadId);
  if (!bucket) return [];
  return Array.from(bucket.values());
}

export function findWorkspaceByThreadId(threadId) {
  for (const [wsId, ws] of inboxStore.entries()) {
    if (ws.threads.has(threadId)) return wsId;
  }
  return "";
}