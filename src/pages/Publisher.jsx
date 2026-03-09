// src/pages/Publisher.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import AppShell from "../components/AppShell.jsx";
import {
  apiFetch,
  getActiveWorkspaceId,
  setActiveWorkspaceId,
  getSession,
} from "../lib/api.js";

const ICON_BY_PLATFORM = {
  facebook: {
    icon: "social_leaderboard",
    cls: "bg-blue-600/20 border-blue-600/40 text-blue-400",
  },
  instagram: {
    icon: "photo_camera",
    cls: "bg-pink-600/20 border-pink-600/40 text-pink-400",
  },
  tiktok: {
    icon: "music_note",
    cls: "bg-white/10 border-white/20 text-white",
  },
};

function cn(...a) {
  return a.filter(Boolean).join(" ");
}

function isImageFile(file) {
  return !!file && String(file.type || "").startsWith("image/");
}

function isVideoFile(file) {
  return !!file && String(file.type || "").startsWith("video/");
}

function extFromUrl(url) {
  const s = String(url || "").toLowerCase().split("?")[0];
  const idx = s.lastIndexOf(".");
  return idx >= 0 ? s.slice(idx) : "";
}

function mediaKindFromUrl(url) {
  const ext = extFromUrl(url);
  if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) return "image";
  if ([".mp4", ".mov", ".webm", ".m4v"].includes(ext)) return "video";
  return "";
}

