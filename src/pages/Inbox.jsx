// src/pages/Inbox.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import AppShell from "../components/AppShell.jsx";
import { createClient } from "@supabase/supabase-js";

function channelBadge(platform) {
  const p = String(platform || "").toLowerCase();
  if (p === "facebook") {
    return {
      label: "FACEBOOK",
      cls: "bg-[#1877F2]/20 text-[#1877F2]",
      iconBg: "bg-[#1877F2]",
      icon: "social_leaderboard",
    };
  }
  if (p === "instagram") {
    return {
      label: "INSTAGRAM",
      cls: "bg-pink-500/10 text-pink-300",
      iconBg: "bg-gradient-to-tr from-[#f9ce71] via-[#ee2a7b] to-[#6228d7]",
      icon: "camera",
    };
  }
  return {
    label: "CHANNEL",
    cls: "bg-white/10 text-white/70",
    iconBg: "bg-white/20",
    icon: "forum",
  };
}

function formatAgo(ts) {
  const t = ts ? new Date(ts).getTime() : 0;
  const ms = Date.now() - t;
  if (!t || ms < 0) return "";
  const m = Math.floor(ms / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function statusPill(status) {
  const s = String(status || "").toLowerCase();
  if (s === "pending") return "bg-yellow-500/10 text-yellow-500";
  if (s === "open") return "bg-primary/10 text-primary";
  if (s === "resolved") return "bg-emerald-500/10 text-emerald-400";
  return "bg-white/10 text-white/40";
}

function upsertById(list, row) {
  const id = row?.id;
  if (!id) return list;
  const idx = list.findIndex((x) => x.id === id);
  if (idx === -1) return [row, ...list];
  const next = list.slice();
  next[idx] = { ...next[idx], ...row };
  return next;
}

function removeById(list, id) {
  return list.filter((x) => x.id !== id);
}

export default function Inbox({ theme, setTheme }) {
  const API_BASE = import.meta.env.VITE_API_BASE;

  // Supabase client (anon)
  const supabase = useMemo(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !anon) return null;

    return createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 10 } },
    });
  }, []);

  const [workspaceId, setWorkspaceId] = useState(
    localStorage.getItem("active_workspace_id") || ""
  );
  const [workspaces, setWorkspaces] = useState([]);
  const [wsLoading, setWsLoading] = useState(false);
  const [wsErr, setWsErr] = useState("");

  const [platform, setPlatform] = useState("all");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");

  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [threadsErr, setThreadsErr] = useState("");

  const [activeThreadId, setActiveThreadId] = useState("");
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgErr, setMsgErr] = useState("");

  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  // REALTIME toggle
  const [realtimeOn, setRealtimeOn] = useState(true);
  const [rtStatus, setRtStatus] = useState("idle"); // idle | connecting | connected | error
  const [rtErr, setRtErr] = useState("");

  const endRef = useRef(null);

  function getAccessToken() {
    return localStorage.getItem("access_token") || "";
  }

  async function apiFetch(path, opts = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      ...opts,
      headers: {
        ...(opts.headers || {}),
        Authorization: `Bearer ${getAccessToken()}`,
        ...(opts.body ? { "Content-Type": "application/json" } : {}),
      },
    });

    const isJson = (res.headers.get("content-type") || "").includes("application/json");
    const payload = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const msg =
        (payload && typeof payload === "object" && (payload.message || payload.error)) ||
        (typeof payload === "string" ? payload : "") ||
        `Request failed: ${res.status}`;

      const meta =
        payload && typeof payload === "object" && payload.meta
          ? `\n\nMETA:\n${JSON.stringify(payload.meta, null, 2)}`
          : "";

      throw new Error(msg + meta);
    }
    return payload;
  }

  function selectWorkspace(id) {
    const wsId = String(id || "");
    setWorkspaceId(wsId);
    if (wsId) localStorage.setItem("active_workspace_id", wsId);
    else localStorage.removeItem("active_workspace_id");

    setThreads([]);
    setActiveThreadId("");
    setMessages([]);
    setReply("");
  }

  async function loadWorkspaces() {
    setWsLoading(true);
    setWsErr("");
    try {
      const j = await apiFetch("/api/workspaces");
      setWorkspaces(j?.workspaces || []);
    } catch (e) {
      setWsErr(String(e?.message || e));
      setWorkspaces([]);
    } finally {
      setWsLoading(false);
    }
  }

  async function loadThreads() {
    if (!workspaceId) return;
    setThreadsLoading(true);
    setThreadsErr("");
    try {
      const params = new URLSearchParams();
      params.set("platform", platform);
      params.set("status", status);
      if (q.trim()) params.set("q", q.trim());

      const j = await apiFetch(
        `/api/workspaces/${encodeURIComponent(workspaceId)}/inbox/threads?${params.toString()}`
      );

      const rows = j?.threads || [];
      setThreads(rows);

      if (!activeThreadId && rows.length) setActiveThreadId(rows[0].id);
      if (activeThreadId && !rows.find((t) => t.id === activeThreadId)) {
        setActiveThreadId(rows[0]?.id || "");
      }
    } catch (e) {
      setThreadsErr(String(e?.message || e));
      setThreads([]);
      setActiveThreadId("");
      setMessages([]);
    } finally {
      setThreadsLoading(false);
    }
  }

  async function loadMessages(threadId) {
    if (!threadId) return;
    setMsgLoading(true);
    setMsgErr("");
    try {
      const j = await apiFetch(
        `/api/inbox/threads/${encodeURIComponent(threadId)}/messages?limit=500`
      );
      setMessages(j?.messages || []);
    } catch (e) {
      setMsgErr(String(e?.message || e));
      setMessages([]);
    } finally {
      setMsgLoading(false);
    }
  }

  async function syncInbox() {
    if (!workspaceId) return;
    try {
      const r = await apiFetch(
        `/api/workspaces/${encodeURIComponent(workspaceId)}/inbox/sync/meta`,
        { method: "POST" }
      );

      const igWarn = (r?.ig_errors || []).length
        ? `\n\nIG Warning:\n${JSON.stringify(r.ig_errors, null, 2)}`
        : "";

      alert(
        `Sync done ✅\nThreads: ${r?.threads_upserted ?? 0}\nMessages: ${r?.messages_upserted ?? 0}\nIG Threads: ${r?.ig_threads_upserted ?? 0}\nIG Messages: ${r?.ig_messages_upserted ?? 0}${igWarn}`
      );
      await loadThreads();
    } catch (e) {
      alert(`Sync failed ❌\n${String(e?.message || e)}`);
    }
  }

  async function sendReply() {
    const text = reply.trim();
    if (!text || !activeThreadId) return;

    setSending(true);
    try {
      const j = await apiFetch(
        `/api/inbox/threads/${encodeURIComponent(activeThreadId)}/messages`,
        {
          method: "POST",
          body: JSON.stringify({ text }),
        }
      );

      const newMsg = j?.message;
      setReply("");

      // optimistic append (realtime will also arrive, but DB id differs; safe to keep)
      if (newMsg) setMessages((prev) => [...prev, newMsg]);

      await loadThreads();
      // messages will be updated by realtime, but keep a hard refresh for correctness
      await loadMessages(activeThreadId);
    } catch (e) {
      alert(String(e?.message || e));
    } finally {
      setSending(false);
    }
  }

  async function ensureRealtimeAuth() {
    if (!supabase || !workspaceId) return;

    setRtStatus("connecting");
    setRtErr("");

    try {
      const j = await apiFetch(
        `/api/workspaces/${encodeURIComponent(workspaceId)}/realtime/token`
      );

      const token = j?.token;
      if (!token) throw new Error("Realtime token missing from server");

      // Authorize realtime with custom JWT
      // supabase-js v2:
      supabase.realtime.setAuth(token);

      setRtStatus("connected");
    } catch (e) {
      setRtStatus("error");
      setRtErr(String(e?.message || e));
    }
  }

  // initial load
  useEffect(() => {
    loadWorkspaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reload threads when workspace/filters change
  useEffect(() => {
    if (!workspaceId) return;
    loadThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, platform, status]);

  // search debounce
  useEffect(() => {
    if (!workspaceId) return;
    const t = setTimeout(() => loadThreads(), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, workspaceId]);

  // load messages when thread changes
  useEffect(() => {
    if (!activeThreadId) {
      setMessages([]);
      return;
    }
    loadMessages(activeThreadId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThreadId]);

  // auto-scroll to bottom on new messages
  useEffect(() => {
    if (!activeThreadId) return;
    const t = setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
    return () => clearTimeout(t);
  }, [activeThreadId, messages.length]);

  // ---- REALTIME: threads subscription (workspace scope) ----
  useEffect(() => {
    if (!supabase || !workspaceId || !realtimeOn) return;

    let ch;

    (async () => {
      await ensureRealtimeAuth();

      ch = supabase
        .channel(`ws:${workspaceId}:threads`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "inbox_threads",
            filter: `workspace_id=eq.${workspaceId}`,
          },
          (payload) => {
            if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
              const row = payload.new;
              // keep ordering natural by refreshing snippet/time if it changes
              setThreads((prev) => {
                const next = upsertById(prev, row);
                // sort by last_message_at desc (null-safe)
                return next
                  .slice()
                  .sort((a, b) => (new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0)));
              });
            } else if (payload.eventType === "DELETE") {
              const id = payload.old?.id;
              if (id) setThreads((prev) => removeById(prev, id));
            }
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") setRtStatus("connected");
        });
    })();

    return () => {
      try {
        if (ch) supabase.removeChannel(ch);
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, workspaceId, realtimeOn]);

  // ---- REALTIME: messages subscription (active thread scope) ----
  useEffect(() => {
    if (!supabase || !workspaceId || !activeThreadId || !realtimeOn) return;

    let ch;

    (async () => {
      await ensureRealtimeAuth();

      ch = supabase
        .channel(`thread:${activeThreadId}:messages`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "inbox_messages",
            filter: `thread_id=eq.${activeThreadId}`,
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              const row = payload.new;
              setMessages((prev) => {
                // append in time order (sent_at ascending)
                const next = [...prev, row];
                next.sort((a, b) => new Date(a.sent_at || 0) - new Date(b.sent_at || 0));
                return next;
              });
            } else if (payload.eventType === "UPDATE") {
              const row = payload.new;
              setMessages((prev) => upsertById(prev, row).slice().sort(
                (a, b) => new Date(a.sent_at || 0) - new Date(b.sent_at || 0)
              ));
            } else if (payload.eventType === "DELETE") {
              const id = payload.old?.id;
              if (id) setMessages((prev) => removeById(prev, id));
            }
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") setRtStatus("connected");
        });
    })();

    return () => {
      try {
        if (ch) supabase.removeChannel(ch);
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, workspaceId, activeThreadId, realtimeOn]);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeThreadId) || null,
    [threads, activeThreadId]
  );
  const badge = channelBadge(activeThread?.platform);

  return (
    <AppShell theme={theme} setTheme={setTheme} active="inbox">
      <div className="flex flex-col h-[calc(100vh-0px)] min-h-0">
        {/* Header */}
        <div className="px-8 py-6 flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <h2 className="text-3xl font-bold text-[#E4E5E6] tracking-tight">Inbox</h2>
            <p className="text-white/50 text-sm mt-1">
              Manage conversations across all connected channels
            </p>

            <div className="mt-3 flex items-center gap-3 flex-wrap">
              <div className="text-xs text-white/50 font-semibold">Workspace</div>

              <select
                value={workspaceId}
                onChange={(e) => selectWorkspace(e.target.value)}
                className="bg-background-dark/60 border border-glass-border rounded-xl px-3 py-2 text-sm text-white/80 focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="">{wsLoading ? "Loading…" : "Select workspace…"}</option>
                {workspaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>

              {wsErr ? <span className="text-xs text-red-200">{wsErr}</span> : null}

              <span className="text-xs text-white/30">
                Platform{" "}
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="ml-2 bg-background-dark/60 border border-glass-border rounded-lg px-2 py-1 text-xs text-white/80"
                  disabled={!workspaceId}
                >
                  <option value="all">All</option>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                </select>
              </span>

              <span className="text-xs text-white/30">
                Status{" "}
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="ml-2 bg-background-dark/60 border border-glass-border rounded-lg px-2 py-1 text-xs text-white/80"
                  disabled={!workspaceId}
                >
                  <option value="all">All</option>
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                </select>
              </span>

              <button
                onClick={syncInbox}
                disabled={!workspaceId || threadsLoading}
                className="px-3 py-2 rounded-xl border border-glass-border text-white/80 text-xs font-bold hover:bg-white/5 disabled:opacity-50"
              >
                Sync Inbox
              </button>

              <button
                onClick={() => setRealtimeOn((v) => !v)}
                disabled={!workspaceId || !supabase}
                className="px-3 py-2 rounded-xl border border-glass-border text-white/80 text-xs font-bold hover:bg-white/5 disabled:opacity-50"
                title="Supabase Realtime"
              >
                Realtime: {realtimeOn ? "ON" : "OFF"}
              </button>

              <span className="text-[11px] text-white/30">
                RT: {rtStatus}
                {rtErr ? <span className="text-red-200"> • {rtErr}</span> : null}
              </span>
            </div>

            {threadsErr ? (
              <div className="mt-2 text-xs text-red-200/90 whitespace-pre-wrap">{threadsErr}</div>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadThreads}
              disabled={!workspaceId || threadsLoading}
              className="px-5 py-2.5 rounded-xl border border-glass-border text-white text-sm font-bold hover:bg-white/5 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
              Refresh
            </button>

            <button
              disabled
              className="px-5 py-2.5 rounded-xl btn-primary-gradient text-background-dark text-sm font-bold opacity-40 cursor-not-allowed flex items-center gap-2 shadow-lg shadow-primary/20"
              title="New outbound thread needs Send API + recipient discovery"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              New Message
            </button>
          </div>
        </div>

        {/* Split */}
        <div className="flex-1 min-h-0 px-8 pb-8 flex gap-6 overflow-hidden">
          {/* Left */}
          <div className="w-[35%] min-h-0 flex flex-col glass-panel rounded-2xl overflow-hidden border-glass-border">
            <div className="p-4 border-b border-glass-border space-y-3 shrink-0">
              <div className="relative">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full bg-background-dark/60 border-glass-border rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-white/30"
                  placeholder="Search conversations..."
                  type="text"
                  disabled={!workspaceId}
                />
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                  search
                </span>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
              {!workspaceId ? (
                <div className="p-8 text-center text-white/40 text-sm">Select a workspace first.</div>
              ) : threadsLoading ? (
                <div className="p-8 text-white/50 text-sm">Loading conversations…</div>
              ) : threads.length === 0 ? (
                <div className="p-8 text-center text-white/40 text-sm">
                  No conversations yet. Click <b>Sync Inbox</b> to backfill from Meta.
                </div>
              ) : (
                threads.map((t) => {
                  const isActive = t.id === activeThreadId;
                  const b = channelBadge(t.platform);

                  return (
                    <div
                      key={t.id}
                      onClick={() => setActiveThreadId(t.id)}
                      className={[
                        "relative group cursor-pointer transition-colors",
                        isActive ? "bg-primary/5 active-glow border-l-4 border-primary" : "hover:bg-white/5",
                      ].join(" ")}
                    >
                      <div className="p-4 border-b border-glass-border flex gap-3">
                        <div className="relative shrink-0">
                          <div className="size-12 rounded-full bg-white/10 flex items-center justify-center">
                            <span className="text-white/70 font-black text-sm">
                              {(t.participant_name || "U").slice(0, 1).toUpperCase()}
                            </span>
                          </div>

                          <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-background-dark flex items-center justify-center p-0.5">
                            <div className={`w-full h-full rounded-full flex items-center justify-center ${b.iconBg}`}>
                              <span className="material-symbols-outlined text-[10px] text-white">
                                {b.icon}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h4 className="text-sm font-bold text-white truncate">
                              {t.participant_name || "Customer"}
                            </h4>
                            <span className="text-[10px] text-white/40">{formatAgo(t.last_message_at)}</span>
                          </div>

                          <p className="text-xs text-white/70 line-clamp-1 mb-2">{t.last_message_snippet || "—"}</p>

                          <div className="flex items-center justify-between">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${statusPill(
                                t.status
                              )}`}
                            >
                              {String(t.status || "open")}
                            </span>

                            {Number(t.unread_count || 0) > 0 ? <div className="size-2 rounded-full bg-primary animate-pulse" /> : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right */}
          <div className="w-[65%] min-h-0 flex flex-col glass-panel rounded-2xl overflow-hidden border-glass-border">
            <div className="px-6 py-4 border-b border-glass-border flex items-center justify-between bg-white/5 shrink-0">
              <div className="flex items-center gap-4 min-w-0">
                <div className="size-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <span className="text-white/70 font-black">
                    {activeThread ? (activeThread.participant_name || "U").slice(0, 1).toUpperCase() : "—"}
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white leading-none truncate">
                      {activeThread ? activeThread.participant_name || "Customer" : "Select a conversation"}
                    </h3>

                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        activeThread ? badge.cls : "bg-white/10 text-white/40"
                      }`}
                    >
                      {activeThread ? badge.label : "CHANNEL"}
                    </span>
                  </div>

                  <p className="text-xs text-primary/70 mt-1 font-medium">
                    {activeThread
                      ? `Account: ${String(activeThread.platform || "").toUpperCase()} — ${
                          activeThread.channel?.external_id || activeThread.channel_id || "—"
                        }`
                      : "Select a thread to view messages"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled
                  className="px-3 py-1.5 rounded-lg bg-background-dark/60 border border-glass-border text-xs text-white/40 cursor-not-allowed flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">person_add</span>
                  Assign
                </button>
                <button
                  disabled
                  className="px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/30 text-xs text-primary/60 font-bold cursor-not-allowed"
                >
                  Mark as Resolved
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-8 space-y-8 flex flex-col">
              {!activeThread ? (
                <div className="text-white/40 text-sm">Select a conversation from the left.</div>
              ) : msgLoading ? (
                <div className="text-white/40 text-sm">Loading messages…</div>
              ) : msgErr ? (
                <div className="text-red-200/90 text-sm whitespace-pre-wrap">{msgErr}</div>
              ) : messages.length === 0 ? (
                <div className="text-white/40 text-sm">No messages yet.</div>
              ) : (
                messages.map((m) => {
                  const inbound = String(m.direction || "").toLowerCase() === "inbound";
                  return inbound ? (
                    <div key={m.id} className="flex items-start gap-4 max-w-[80%]">
                      <div className="size-8 rounded-full bg-white/10 shrink-0 flex items-center justify-center">
                        <span className="text-white/70 font-black text-xs">
                          {(activeThread.participant_name || "U").slice(0, 1).toUpperCase()}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="p-4 rounded-2xl rounded-tl-none glass-panel border-white/10 text-sm text-white/90 leading-relaxed">
                          {m.text || "—"}
                        </div>
                        <div className="text-[10px] text-white/30 flex items-center gap-2">
                          {m.sent_at ? new Date(m.sent_at).toLocaleTimeString() : ""} •{" "}
                          {m.sender_name || "User"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div key={m.id} className="flex items-start gap-4 max-w-[80%] self-end flex-row-reverse">
                      <div className="size-8 rounded-full bg-primary/20 shrink-0 border border-primary/30 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-sm">support_agent</span>
                      </div>
                      <div className="space-y-1 flex flex-col items-end">
                        <div className="p-4 rounded-2xl rounded-tr-none bg-primary/10 border border-primary/20 text-sm text-white/90 leading-relaxed">
                          {m.text || "—"}
                        </div>
                        <div className="text-[10px] text-primary/40 flex items-center gap-1">
                          {m.sent_at ? new Date(m.sent_at).toLocaleTimeString() : ""} • Sent
                          <span className="material-symbols-outlined text-[12px]">done_all</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={endRef} />
            </div>

            {/* Composer */}
            <div className="p-6 border-t border-glass-border bg-background-dark/80 shrink-0">
              <div className="flex gap-4">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  className="flex-1 bg-white/5 rounded-xl px-4 py-3 text-sm text-white/80 border border-white/5 h-24 resize-none outline-none"
                  placeholder="Select a conversation to reply..."
                  disabled={!activeThreadId || sending}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendReply();
                    }
                  }}
                />
                <button
                  onClick={sendReply}
                  disabled={!activeThreadId || !reply.trim() || sending}
                  className="size-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary disabled:opacity-40"
                  title="Send"
                >
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>

              <div className="mt-2 text-xs text-white/30">Enter to send • Shift+Enter for new line</div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}