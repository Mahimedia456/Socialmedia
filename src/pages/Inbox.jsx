// src/pages/Inbox.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import AppShell from "../components/AppShell.jsx";
import { supabase } from "../lib/supabaseClient"; // ✅ make sure this exists

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

function tsNum(v) {
  const t = v ? new Date(v).getTime() : 0;
  return Number.isFinite(t) ? t : 0;
}

function sortThreadsByLastMessageDesc(rows) {
  return (rows || [])
    .slice()
    .sort((a, b) => tsNum(b.last_message_at) - tsNum(a.last_message_at));
}

function sortMessagesBySentAsc(rows) {
  return (rows || [])
    .slice()
    .sort((a, b) => tsNum(a.sent_at) - tsNum(b.sent_at));
}

function makeMsgKey(m) {
  const ext = m?.external_message_id ? String(m.external_message_id) : "";
  const id = m?.id ? String(m.id) : "";
  if (ext) return `ext:${ext}`;
  if (id) return `id:${id}`;
  return `f:${String(m?.direction || "")}:${String(m?.sent_at || "")}:${String(m?.text || "")}`;
}

export default function Inbox({ theme, setTheme }) {
  const API_BASE = import.meta.env.VITE_API_BASE;

  const [workspaceId, setWorkspaceId] = useState(
    localStorage.getItem("active_workspace_id") || ""
  );
  const [workspaces, setWorkspaces] = useState([]);
  const [wsLoading, setWsLoading] = useState(false);
  const [wsErr, setWsErr] = useState("");

  const [platform, setPlatform] = useState("all");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");

  const [channels, setChannels] = useState([]);
  const [channelId, setChannelId] = useState("all");
  const [chLoading, setChLoading] = useState(false);

  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [threadsErr, setThreadsErr] = useState("");

  const [activeThreadId, setActiveThreadId] = useState("");
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgErr, setMsgErr] = useState("");

  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  // ✅ REALTIME toggle (Supabase Realtime)
  const [realtimeOn, setRealtimeOn] = useState(true);
  const [rtStatus, setRtStatus] = useState("idle"); // idle | connecting | connected | error
  const [rtErr, setRtErr] = useState("");

  const endRef = useRef(null);
  const rtRef = useRef({ ch1: null, ch2: null });

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
    setChannelId("all");
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

  async function loadChannels() {
    if (!workspaceId) return;
    setChLoading(true);
    try {
      const j = await apiFetch(
        `/api/workspaces/${encodeURIComponent(workspaceId)}/channels?provider=meta`
      );
      setChannels(j?.channels || []);
    } catch {
      setChannels([]);
    } finally {
      setChLoading(false);
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
      params.set("channelId", channelId);
      if (q.trim()) params.set("q", q.trim());

      const j = await apiFetch(
        `/api/workspaces/${encodeURIComponent(workspaceId)}/inbox/threads?${params.toString()}`
      );

      const rows = sortThreadsByLastMessageDesc(j?.threads || []);
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
      setMessages(sortMessagesBySentAsc(j?.messages || []));
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
        `Sync done ✅ (DB)\nThreads: ${r?.threads_upserted ?? 0}\nMessages: ${
          r?.messages_upserted ?? 0
        }\nIG Threads: ${r?.ig_threads_upserted ?? 0}\nIG Messages: ${
          r?.ig_messages_upserted ?? 0
        }${igWarn}`
      );

      await loadThreads();
      if (activeThreadId) await loadMessages(activeThreadId);
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
        { method: "POST", body: JSON.stringify({ text }) }
      );

      const newMsg = j?.message;
      setReply("");

      if (newMsg) {
        setMessages((prev) => {
          const map = new Map(prev.map((m) => [makeMsgKey(m), m]));
          map.set(makeMsgKey(newMsg), newMsg);
          return sortMessagesBySentAsc(Array.from(map.values()));
        });
      }

      await loadThreads();
      await loadMessages(activeThreadId);
    } catch (e) {
      alert(String(e?.message || e));
    } finally {
      setSending(false);
    }
  }

  // initial load
  useEffect(() => {
    loadWorkspaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // load channels when workspace changes
  useEffect(() => {
    if (!workspaceId) {
      setChannels([]);
      return;
    }
    loadChannels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  // reload threads when workspace/filters change
  useEffect(() => {
    if (!workspaceId) return;
    loadThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, platform, status, channelId]);

  // search debounce
  useEffect(() => {
    if (!workspaceId) return;
    const t = setTimeout(() => loadThreads(), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, workspaceId, platform, status, channelId]);

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

  // ✅ Supabase Realtime subscriptions (DB changes)
  useEffect(() => {
    // cleanup old channels
    try {
      rtRef.current.ch1?.unsubscribe?.();
      rtRef.current.ch2?.unsubscribe?.();
    } catch {}
    rtRef.current = { ch1: null, ch2: null };

    if (!workspaceId || !realtimeOn) {
      setRtStatus("idle");
      setRtErr("");
      return;
    }

    setRtStatus("connecting");
    setRtErr("");

    // 1) threads changes for this workspace
    const ch1 = supabase
      .channel(`rt_threads_${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "inbox_threads",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          const row = payload.new || payload.old;
          if (!row?.id) return;

          setThreads((prev) => {
            const next = [row, ...prev.filter((t) => String(t.id) !== String(row.id))];

            // keep current filters client-side (optional)
            let out = next;
            if (platform !== "all") out = out.filter((t) => String(t.platform) === platform);
            if (status !== "all") out = out.filter((t) => String(t.status) === status);
            if (channelId !== "all") out = out.filter((t) => String(t.channel_id) === channelId);

            return sortThreadsByLastMessageDesc(out);
          });
        }
      )
      .subscribe((st) => {
        if (st === "SUBSCRIBED") {
          setRtStatus("connected");
          setRtErr("");
        }
        if (st === "CHANNEL_ERROR" || st === "TIMED_OUT") {
          setRtStatus("error");
          setRtErr(String(st));
        }
      });

    // 2) messages inserts for active thread (recreate when activeThreadId changes)
    const ch2 = supabase
      .channel(`rt_msgs_${workspaceId}_${activeThreadId || "none"}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "inbox_messages",
          filter: activeThreadId ? `thread_id=eq.${activeThreadId}` : undefined,
        },
        (payload) => {
          const row = payload.new;
          if (!row) return;

          setMessages((prev) => {
            const map = new Map(prev.map((m) => [makeMsgKey(m), m]));
            map.set(makeMsgKey(row), row);
            return sortMessagesBySentAsc(Array.from(map.values()));
          });

          // also bump snippet ordering locally
          setThreads((prev) => {
            const idx = prev.findIndex((t) => String(t.id) === String(row.thread_id));
            if (idx === -1) return prev;
            const t = prev[idx];
            const next = prev.slice();
            next[idx] = {
              ...t,
              last_message_at: row.sent_at || t.last_message_at,
              last_message_snippet: row.text ? String(row.text).slice(0, 200) : t.last_message_snippet,
              updated_at: new Date().toISOString(),
            };
            return sortThreadsByLastMessageDesc(next);
          });
        }
      )
      .subscribe();

    rtRef.current = { ch1, ch2 };

    return () => {
      try {
        ch1?.unsubscribe?.();
        ch2?.unsubscribe?.();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, realtimeOn, activeThreadId, platform, status, channelId]);

  const activeThread = useMemo(
    () => threads.find((t) => String(t.id) === String(activeThreadId)) || null,
    [threads, activeThreadId]
  );
  const badge = channelBadge(activeThread?.platform);

  const connectedChannels = useMemo(() => {
    return (channels || [])
      .filter((c) => c?.status === "connected")
      .map((c) => ({
        id: c.id,
        label: `${String(c.platform || "").toUpperCase()} — ${c.display_name || c.external_id || c.id}`,
      }));
  }, [channels]);

 return (
  <AppShell theme={theme} setTheme={setTheme} active="inbox">
    <div className="h-[calc(100vh-0px)] min-h-0 flex flex-col overflow-hidden">
      {/* Top Bar (matches screenshot) */}
      <div className="shrink-0 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6 min-w-0">
          <div className="min-w-0">
            <div className="text-white/70 text-xs font-semibold">Workspace Inbox</div>
            <div className="text-white text-xl font-black tracking-tight">Inbox</div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-6 border-b border-white/10">
            <button className="text-sm font-bold text-primary pb-2 border-b-2 border-primary">
              All Messages
            </button>
            <button className="text-sm font-semibold text-white/50 hover:text-white/70 pb-2">
              Mentions
            </button>
            <button className="text-sm font-semibold text-white/50 hover:text-white/70 pb-2">
              Reviews
            </button>
          </div>
        </div>

        {/* Global search */}
        <div className="w-[420px] max-w-[40vw]">
          <div className="relative">
            <input
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-2.5 text-sm text-white/80 placeholder:text-white/30 focus:ring-1 focus:ring-primary focus:border-primary"
              placeholder="Global search..."
              type="text"
            />
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
              search
            </span>
          </div>
        </div>
      </div>

      {/* Control strip (keep your selects + sync + refresh + realtime) */}
      <div className="shrink-0 px-6 pb-4 flex items-center gap-3 flex-wrap">
        <div className="text-xs text-white/50 font-semibold">Workspace</div>
        <select
          value={workspaceId}
          onChange={(e) => selectWorkspace(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/80 focus:ring-1 focus:ring-primary focus:border-primary"
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
            className="ml-2 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white/80"
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
            className="ml-2 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white/80"
            disabled={!workspaceId}
          >
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
          </select>
        </span>

        <span className="text-xs text-white/30">
          Page{" "}
          <select
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            className="ml-2 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white/80"
            disabled={!workspaceId || chLoading}
          >
            <option value="all">{chLoading ? "Loading…" : "All Pages"}</option>
            {connectedChannels.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </span>

        <button
          onClick={syncInbox}
          disabled={!workspaceId || threadsLoading}
          className="px-3 py-2 rounded-xl border border-white/10 text-white/80 text-xs font-bold hover:bg-white/5 disabled:opacity-50"
        >
          Sync Inbox
        </button>

        <button
          onClick={loadThreads}
          disabled={!workspaceId || threadsLoading}
          className="px-3 py-2 rounded-xl border border-white/10 text-white/80 text-xs font-bold hover:bg-white/5 disabled:opacity-50 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          Refresh
        </button>

        <button
          onClick={() => setRealtimeOn((v) => !v)}
          disabled={!workspaceId}
          className="px-3 py-2 rounded-xl border border-white/10 text-white/80 text-xs font-bold hover:bg-white/5 disabled:opacity-50"
          title="Realtime via Supabase"
        >
          Realtime: {realtimeOn ? "ON" : "OFF"}
        </button>

        <span className="text-[11px] text-white/30">
          RT: {rtStatus}
          {rtErr ? <span className="text-red-200"> • {rtErr}</span> : null}
        </span>
      </div>

      {/* Main 3-column area */}
      <div className="flex-1 min-h-0 px-6 pb-6 flex gap-5 overflow-hidden">
        {/* Icon rail (matches screenshot left mini icons) */}
        <div className="w-[72px] shrink-0 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex flex-col items-center py-4 gap-3">
          <button className="size-11 rounded-2xl bg-primary/20 border border-primary/30 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined">apps</span>
          </button>
          <button className="size-11 rounded-2xl bg-white/0 hover:bg-white/5 border border-white/10 text-white/60 flex items-center justify-center">
            <span className="material-symbols-outlined">campaign</span>
          </button>
          <button className="size-11 rounded-2xl bg-white/0 hover:bg-white/5 border border-white/10 text-white/60 flex items-center justify-center">
            <span className="material-symbols-outlined">reviews</span>
          </button>
          <button className="size-11 rounded-2xl bg-white/0 hover:bg-white/5 border border-white/10 text-white/60 flex items-center justify-center">
            <span className="material-symbols-outlined">photo_camera</span>
          </button>
        </div>

        {/* Threads list */}
        <div className="w-[420px] max-w-[40vw] min-h-0 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex flex-col">
          {/* Search + pills */}
          <div className="p-4 border-b border-white/10 space-y-3 shrink-0">
            <div className="relative">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2 text-sm text-white/80 placeholder:text-white/30 focus:ring-1 focus:ring-primary focus:border-primary"
                placeholder="Search conversations..."
                type="text"
                disabled={!workspaceId}
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                search
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* These pills are UI-only (your actual filtering still uses Status select above) */}
              <span className="px-4 py-1.5 rounded-full bg-primary text-background-dark text-xs font-black">
                Open
              </span>
              <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/70">
                Pending
              </span>
              <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/70">
                Resolved
              </span>
            </div>

            {threadsErr ? (
              <div className="text-xs text-red-200/90 whitespace-pre-wrap">{threadsErr}</div>
            ) : null}
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
                const isActive = String(t.id) === String(activeThreadId);
                const b = channelBadge(t.platform);

                return (
                  <div
                    key={t.id}
                    onClick={() => setActiveThreadId(t.id)}
                    className={[
                      "cursor-pointer border-b border-white/10",
                      isActive ? "bg-primary/10" : "hover:bg-white/5",
                    ].join(" ")}
                  >
                    <div className="p-4 flex items-center gap-3">
                      {/* Avatar + channel icon */}
                      <div className="relative shrink-0">
                        <div className="size-11 rounded-full bg-white/10 flex items-center justify-center">
                          <span className="text-white/80 font-black text-sm">
                            {(t.participant_name || "U").slice(0, 1).toUpperCase()}
                          </span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-[#0b1f22] flex items-center justify-center p-[2px]">
                          <div className={`w-full h-full rounded-full flex items-center justify-center ${b.iconBg}`}>
                            <span className="material-symbols-outlined text-[10px] text-white">{b.icon}</span>
                          </div>
                        </div>
                      </div>

                      {/* Text */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-black text-white truncate">
                              {t.participant_name || "Customer"}
                            </div>
                            <div className="text-xs text-white/50 truncate">
                              {t.last_message_snippet || "—"}
                            </div>
                          </div>
                          <div className="text-[11px] text-white/40 shrink-0">
                            {formatAgo(t.last_message_at)}
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${statusPill(t.status)}`}>
                            {String(t.status || "open")}
                          </span>
                          {Number(t.unread_count || 0) > 0 ? (
                            <div className="size-2 rounded-full bg-primary animate-pulse" />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom left new message */}
          <div className="shrink-0 p-4">
            <button
              disabled
              className="w-full py-3 rounded-2xl bg-primary text-background-dark font-black opacity-40 cursor-not-allowed flex items-center justify-center gap-2"
              title="New outbound thread needs Send API + recipient discovery"
            >
              <span className="material-symbols-outlined">add</span>
              New Message
            </button>
          </div>
        </div>

        {/* Conversation panel */}
        <div className="flex-1 min-h-0 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <span className="text-white/80 font-black">
                  {activeThread ? (activeThread.participant_name || "U").slice(0, 1).toUpperCase() : "—"}
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="text-base font-black text-white truncate">
                    {activeThread ? activeThread.participant_name || "Customer" : "Select a conversation"}
                  </div>
                  {activeThread ? (
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${badge.cls}`}>
                      SYNCED VIA {badge.label}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-white/10 text-white/40">
                      CHANNEL
                    </span>
                  )}
                </div>

                <div className="text-xs text-white/40 mt-1 truncate">
                  {activeThread
                    ? `Account: ${String(activeThread.platform || "").toUpperCase()} — ${
                        activeThread.channel?.external_id || activeThread.channel_id || "—"
                      }`
                    : "Select a thread to view messages"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled
                className="px-4 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-black opacity-70 cursor-not-allowed"
              >
                Assign Agent
              </button>
              <button
                disabled
                className="px-4 py-2 rounded-full bg-primary text-background-dark text-xs font-black opacity-70 cursor-not-allowed"
              >
                Resolve Thread
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 space-y-6 flex flex-col">
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
                  <div key={m.id || makeMsgKey(m)} className="max-w-[70%]">
                    <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white/90 leading-relaxed">
                      {m.text || "—"}
                    </div>
                    <div className="mt-2 text-[10px] text-white/30">
                      {m.sent_at ? new Date(m.sent_at).toLocaleTimeString() : ""} • {m.sender_name || "User"}
                    </div>
                  </div>
                ) : (
                  <div key={m.id || makeMsgKey(m)} className="max-w-[70%] self-end text-right">
                    <div className="bg-primary/15 border border-primary/25 rounded-2xl px-5 py-4 text-sm text-white/90 leading-relaxed">
                      {m.text || "—"}
                    </div>
                    <div className="mt-2 text-[10px] text-primary/40 flex items-center justify-end gap-1">
                      {m.sent_at ? new Date(m.sent_at).toLocaleTimeString() : ""} • Sent{" "}
                      <span className="material-symbols-outlined text-[12px]">done_all</span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={endRef} />
          </div>

          {/* Composer (matches screenshot bottom) */}
          <div className="shrink-0 p-5 border-t border-white/10 bg-[#07191b]">
            <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
              <div className="px-4 py-3 flex items-center gap-3 border-b border-white/10 text-white/50">
                <button className="hover:text-white/70">
                  <span className="material-symbols-outlined text-[18px]">format_bold</span>
                </button>
                <button className="hover:text-white/70">
                  <span className="material-symbols-outlined text-[18px]">attach_file</span>
                </button>
                <button className="hover:text-white/70">
                  <span className="material-symbols-outlined text-[18px]">image</span>
                </button>
                <span className="w-px h-5 bg-white/10" />
                <button className="hover:text-white/70">
                  <span className="material-symbols-outlined text-[18px]">bolt</span>
                </button>
              </div>

              <div className="p-4 flex items-end gap-4">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-white/80 placeholder:text-white/30 outline-none resize-none h-20"
                  placeholder="Type your response..."
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
                  className="px-6 py-3 rounded-full bg-primary text-background-dark font-black disabled:opacity-40"
                >
                  Send Message →
                </button>
              </div>

              <div className="px-4 pb-3 text-[11px] text-white/30 flex items-center justify-between">
                <span>Enter to send • Shift+Enter for new line</span>
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-primary/70" />
                  Syncing with Facebook...
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppShell>
);
}