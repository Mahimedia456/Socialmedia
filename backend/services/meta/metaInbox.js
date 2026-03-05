import { upsertThread, upsertMessage, buildThreadId } from "../../stores/inboxStore.js";
import { emitToWorkspace } from "../../stores/sseHub.js";

export async function upsertInboundThreadAndMessageMemory({
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
  const externalThreadId = `p_${String(participantExternalId || "unknown")}`;

  const threadId = buildThreadId({
    provider,
    platform,
    channelExternalId: channel.external_id,
    externalThreadId,
  });

  const snippet = String(text || "").slice(0, 200);

  const thread = upsertThread(workspaceId, {
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

  const msg = upsertMessage(workspaceId, threadId, {
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