export default function Publisher({ theme, setTheme }) {
  const API_BASE = import.meta.env.VITE_API_BASE?.trim();
  const fileInputRef = useRef(null);

  const [topTab, setTopTab] = useState("drafts"); // drafts | scheduled | sent
  const [previewPlatform, setPreviewPlatform] = useState("facebook"); // facebook | instagram | tiktok

  const [postType, setPostType] = useState("text"); // text | image | video | link
  const [text, setText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const [workspaces, setWorkspaces] = useState([]);
  const [workspaceId, setWorkspaceIdState] = useState(getActiveWorkspaceId() || "");
  const [channels, setChannels] = useState([]);
  const [selectedChannelIds, setSelectedChannelIds] = useState(() => new Set());

  const [drafts, setDrafts] = useState([]);
  const [scheduled, setScheduled] = useState([]);
  const [published, setPublished] = useState([]);

  const [scheduleOn, setScheduleOn] = useState(true);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [loadingLists, setLoadingLists] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");

  const [localFile, setLocalFile] = useState(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState("");
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState("");
  const [uploadedMediaKind, setUploadedMediaKind] = useState(""); // image | video
  const [uploadMeta, setUploadMeta] = useState(null);

  const limit = 2200;
  const count = useMemo(() => (text || "").length, [text]);

  const selectedChannels = useMemo(() => {
    const set = selectedChannelIds;
    return channels.filter((c) => set.has(c.id));
  }, [channels, selectedChannelIds]);

  const hasFacebookSelected = useMemo(
    () => selectedChannels.some((c) => c.platform === "facebook"),
    [selectedChannels]
  );

  const hasInstagramSelected = useMemo(
    () => selectedChannels.some((c) => c.platform === "instagram"),
    [selectedChannels]
  );

  const hasTikTokSelected = useMemo(
    () => selectedChannels.some((c) => c.platform === "tiktok"),
    [selectedChannels]
  );

  const selectedPlatforms = useMemo(() => {
    const uniq = new Set(selectedChannels.map((c) => c.platform));
    return Array.from(uniq);
  }, [selectedChannels]);

  const composerMediaUrl = uploadedMediaUrl || "";
  const composerMediaPreview = localPreviewUrl || uploadedMediaUrl || "";

  const requiresMedia = useMemo(() => {
    if (postType === "image" || postType === "video") return true;
    if (hasInstagramSelected) return true;
    if (hasTikTokSelected) return true;
    return false;
  }, [postType, hasInstagramSelected, hasTikTokSelected]);

  function setWorkspaceId(id) {
    const wsId = String(id || "");
    setWorkspaceIdState(wsId);
    setActiveWorkspaceId(wsId);
  }

  function getAccessToken() {
    const s = getSession?.();
    return (
      s?.access_token ||
      s?.accessToken ||
      s?.token ||
      localStorage.getItem("access_token") ||
      ""
    );
  }

  function toggleChannel(id) {
    setSelectedChannelIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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
        `/api/workspaces/${encodeURIComponent(wsId)}/publisher/channels`
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

  useEffect(() => {
    return () => {
      if (localPreviewUrl && localPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  useEffect(() => {
    if (hasTikTokSelected) {
      setPreviewPlatform("tiktok");
      if (postType === "text" || postType === "link" || postType === "image") {
        setPostType("video");
      }
    } else if (hasInstagramSelected && previewPlatform === "tiktok") {
      setPreviewPlatform("instagram");
    } else if (hasFacebookSelected && !hasInstagramSelected && !hasTikTokSelected) {
      setPreviewPlatform("facebook");
    }
  }, [
    hasFacebookSelected,
    hasInstagramSelected,
    hasTikTokSelected,
    previewPlatform,
    postType,
  ]);

  async function uploadMediaFile(file) {
    if (!file) throw new Error("No file selected.");
    if (!API_BASE) throw new Error("Missing VITE_API_BASE");
    if (!workspaceId) throw new Error("Select workspace first.");

    const token = getAccessToken();
    if (!token) throw new Error("Missing access token.");

    const form = new FormData();
    form.append("file", file);
    form.append("workspaceId", workspaceId);

    const res = await fetch(`${API_BASE}/api/uploads`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    const isJson = (res.headers.get("content-type") || "").includes("application/json");
    const payload = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const msg =
        (payload && typeof payload === "object" && (payload.message || payload.error)) ||
        (typeof payload === "string" ? payload : "") ||
        `Upload failed: ${res.status}`;
      throw new Error(msg);
    }

    return payload;
  }

  async function handleChooseFile(file) {
    try {
      if (!file) return;

      setErr("");

      if (postType === "image" && !isImageFile(file)) {
        throw new Error("Selected file is not an image.");
      }

      if (postType === "video" && !isVideoFile(file)) {
        throw new Error("Selected file is not a video.");
      }

      if (hasTikTokSelected && !isVideoFile(file)) {
        throw new Error("TikTok publishing currently requires a video file.");
      }

      if (!isImageFile(file) && !isVideoFile(file)) {
        throw new Error("Only image or video files are supported.");
      }

      if (localPreviewUrl && localPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(localPreviewUrl);
      }

      const preview = URL.createObjectURL(file);
      setLocalFile(file);
      setLocalPreviewUrl(preview);
      setUploadedMediaUrl("");
      setUploadedMediaKind(isVideoFile(file) ? "video" : "image");
      setUploadMeta(null);

      setUploading(true);
      const uploaded = await uploadMediaFile(file);

      const publicUrl =
        uploaded?.url ||
        uploaded?.public_url ||
        uploaded?.file_url ||
        "";

      if (!publicUrl) {
        throw new Error("Upload succeeded but no public URL returned.");
      }

      setUploadedMediaUrl(String(publicUrl));
      setUploadMeta(uploaded);
    } catch (e) {
      setErr(String(e?.message || e));
      alert(String(e?.message || e));
    } finally {
      setUploading(false);
    }
  }

  async function createPost(action) {
    if (!workspaceId) throw new Error("Select workspace.");
    if (!selectedChannelIds.size) throw new Error("Select at least one channel.");

    if (postType === "link" && linkUrl && !/^https?:\/\//i.test(linkUrl)) {
      throw new Error("Link URL must start with http:// or https://");
    }

    if (requiresMedia && !composerMediaUrl) {
      throw new Error("Please upload media first.");
    }

    if (postType === "image" && uploadedMediaKind && uploadedMediaKind !== "image") {
      throw new Error("Image post selected but uploaded file is not an image.");
    }

    if (postType === "video" && uploadedMediaKind && uploadedMediaKind !== "video") {
      throw new Error("Video post selected but uploaded file is not a video.");
    }

    if (hasInstagramSelected && !composerMediaUrl) {
      throw new Error("Instagram publishing requires media.");
    }

    if (hasTikTokSelected) {
      if (!composerMediaUrl) {
        throw new Error("TikTok publishing requires media.");
      }

      const kind = uploadedMediaKind || mediaKindFromUrl(composerMediaUrl);
      if (kind !== "video") {
        throw new Error("TikTok publishing currently requires video only.");
      }

      if (postType !== "video") {
        throw new Error("For TikTok, select Video post type.");
      }

      if (action === "scheduled") {
        throw new Error("TikTok scheduling is not wired yet in this UI. Publish now or save draft.");
      }
    }

    if (action === "scheduled") {
      const iso = buildScheduledISO();
      if (!iso) throw new Error("Select schedule Date and Time.");
    }

    const body = {
      action,
      content_type: postType,
      text,
      link_url: postType === "link" ? linkUrl : "",
      media_urls: composerMediaUrl ? [composerMediaUrl] : [],
      scheduled_at: action === "scheduled" ? buildScheduledISO() : null,
      channel_ids: Array.from(selectedChannelIds),
    };

    const j = await apiFetch(
      `/api/workspaces/${encodeURIComponent(workspaceId)}/publisher/posts`,
      {
        method: "POST",
        body,
      }
    );

    await loadLists(workspaceId);
    return j;
  }

  function resetComposer() {
    if (localPreviewUrl && localPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(localPreviewUrl);
    }

    setPostType("text");
    setText("");
    setLinkUrl("");
    setDate("");
    setTime("");
    setScheduleOn(true);
    setSelectedChannelIds(new Set());
    setErr("");

    setLocalFile(null);
    setLocalPreviewUrl("");
    setUploadedMediaUrl("");
    setUploadedMediaKind("");
    setUploadMeta(null);

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const previewText =
    text?.trim() ||
    (postType === "link" && linkUrl ? `Check this out: ${linkUrl}` : "") ||
    "Write something to preview…";

  async function handlePrimaryAction() {
    try {
      setSubmitting(true);
      setErr("");

      if (scheduleOn && !hasTikTokSelected) {
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
        { method: "POST", body: {} }
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

  const previewTitle =
    previewPlatform === "facebook"
      ? "Facebook Preview"
      : previewPlatform === "instagram"
      ? "Instagram Preview"
      : "TikTok Preview";

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
                  topTab === "drafts"
                    ? "bg-primary text-background-dark"
                    : "text-slate-400 hover:text-white"
                )}
              >
                Drafts
              </button>
              <button
                type="button"
                onClick={() => setTopTab("scheduled")}
                className={cn(
                  "px-4 py-1.5 text-xs font-semibold rounded-md transition-colors",
                  topTab === "scheduled"
                    ? "bg-primary text-background-dark"
                    : "text-slate-400 hover:text-white"
                )}
              >
                Scheduled
              </button>
              <button
                type="button"
                onClick={() => setTopTab("sent")}
                className={cn(
                  "px-4 py-1.5 text-xs font-semibold rounded-md transition-colors",
                  topTab === "sent"
                    ? "bg-primary text-background-dark"
                    : "text-slate-400 hover:text-white"
                )}
              >
                Sent
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={resetComposer}
              className="px-4 py-2 rounded-xl border border-white/5 bg-white/5 text-slate-200 text-xs font-bold hover:bg-white/10 transition-all"
              title="Reset composer"
            >
              Reset
            </button>
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
                Platforms & Channels
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
                      <span className="truncate max-w-[320px]">{c.display_name}</span>
                    </button>
                  );
                })}
              </div>

              {!loadingChannels && !channels.length ? (
                <div className="mt-3 text-[11px] text-slate-500">
                  No connected publishing channels found for this workspace.
                </div>
              ) : null}

              {selectedPlatforms.length ? (
                <div className="mt-3 text-[11px] text-slate-500">
                  Selected: {selectedPlatforms.join(", ")}
                </div>
              ) : null}

              {hasInstagramSelected ? (
                <div className="mt-2 text-[11px] text-amber-300 font-bold">
                  Instagram selected → uploaded media required.
                </div>
              ) : null}

              {hasTikTokSelected ? (
                <div className="mt-2 text-[11px] text-cyan-300 font-bold">
                  TikTok selected → video required. Text/link-only publish allowed nahi.
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
                  const disabled =
                    hasTikTokSelected &&
                    (t.key === "text" || t.key === "link" || t.key === "image");

                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => !disabled && setPostType(t.key)}
                      disabled={disabled}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all",
                        "bg-white/3 backdrop-blur-md",
                        active
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-transparent hover:border-primary/20 text-slate-400",
                        disabled && "opacity-35 cursor-not-allowed"
                      )}
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
                  placeholder="Write your caption..."
                  rows={6}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={limit}
                />

                <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-white/2">
                  <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-slate-500">sentiment_satisfied</span>
                    <span className="material-symbols-outlined text-slate-500">location_on</span>
                    <span className="material-symbols-outlined text-slate-500">tag</span>
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
                Media Upload
              </h3>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleChooseFile(file);
                }}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-primary/20 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-primary/5 hover:bg-primary/10 transition-all"
              >
                <span className="material-symbols-outlined text-3xl text-primary">
                  cloud_upload
                </span>
                <p className="text-sm font-medium text-slate-300">
                  Click to upload image or video
                </p>
                <p className="text-[10px] text-slate-500">
                  Supports JPG, PNG, WEBP, MP4, MOV, WEBM
                </p>
              </button>

              {localFile ? (
                <div className="mt-4 rounded-2xl border border-white/5 bg-white/3 p-4">
                  <div className="text-sm text-slate-200 font-semibold truncate">
                    {localFile.name}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    {(localFile.size / (1024 * 1024)).toFixed(2)} MB • {localFile.type || "unknown"}
                  </div>
                  <div className="mt-2 text-[11px]">
                    {uploading ? (
                      <span className="text-amber-300 font-bold">Uploading...</span>
                    ) : uploadedMediaUrl ? (
                      <span className="text-primary font-bold">Uploaded successfully</span>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {uploadedMediaUrl ? (
                <div className="mt-4">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-2">
                    Uploaded Public URL
                  </p>
                  <input
                    value={uploadedMediaUrl}
                    readOnly
                    className="w-full bg-black/30 border border-white/5 rounded-2xl px-4 py-3 text-sm text-slate-300 outline-none"
                  />
                </div>
              ) : null}
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
                      disabled={hasTikTokSelected}
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                  </label>
                </div>

                <div
                  className={cn(
                    "grid grid-cols-2 gap-4",
                    (!scheduleOn || hasTikTokSelected) && "opacity-40 pointer-events-none"
                  )}
                >
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

                {hasTikTokSelected ? (
                  <p className="mt-4 text-[11px] text-amber-300">
                    TikTok scheduling yahan disabled hai. Publish now ya draft use karo.
                  </p>
                ) : !scheduleOn ? (
                  <p className="mt-4 text-[11px] text-slate-500">
                    Scheduling is OFF → main button will publish immediately.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-4 mt-auto pt-4">
              <button
                type="button"
                onClick={handlePrimaryAction}
                disabled={submitting || uploading}
                className="flex-1 py-4 px-6 bg-primary text-background-dark font-bold rounded-2xl hover:brightness-110 transition-all shadow-lg shadow-primary/20 disabled:opacity-60"
              >
                {submitting || uploading
                  ? "Please wait..."
                  : scheduleOn && !hasTikTokSelected
                  ? "Schedule Post"
                  : "Publish Now"}
              </button>

              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={submitting || uploading}
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
                            type="button"
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
                  Published list endpoint abhi backend mein add karna hoga. Filhal publish action ke baad next step mein wire karenge.
                </div>
              ) : null}
            </div>
          </section>

          <section className="w-[520px] bg-black/20 p-6 overflow-y-auto custom-scrollbar flex flex-col items-center shrink-0">
            <div className="w-full max-w-md mb-6 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                {previewTitle}
              </h3>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={cn(
                    "size-8 rounded-lg flex items-center justify-center transition-all",
                    previewPlatform === "facebook"
                      ? "bg-primary text-background-dark"
                      : "bg-white/3 border border-white/5 text-slate-400 hover:text-primary"
                  )}
                  onClick={() => setPreviewPlatform("facebook")}
                  title="Facebook preview"
                >
                  <span className="material-symbols-outlined text-sm">social_leaderboard</span>
                </button>

                <button
                  type="button"
                  className={cn(
                    "size-8 rounded-lg flex items-center justify-center transition-all",
                    previewPlatform === "instagram"
                      ? "bg-primary text-background-dark"
                      : "bg-white/3 border border-white/5 text-slate-400 hover:text-primary"
                  )}
                  onClick={() => setPreviewPlatform("instagram")}
                  title="Instagram preview"
                >
                  <span className="material-symbols-outlined text-sm">photo_camera</span>
                </button>

                <button
                  type="button"
                  className={cn(
                    "size-8 rounded-lg flex items-center justify-center transition-all",
                    previewPlatform === "tiktok"
                      ? "bg-primary text-background-dark"
                      : "bg-white/3 border border-white/5 text-slate-400 hover:text-primary"
                  )}
                  onClick={() => setPreviewPlatform("tiktok")}
                  title="TikTok preview"
                >
                  <span className="material-symbols-outlined text-sm">music_note</span>
                </button>
              </div>
            </div>

            <div className="w-full max-w-md bg-white/3 border border-white/5 rounded-[22px] overflow-hidden shadow-2xl">
              <div className="p-4 flex items-center gap-3">
                <div className="size-10 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center text-white">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    {previewPlatform === "facebook"
                      ? "Facebook Page"
                      : previewPlatform === "instagram"
                      ? "Instagram Account"
                      : "TikTok Account"}
                  </p>
                  <p className="text-[11px] text-slate-500">Just now</p>
                </div>
              </div>

              <div className="px-4 py-2">
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {previewText}
                </p>
              </div>

              <div className="mt-6 w-full">
                {composerMediaPreview ? (
                  uploadedMediaKind === "video" ? (
                    <video
                      className="w-full max-h-[420px] object-cover bg-black"
                      controls
                      src={composerMediaPreview}
                    />
                  ) : (
                    <img
                      className="w-full max-h-[420px] object-cover"
                      alt="Preview media"
                      src={composerMediaPreview}
                    />
                  )
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-600 text-sm bg-black/20">
                    No media selected
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                  {previewPlatform === "tiktok" ? (
                    <>
                      <span>Views</span>
                      <span>Likes</span>
                      <span>Shares</span>
                    </>
                  ) : (
                    <>
                      <span>Likes</span>
                      <span>Comments</span>
                      <span>Shares</span>
                    </>
                  )}
                </div>
              </div>

              <div className="px-4 py-3 border-t border-white/5 flex items-center justify-around">
                {previewPlatform === "facebook" ? (
                  <>
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
                  </>
                ) : previewPlatform === "instagram" ? (
                  <>
                    <button className="flex items-center gap-2 text-slate-500 font-bold text-xs" type="button">
                      <span className="material-symbols-outlined text-lg">favorite</span>
                      <span>Like</span>
                    </button>
                    <button className="flex items-center gap-2 text-slate-500 font-bold text-xs" type="button">
                      <span className="material-symbols-outlined text-lg">chat_bubble</span>
                      <span>Comment</span>
                    </button>
                    <button className="flex items-center gap-2 text-slate-500 font-bold text-xs" type="button">
                      <span className="material-symbols-outlined text-lg">send</span>
                      <span>Send</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button className="flex items-center gap-2 text-slate-500 font-bold text-xs" type="button">
                      <span className="material-symbols-outlined text-lg">favorite</span>
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
                  </>
                )}
              </div>
            </div>

            <div className="mt-12 w-full max-w-lg flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Post Readiness
                </p>
                <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-bold">
                  AI ASSISTED
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/3 border border-white/5 p-4 rounded-xl">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Channels</p>
                  <p className="text-lg font-bold text-slate-100">{selectedChannels.length}</p>
                </div>
                <div className="bg-white/3 border border-white/5 p-4 rounded-xl">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Media</p>
                  <p className="text-lg font-bold text-slate-100">
                    {uploadedMediaKind || "None"}
                  </p>
                </div>
                <div className="bg-white/3 border border-white/5 p-4 rounded-xl">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Mode</p>
                  <p className="text-lg font-bold text-primary">
                    {scheduleOn && !hasTikTokSelected ? "Scheduled" : "Publish Now"}
                  </p>
                </div>
              </div>

              {uploadMeta ? (
                <div className="bg-white/3 border border-white/5 p-4 rounded-xl text-xs text-slate-400">
                  Upload ready for publish.
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}