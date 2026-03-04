// src/pages/Publisher.jsx
import React, { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell.jsx";
import { getSession } from "../lib/api.js"; // adjust if your session getter differs

const ICON_BY_PLATFORM = {
  facebook: { icon: "social_leaderboard", cls: "bg-blue-600/20 border-blue-600/40 text-blue-400" },
  instagram: { icon: "photo_camera", cls: "bg-pink-600/20 border-pink-600/40 text-pink-400" },
};

async function apiFetch(path, { method = "GET", body } = {}) {
  const s = getSession?.();
  const token = s?.access_token || s?.accessToken || s?.token || "";
  const r = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.message || j?.error || "Request failed");
  return j;
}

export default function Publisher({ theme, setTheme }) {
  const [activeTab, setActiveTab] = useState("text");

  const [workspaces, setWorkspaces] = useState([]);
  const [workspaceId, setWorkspaceId] = useState("");

  const [channels, setChannels] = useState([]);
  const [selectedChannelIds, setSelectedChannelIds] = useState(() => new Set());

  const [text, setText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState(""); // needed for IG publishing
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [drafts, setDrafts] = useState([]);
  const [scheduled, setScheduled] = useState([]);

  const count = useMemo(() => (text || "").length, [text]);
  const limit = 280;

  const selectedChannels = useMemo(() => {
    const set = selectedChannelIds;
    return channels.filter((c) => set.has(c.id));
  }, [channels, selectedChannelIds]);

  const needsIgImage = useMemo(() => {
    return selectedChannels.some((c) => c.platform === "instagram");
  }, [selectedChannels]);

  const toggleChannel = (id) => {
    setSelectedChannelIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  async function loadWorkspaces() {
    const j = await apiFetch("/api/workspaces");
    setWorkspaces(j.workspaces || []);
    if (!workspaceId && (j.workspaces || []).length) {
      setWorkspaceId(String(j.workspaces[0].id));
    }
  }

  async function loadChannels(wsId) {
    if (!wsId) return;
    const j = await apiFetch(`/api/workspaces/${wsId}/publisher/channels`);
    setChannels(j.channels || []);
    setSelectedChannelIds(new Set());
  }

  async function loadLists(wsId) {
    if (!wsId) return;
    const [d, s] = await Promise.all([
      apiFetch(`/api/workspaces/${wsId}/publisher/posts/drafts`),
      apiFetch(`/api/workspaces/${wsId}/publisher/posts/scheduled`),
    ]);
    setDrafts(d.posts || []);
    setScheduled(s.posts || []);
  }

  useEffect(() => {
    loadWorkspaces().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!workspaceId) return;
    loadChannels(workspaceId).catch(console.error);
    loadLists(workspaceId).catch(console.error);
  }, [workspaceId]);

  function buildScheduledISO() {
    if (!date || !time) return null;
    // interpret as local time
    const iso = new Date(`${date}T${time}:00`).toISOString();
    return iso;
  }

  async function createPost(action) {
    if (!workspaceId) throw new Error("Select workspace.");
    if (!selectedChannelIds.size) throw new Error("Select at least one channel.");

    if (needsIgImage && !imageUrl) {
      throw new Error("Instagram publishing requires an Image URL (feed posts can’t be text-only).");
    }

    const body = {
      action, // draft | scheduled | publish_now
      content_type: activeTab,
      text,
      link_url: activeTab === "link" ? linkUrl : "",
      media_urls: imageUrl ? [imageUrl] : [],
      scheduled_at: action === "scheduled" ? buildScheduledISO() : null,
      channel_ids: Array.from(selectedChannelIds),
    };

    const j = await apiFetch(`/api/workspaces/${workspaceId}/publisher/posts`, {
      method: "POST",
      body,
    });

    await loadLists(workspaceId);
    return j;
  }

  return (
    <AppShell theme={theme} setTheme={setTheme} active="publisher" topTitle={null}>
      <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
        {/* Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">Publisher</h2>
            <p className="text-slate-400 mt-1 font-medium">
              Create and schedule posts across your connected channels
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-5 py-2.5 border border-primary/40 text-primary text-sm font-bold rounded-lg hover:bg-primary/5 transition-all">
              View calendar
            </button>

            <button
              onClick={() => {
                setText("");
                setLinkUrl("");
                setImageUrl("");
              }}
              className="px-5 py-2.5 cyan-gradient text-white text-sm font-bold rounded-lg shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              New post
            </button>
          </div>
        </div>

        {/* Workspace selector */}
        <section className="mb-6">
          <div className="glass-card rounded-xl p-5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
              Workspace
            </label>
            <select
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              className="w-full bg-background-dark/40 border border-border-glass rounded-lg px-4 py-3 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Composer */}
        <section className="mb-10">
          <div className="glass-card rounded-xl p-8 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Left */}
              <div className="lg:col-span-7 space-y-6">
                {/* Channel Selection (dynamic from DB) */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-3">
                    Select Pages / Accounts
                  </label>

                  <div className="flex flex-wrap gap-2">
                    {channels.map((c) => {
                      const on = selectedChannelIds.has(c.id);
                      const style = ICON_BY_PLATFORM[c.platform] || {
                        icon: "hub",
                        cls: "bg-white/5 border-white/10 text-slate-400",
                      };

                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleChannel(c.id)}
                          className={[
                            "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold transition-all",
                            on ? style.cls : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10",
                          ].join(" ")}
                          title={`${c.platform} • ${c.external_id}`}
                        >
                          <span className="material-symbols-outlined text-lg">{style.icon}</span>
                          <span className="truncate max-w-[240px]">{c.display_name}</span>
                        </button>
                      );
                    })}
                  </div>

                  {needsIgImage ? (
                    <div className="mt-3 text-[11px] text-amber-300 font-bold">
                      Instagram feed publishing needs an Image URL (text-only is not allowed).
                    </div>
                  ) : null}
                </div>

                {/* Tabs */}
                <div>
                  <div className="flex border-b border-border-glass mb-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab("text")}
                      className={[
                        "px-6 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all",
                        activeTab === "text" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-300",
                      ].join(" ")}
                    >
                      Text
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("link")}
                      className={[
                        "px-6 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all",
                        activeTab === "link" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-300",
                      ].join(" ")}
                    >
                      Link
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("image")}
                      className={[
                        "px-6 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all",
                        activeTab === "image" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-300",
                      ].join(" ")}
                    >
                      Image
                    </button>
                  </div>

                  {/* Text */}
                  <div className="relative group">
                    <textarea
                      className="w-full bg-background-dark/40 border border-border-glass rounded-xl p-4 text-sm text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                      placeholder="What would you like to share?"
                      rows={6}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      maxLength={limit}
                    />
                    <div className="absolute bottom-4 right-4 text-[10px] font-bold text-slate-500">
                      {count} / {limit}
                    </div>
                  </div>

                  {/* Link URL */}
                  {activeTab === "link" ? (
                    <div className="mt-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Link URL</label>
                      <input
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="https://..."
                        className="mt-2 w-full bg-background-dark/40 border border-border-glass rounded-lg px-4 py-3 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                  ) : null}

                  {/* Image URL (simple + works everywhere; later you can upload to storage) */}
                  {activeTab === "image" || needsIgImage ? (
                    <div className="mt-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">
                        Image URL (required for Instagram)
                      </label>
                      <input
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://yourcdn.com/image.jpg"
                        className="mt-2 w-full bg-background-dark/40 border border-border-glass rounded-lg px-4 py-3 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
                      />
                      <p className="mt-2 text-[11px] text-slate-500">
                        Tip: use a public HTTPS image URL. Later we can add upload to Supabase Storage.
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Right */}
              <div className="lg:col-span-5 border-l border-border-glass pl-0 lg:pl-10 space-y-8">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-4">
                    Schedule Settings
                  </label>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      Set Date &amp; Time
                    </label>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary text-lg">
                          calendar_today
                        </span>
                        <input
                          className="w-full bg-background-dark/40 border border-border-glass rounded-lg pl-10 pr-4 py-2 text-xs text-white focus:ring-1 focus:ring-primary outline-none"
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                        />
                      </div>

                      <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary text-lg">
                          schedule
                        </span>
                        <input
                          className="w-full bg-background-dark/40 border border-border-glass rounded-lg pl-10 pr-4 py-2 text-xs text-white focus:ring-1 focus:ring-primary outline-none"
                          type="time"
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border-glass flex flex-col gap-3">
                  <button
                    onClick={async () => {
                      try {
                        await createPost("publish_now");
                        alert("Published (or attempted). Check logs/targets.");
                      } catch (e) {
                        alert(e.message);
                      }
                    }}
                    className="w-full py-3 cyan-gradient text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-lg shadow-primary/10 hover:opacity-90 transition-all"
                  >
                    Publish now
                  </button>

                  <button
                    onClick={async () => {
                      try {
                        await createPost("scheduled");
                        alert("Scheduled.");
                      } catch (e) {
                        alert(e.message);
                      }
                    }}
                    className="w-full py-3 bg-white/5 text-slate-300 border border-border-glass text-xs font-black uppercase tracking-widest rounded-lg hover:bg-white/10 transition-all"
                  >
                    Schedule post
                  </button>

                  <button
                    onClick={async () => {
                      try {
                        await createPost("draft");
                        alert("Draft saved.");
                      } catch (e) {
                        alert(e.message);
                      }
                    }}
                    className="w-full py-3 bg-white/5 text-slate-300 border border-border-glass text-xs font-black uppercase tracking-widest rounded-lg hover:bg-white/10 transition-all"
                  >
                    Save draft
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Drafts */}
          <div className="glass-card rounded-xl flex flex-col h-96">
            <div className="p-5 border-b border-border-glass flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">drafts</span>
                <h3 className="text-sm font-bold text-white">Drafts</h3>
              </div>
              <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-black rounded">
                {drafts.length} TOTAL
              </span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <tr>
                    <th className="px-5 py-3 border-b border-border-glass">Preview</th>
                    <th className="px-5 py-3 border-b border-border-glass text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {drafts.map((p) => (
                    <tr key={p.id} className="border-b border-border-glass/50 hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4 font-medium text-slate-300 truncate max-w-[260px]">
                        {(p.text || p.link_url || "").slice(0, 80) || "(empty)"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={async () => {
                              try {
                                await apiFetch(`/api/workspaces/${workspaceId}/publisher/posts/${p.id}/publish`, {
                                  method: "POST",
                                });
                                await loadLists(workspaceId);
                                alert("Published (or attempted).");
                              } catch (e) {
                                alert(e.message);
                              }
                            }}
                            className="size-7 rounded bg-white/5 flex items-center justify-center hover:bg-primary/20 text-slate-400 hover:text-primary transition-all"
                            title="Publish now"
                          >
                            <span className="material-symbols-outlined text-sm">send</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!drafts.length ? (
                    <tr>
                      <td className="px-5 py-8 text-slate-500" colSpan={2}>
                        No drafts.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          {/* Scheduled */}
          <div className="glass-card rounded-xl flex flex-col h-96">
            <div className="p-5 border-b border-border-glass flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">event_available</span>
                <h3 className="text-sm font-bold text-white">Scheduled</h3>
              </div>
              <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-black rounded">
                {scheduled.length} UPCOMING
              </span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-3">
              {scheduled.map((p) => (
                <div
                  key={p.id}
                  className="flex gap-4 p-3 bg-white/5 border border-border-glass rounded-lg hover:border-primary/30 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-xs font-bold text-white truncate">
                        {(p.text || p.link_url || "").slice(0, 60) || "Scheduled post"}
                      </p>
                      <span className="text-[10px] font-bold text-slate-400 shrink-0">
                        {p.scheduled_at ? new Date(p.scheduled_at).toLocaleString() : ""}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {p.content_type} • status: {p.status}
                    </div>
                  </div>
                </div>
              ))}
              {!scheduled.length ? (
                <div className="text-slate-500 text-sm">No scheduled posts.</div>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}