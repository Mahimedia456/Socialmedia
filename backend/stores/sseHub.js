const sseClientsByWorkspace = new Map(); // Map<wsId, Set<res>>

function sseWrite(res, eventName, data) {
  res.write(`event: ${eventName}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function addSseClient(workspaceId, res) {
  const wsId = String(workspaceId || "");
  if (!sseClientsByWorkspace.has(wsId)) sseClientsByWorkspace.set(wsId, new Set());
  sseClientsByWorkspace.get(wsId).add(res);
}

export function removeSseClient(workspaceId, res) {
  const wsId = String(workspaceId || "");
  const set = sseClientsByWorkspace.get(wsId);
  if (!set) return;
  set.delete(res);
  if (!set.size) sseClientsByWorkspace.delete(wsId);
}

export function emitToWorkspace(workspaceId, eventName, payload) {
  const wsId = String(workspaceId || "");
  const set = sseClientsByWorkspace.get(wsId);
  if (!set || !set.size) return;

  for (const res of set) {
    try {
      sseWrite(res, eventName, payload);
    } catch {
      // ignore broken client
    }
  }
}

export function hello(res, payload) {
  sseWrite(res, "hello", payload);
}

export function ping(res) {
  sseWrite(res, "ping", { ts: Date.now() });
}