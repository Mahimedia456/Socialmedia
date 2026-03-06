import React, { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell.jsx";
import { apiFetch, getActiveWorkspaceId, setActiveWorkspaceId } from "../lib/api.js";

const ICON_BY_PLATFORM = {
  facebook: {
    icon: "social_leaderboard",
    cls: "bg-blue-600/20 border-blue-600/40 text-blue-400",
  },
  instagram: {
    icon: "photo_camera",
    cls: "bg-pink-600/20 border-pink-600/40 text-pink-400",
  },
};

function cn(...a) {
  return a.filter(Boolean).join(" ");
}

export default function Publisher({ theme, setTheme }) {
  const [topTab, setTopTab] = useState("drafts"); // drafts | scheduled | sent

  const [postType, setPostType] = useState("text"); // text | image | video | link
  const [text, setText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const [imageUrl, setImageUrl] = useState("");
  const [assets, setAssets] = useState([]);

  const [scheduleOn, setScheduleOn] = useState(true);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [workspaces, setWorkspaces] = useState([]);
  const [workspaceId, setWorkspaceIdState] = useState(getActiveWorkspaceId() || "");
  const [channels, setChannels] = useState([]);
  const [selectedChannelIds, setSelectedChannelIds] = useState(() => new Set());

  const [drafts, setDrafts] = useState([]);
  const [scheduled, setScheduled] = useState([]);
  const [published, setPublished] = useState([]);

  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [loadingLists, setLoadingLists] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const limit = 280;
  const count = useMemo(() => (text || "").length, [text]);

  const selectedChannels = useMemo(() => {
    const set = selectedChannelIds;
    return channels.filter((c) => set.has(c.id));
  }, [channels, selectedChannelIds]);

  const needsIgImage = useMemo(() => {
    return selectedChannels.some((c) => c.platform === "instagram");
  }, [selectedChannels]);

  function setWorkspaceId(id) {
    const wsId = String(id || "");
    setWorkspaceIdState(wsId);
    setActiveWorkspaceId(wsId);
  }

  const toggleChannel = (id) => {
    setSelectedChannelIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  function buildScheduledISO() {
    if (!date || !time) return null;
    return new Date(`${date}T${time}:00`).toISOString();
  }

  async function loadWorkspaces() {
    setLoadingWorkspaces(true);
    setErr("");
    try {
      const j = await apiFetch("/api/workspaces");
      const rows = j?.workspaces || [];
      setWorkspaces(rows);

      if (!rows.length) {
        setWorkspaceId("");
        return;
      }

      const existing = workspaceId || getActiveWorkspaceId();
      const exists = rows.some((w) => String(w.id) === String(existing));

      if (exists) {
        setWorkspaceId(existing);
      } else {
        setWorkspaceId(String(rows[0].id));
      }
    } catch (e) {
      setErr(String(e?.message || e));
      setWorkspaces([]);
    } finally {
      setLoadingWorkspaces(false);
    }
  }

  async function loadChannels(wsId) {
    if (!wsId) {
      setChannels([]);
      return;
    }

    setLoadingChannels(true);
    setErr("");
    try {
      const j = await apiFetch(
        `/api/workspaces/${encodeURIComponent(wsId)}/publisher/channels?provider=meta`
      );
      const rows = j?.channels || [];
      setChannels(rows);

      setSelectedChannelIds((prev) => {
        const next = new Set();
        const validIds = new Set(rows.map((c) => c.id));
        for (const id of prev) {
          if (validIds.has(id)) next.add(id);
        }
        return next;
      });
    } catch (e) {
      setErr(String(e?.message || e));
      setChannels([]);
      setSelectedChannelIds(new Set());
    } finally {
      setLoadingChannels(false);
    }
  }

  async function loadLists(wsId) {
    if (!wsId) {
      setDrafts([]);
      setScheduled([]);
      setPublished([]);
      return;
    }

    setLoadingLists(true);
    setErr("");
    try {
      const [d, s] = await Promise.all([
        apiFetch(`/api/workspaces/${encodeURIComponent(wsId)}/publisher/posts/drafts`),
        apiFetch(`/api/workspaces/${encodeURIComponent(wsId)}/publisher/posts/scheduled`),
      ]);

      setDrafts(d?.posts || []);
      setScheduled(s?.posts || []);

      // published endpoint abhi backend mein nahi hai, to sent tab ko placeholder/feed style rakhenge
      setPublished([]);
    } catch (e) {
      setErr(String(e?.message || e));
      setDrafts([]);
      setScheduled([]);
      setPublished([]);
    } finally {
      setLoadingLists(false);
    }
  }

  useEffect(() => {
    loadWorkspaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!workspaceId) return;
    loadChannels(workspaceId);
    loadLists(workspaceId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  async function createPost(action) {
    if (!workspaceId) throw new Error("Select workspace.");
    if (!selectedChannelIds.size) throw new Error("Select at least one page/account.");

    if (needsIgImage && !imageUrl) {
      throw new Error("Instagram feed publishing requires an Image URL (public HTTPS).");
    }

    if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
      throw new Error("Image URL must start with http:// or https://");
    }

    if (postType === "link" && linkUrl && !/^https?:\/\//i.test(linkUrl)) {
      throw new Error("Link URL must start with http:// or https://");
    }

    if (action === "scheduled") {
      const iso = buildScheduledISO();
      if (!iso) throw new Error("Select schedule Date and Time.");
    }

    const body = {
      action, // draft | scheduled | publish_now
      content_type: postType,
      text,
      link_url: postType === "link" ? linkUrl : "",
      media_urls: imageUrl ? [imageUrl] : [],
      scheduled_at: action === "scheduled" ? buildScheduledISO() : null,
      channel_ids: Array.from(selectedChannelIds),
    };

    const j = await apiFetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/publisher/posts`, {
      method: "POST",
      body,
    });

    await loadLists(workspaceId);
    return j;
  }

  function resetComposer() {
    setPostType("text");
    setText("");
    setLinkUrl("");
    setImageUrl("");
    setAssets([]);
    setDate("");
    setTime("");
    setScheduleOn(true);
    setSelectedChannelIds(new Set());
    setErr("");
  }

  const previewText =
    text?.trim() ||
    (postType === "link" && linkUrl ? `Check this out: ${linkUrl}` : "") ||
    "Write something to preview…";

  const previewImage = imageUrl || assets?.[0] || "";

  async function handlePrimaryAction() {
    try {
      setSubmitting(true);
      setErr("");

      if (scheduleOn) {
        await createPost("scheduled");
        alert("Scheduled successfully.");
      } else {
        await createPost("publish_now");
        alert("Published successfully.");
      }
    } catch (e) {
      setErr(String(e?.message || e));
      alert(String(e?.message || e));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveDraft() {
    try {
      setSubmitting(true);
      setErr("");
      await createPost("draft");
      alert("Draft saved.");
    } catch (e) {
      setErr(String(e?.message || e));
      alert(String(e?.message || e));
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePublishDraft(postId) {
    try {
      setSubmitting(true);
      setErr("");
      await apiFetch(
        `/api/workspaces/${encodeURIComponent(workspaceId)}/publisher/posts/${encodeURIComponent(postId)}/publish`,
        {
          method: "POST",
          body: {},
        }
      );
      await loadLists(workspaceId);
      alert("Published successfully.");
    } catch (e) {
      setErr(String(e?.message || e));
      alert(String(e?.message || e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell theme={theme} setTheme={setTheme} active="publisher" topTitle={null}>
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-background-dark/50 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <h2 className="text-lg font-bold text-white">New Post</h2>

            <nav className="flex items-center gap-1 bg-black/30 p-1 rounded-lg border border-white/5">
              <button
                type="button"
                onClick={() => setTopTab("drafts")}
                className={cn(
                  "px-4 py-1.5 text-xs font-semibold rounded-md transition-colors",
                  topTab === "drafts" ? "bg-primary text-background-dark" : "text-slate-400 hover:text-white"
                )}
              >
                Drafts
              </button>
              <button
                type="button"
                onClick={() => setTopTab("scheduled")}
                className={cn(
                  "px-4 py-1.5 text-xs font-semibold rounded-md transition-colors",
                  topTab === "scheduled" ? "bg-primary text-background-dark" : "text-slate-400 hover:text-white"
                )}
              >
                Scheduled
              </button>
              <button
                type="button"
                onClick={() => setTopTab("sent")}
                className={cn(
                  "px-4 py-1.5 text-xs font-semibold rounded-md transition-colors",
                  topTab === "sent" ? "bg-primary text-background-dark" : "text-slate-400 hover:text-white"
                )}
              >
                Sent
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">
                search
              </span>
              <input
                className="bg-black/30 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none w-64 text-slate-200"
                placeholder="Search assets..."
                type="text"
              />
            </div>

            <button
              type="button"
              onClick={resetComposer}
              className="px-4 py-2 rounded-xl border border-white/5 bg-white/5 text-slate-200 text-xs font-bold hover:bg-white/10 transition-all"
              title="Reset composer"
            >
              Reset
            </button>

            <div className="size-8 rounded-full overflow-hidden border border-primary/20">
              <img
                className="w-full h-full object-cover"
                alt="User avatar"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDBTPQjjm_YS9lOkrXh7Xp081b-SiK07VbVLFSCkFrfQlnR3rHoDg5GYEVb0TdDmzSBsBKL_4o1ScXD2W54w3V_mx-77qp7ymtOil1oXWCR2a9ssLW-tzNFCMdg1mjzvyH84UX0QJWcl8MnNDSD9UHVNA_aXRWTK1i3DUNbAjjS46S-TAN2q5Kf5Yuq5-zx7vdKnC4RZ99bw_ghhBc2tzdeTtcouHs-1duc7mJ4YShRANMks7nWRLEhtMRYrtfZF_2a5sqLtvvGeOA"
              />
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <section className="flex-1 border-r border-white/5 flex flex-col custom-scrollbar overflow-y-auto p-8 bg-background-dark min-w-0">
            {err ? (
              <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {err}
              </div>
            ) : null}

            <div className="mb-8">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">
                Workspace
              </h3>
              <select
                value={workspaceId}
                onChange={(e) => setWorkspaceId(e.target.value)}
                disabled={loadingWorkspaces}
                className="w-full bg-black/30 border border-white/5 rounded-2xl px-4 py-3 text-sm text-slate-200 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              >
                {!workspaces.length ? (
                  <option value="">
                    {loadingWorkspaces ? "Loading workspaces..." : "No workspaces found"}
                  </option>
                ) : null}
                {workspaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">
                Platforms & Pages
              </h3>

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
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all",
                        "bg-black/20 hover:bg-white/5",
                        on ? style.cls : "border-white/5 text-slate-400"
                      )}
                      title={`${c.platform} • ${c.external_id}`}
                    >
                      <span className="material-symbols-outlined text-lg">{style.icon}</span>
                      <span className="truncate max-w-[300px]">{c.display_name}</span>
                    </button>
                  );
                })}
              </div>

              {!loadingChannels && !channels.length ? (
                <div className="mt-3 text-[11px] text-slate-500">
                  No connected publishing channels found for this workspace.
                </div>
              ) : null}

              {needsIgImage ? (
                <div className="mt-3 text-[11px] text-amber-300 font-bold">
                  Instagram selected → Image URL is required.
                </div>
              ) : null}
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">
                Post Type
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: "text", icon: "notes", label: "Text" },
                  { key: "image", icon: "image", label: "Image" },
                  { key: "video", icon: "videocam", label: "Video" },
                  { key: "link", icon: "link", label: "Link" },
                ].map((t) => {
                  const active = postType === t.key;
                  const disabled = t.key === "video";
                  return (
                    <button
                      key={t.key}
                      type="button"
                      disabled={disabled}
                      onClick={() => setPostType(t.key)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all",
                        "bg-white/3 backdrop-blur-md",
                        active
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-transparent hover:border-primary/20 text-slate-400",
                        disabled ? "opacity-40 cursor-not-allowed" : ""
                      )}
                      title={disabled ? "Video posting not enabled yet" : ""}
                    >
                      <span className="material-symbols-outlined">{t.icon}</span>
                      <span className="text-[10px] font-bold uppercase">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">
                Content
              </h3>

              <div className="bg-white/3 backdrop-blur-md rounded-2xl overflow-hidden border border-white/5">
                <textarea
                  className="w-full bg-transparent border-none p-6 text-slate-100 focus:ring-0 placeholder:text-slate-600 resize-none text-lg leading-relaxed"
                  placeholder="What's happening?"
                  rows={6}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={limit}
                />

                <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-white/2">
                  <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-slate-500 hover:text-primary cursor-pointer transition-colors">
                      sentiment_satisfied
                    </span>
                    <span className="material-symbols-outlined text-slate-500 hover:text-primary cursor-pointer transition-colors">
                      location_on
                    </span>
                    <span className="material-symbols-outlined text-slate-500 hover:text-primary cursor-pointer transition-colors">
                      tag
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                    <span className="text-primary">{count}</span>/{limit}
                  </div>
                </div>
              </div>

              {postType === "link" ? (
                <div className="mt-4">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-2">
                    Link URL
                  </p>
                  <input
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-black/30 border border-white/5 rounded-2xl px-4 py-3 text-sm text-slate-200 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
              ) : null}
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">
                Media Assets
              </h3>

              <div
                className="border-2 border-dashed border-primary/20 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer"
                onClick={() => {
                  const url = prompt("Paste a public HTTPS image URL to add as an asset:");
                  if (url && /^https?:\/\//i.test(url)) {
                    setAssets((prev) => [url, ...prev].slice(0, 6));
                    setImageUrl((prev) => prev || url);
                  }
                }}
              >
                <span className="material-symbols-outlined text-3xl text-primary">
                  cloud_upload
                </span>
                <p className="text-sm font-medium text-slate-300">
                  Drag files or <span className="text-primary">browse</span>
                </p>
                <p className="text-[10px] text-slate-500">Supports JPG, PNG, MP4 (Max 50MB)</p>
              </div>

              <div className="mt-4">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-2">
                  Image URL {needsIgImage ? "(required for Instagram)" : "(optional)"}
                </p>
                <input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://yourcdn.com/image.jpg"
                  className="w-full bg-black/30 border border-white/5 rounded-2xl px-4 py-3 text-sm text-slate-200 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                />
                <p className="mt-2 text-[11px] text-slate-500">
                  Must be a public HTTPS image URL so Meta can fetch it.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                {(assets.length ? assets : imageUrl ? [imageUrl] : []).slice(0, 2).map((u) => (
                  <div key={u} className="aspect-square rounded-xl overflow-hidden relative group">
                    <img className="w-full h-full object-cover" alt="Asset" src={u} />
                    <button
                      type="button"
                      onClick={() => {
                        setAssets((prev) => prev.filter((x) => x !== u));
                        if (imageUrl === u) setImageUrl("");
                      }}
                      className="absolute top-2 right-2 size-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                ))}

                <div className="aspect-square rounded-xl overflow-hidden border border-white/5 flex items-center justify-center bg-black/30">
                  <span className="material-symbols-outlined text-slate-700">add</span>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">
                Scheduling
              </h3>

              <div className="bg-white/3 backdrop-blur-md rounded-2xl p-6 border border-white/5">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">event</span>
                    <span className="text-sm font-semibold text-slate-100">Publish Schedule</span>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      className="sr-only peer"
                      type="checkbox"
                      checked={scheduleOn}
                      onChange={(e) => setScheduleOn(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                  </label>
                </div>

                <div className={cn("grid grid-cols-2 gap-4", !scheduleOn ? "opacity-40 pointer-events-none" : "")}>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                      Date
                    </p>
                    <input
                      className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-2 text-sm text-slate-300 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                      Time
                    </p>
                    <input
                      className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-2 text-sm text-slate-300 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                    />
                  </div>
                </div>

                {!scheduleOn ? (
                  <p className="mt-4 text-[11px] text-slate-500">
                    Scheduling is OFF → the main button will publish immediately.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-4 mt-auto pt-4">
              <button
                type="button"
                onClick={handlePrimaryAction}
                disabled={submitting}
                className="flex-1 py-4 px-6 bg-primary text-background-dark font-bold rounded-2xl hover:brightness-110 transition-all shadow-lg shadow-primary/20 disabled:opacity-60"
              >
                {submitting ? "Please wait..." : scheduleOn ? "Schedule Post" : "Publish Now"}
              </button>

              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={submitting}
                className="py-4 px-6 bg-white/3 backdrop-blur-md rounded-2xl font-bold hover:bg-white/5 transition-all border border-white/5 text-slate-100 disabled:opacity-60"
              >
                Save Draft
              </button>
            </div>

            <div className="mt-10">
              {topTab === "drafts" ? (
                <div className="bg-white/3 border border-white/5 rounded-2xl overflow-hidden">
                  <div className="p-4 flex items-center justify-between border-b border-white/5">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      Drafts
                    </p>
                    <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-bold">
                      {drafts.length}
                    </span>
                  </div>
                  <div className="max-h-56 overflow-y-auto custom-scrollbar">
                    {(drafts || []).slice(0, 12).map((p) => (
                      <div key={p.id} className="p-4 border-b border-white/5 last:border-b-0">
                        <div className="text-sm text-slate-200 truncate">
                          {(p.text || p.link_url || "").slice(0, 90) || "(empty)"}
                        </div>
                        <div className="mt-2 flex gap-2">
                          <button
                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-primary/20 text-xs font-bold text-slate-200"
                            onClick={() => handlePublishDraft(p.id)}
                          >
                            Publish
                          </button>
                        </div>
                      </div>
                    ))}
                    {!drafts.length ? (
                      <div className="p-4 text-slate-500 text-sm">No drafts.</div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {topTab === "scheduled" ? (
                <div className="bg-white/3 border border-white/5 rounded-2xl overflow-hidden">
                  <div className="p-4 flex items-center justify-between border-b border-white/5">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      Scheduled
                    </p>
                    <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-bold">
                      {scheduled.length}
                    </span>
                  </div>
                  <div className="max-h-56 overflow-y-auto custom-scrollbar">
                    {(scheduled || []).slice(0, 12).map((p) => (
                      <div key={p.id} className="p-4 border-b border-white/5 last:border-b-0">
                        <div className="text-sm text-slate-200 truncate">
                          {(p.text || p.link_url || "").slice(0, 90) || "Scheduled post"}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          {p.scheduled_at ? new Date(p.scheduled_at).toLocaleString() : ""}
                        </div>
                      </div>
                    ))}
                    {!scheduled.length ? (
                      <div className="p-4 text-slate-500 text-sm">No scheduled posts.</div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {topTab === "sent" ? (
                <div className="bg-white/3 border border-white/5 rounded-2xl p-4 text-slate-500 text-sm">
                  Published list endpoint abhi backend mein add karna hoga. Filhal publish action working hone ke baad is tab ko next step mein wire karenge.
                </div>
              ) : null}
            </div>
          </section>

          <section className="w-[520px] bg-black/20 p-6 overflow-y-auto custom-scrollbar flex flex-col items-center shrink-0">
            <div className="w-full max-w-md mb-6 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                Live Preview
              </h3>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="size-8 rounded-lg bg-primary text-background-dark flex items-center justify-center"
                  title="Facebook preview"
                >
                  <span className="material-symbols-outlined text-sm">social_leaderboard</span>
                </button>
                <button
                  type="button"
                  className="size-8 rounded-lg bg-white/3 border border-white/5 text-slate-400 flex items-center justify-center hover:text-primary transition-colors"
                  title="Instagram preview"
                >
                  <span className="material-symbols-outlined text-sm">photo_camera</span>
                </button>
                <button
                  type="button"
                  className="size-8 rounded-lg bg-white/3 border border-white/5 text-slate-400 flex items-center justify-center hover:text-primary transition-colors"
                  title="Messenger preview"
                >
                  <span className="material-symbols-outlined text-sm">forum</span>
                </button>
              </div>
            </div>

            <div className="w-full max-w-md bg-white/3 border border-white/5 rounded-[22px] overflow-hidden shadow-2xl">
              <div className="p-4 flex items-center gap-3">
                <div className="size-10 rounded-full overflow-hidden bg-slate-700">
                  <img
                    className="w-full h-full object-cover"
                    alt="Preview avatar"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVzoSCJGfkGKxG78M6oePNdE-isyct66z7bvtLEK_Pu6ZZKT_a4UlRCZR0-4AungV-35gdqNWoDLxYtg_3YLLWIdNSCpkhv9pBlBJrfQ6EHPFeFTNBa81MfEMZeGgclmUx6AsiNXDoMDz-w-hLQdPvMMfIHSjfblfkaFnB8NVO2H6Smb6AM0awFefAOhKRtDaCUogBYgV0nYn0GyoCCaR7DT8_mTPcCEBGCqB7g-qrjw2Kokf7_BIgzapw8KrDwgp44oGf-NOvg0I"
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Unified Studio</p>
                  <p className="text-[11px] text-slate-500">
                    Just now •{" "}
                    <span className="material-symbols-outlined text-[10px] align-middle">public</span>
                  </p>
                </div>
                <button className="ml-auto material-symbols-outlined text-slate-400" type="button">
                  more_horiz
                </button>
              </div>

              <div className="px-4 py-2">
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {previewText}
                </p>
              </div>

              <div className="mt-12 w-full max-w-lg flex flex-col gap-4">
                {previewImage ? (
                  <img className="w-full h-full object-cover" alt="Preview media" src={previewImage} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600 text-sm">
                    No image selected
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center -space-x-1.5">
                  <div className="size-5 rounded-full bg-blue-500 flex items-center justify-center border-2 border-slate-900">
                    <span className="material-symbols-outlined text-[10px] text-white">thumb_up</span>
                  </div>
                  <div className="size-5 rounded-full bg-red-500 flex items-center justify-center border-2 border-slate-900">
                    <span className="material-symbols-outlined text-[10px] text-white">favorite</span>
                  </div>
                  <p className="text-xs text-slate-500 ml-4">1.2k</p>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                  <span>24 comments</span>
                  <span>8 shares</span>
                </div>
              </div>

              <div className="px-4 py-3 border-t border-white/5 flex items-center justify-around">
                <button className="flex items-center gap-2 text-slate-500 font-bold text-xs" type="button">
                  <span className="material-symbols-outlined text-lg">thumb_up</span>
                  <span>Like</span>
                </button>
                <button className="flex items-center gap-2 text-slate-500 font-bold text-xs" type="button">
                  <span className="material-symbols-outlined text-lg">chat_bubble</span>
                  <span>Comment</span>
                </button>
                <button className="flex items-center gap-2 text-slate-500 font-bold text-xs" type="button">
                  <span className="material-symbols-outlined text-lg">share</span>
                  <span>Share</span>
                </button>
              </div>
            </div>

            <div className="mt-12 w-full max-w-lg flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Post Performance Estimation
                </p>
                <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-bold">
                  AI ASSISTED
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/3 border border-white/5 p-4 rounded-xl">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Reach</p>
                  <p className="text-lg font-bold text-slate-100">4.2k - 8.5k</p>
                </div>
                <div className="bg-white/3 border border-white/5 p-4 rounded-xl">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Engagement</p>
                  <p className="text-lg font-bold text-slate-100">4.2%</p>
                </div>
                <div className="bg-white/3 border border-white/5 p-4 rounded-xl">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Best Time</p>
                  <p className="text-lg font-bold text-primary">09:30 AM</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}