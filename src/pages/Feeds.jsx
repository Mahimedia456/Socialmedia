// src/pages/Feeds.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import AppShell from "../components/AppShell.jsx";
import { apiFetch } from "../lib/api.js";
import {
  listPublisherChannels,
  fetchFacebookFeed,
  fetchInstagramFeed,
  fetchFacebookComments,
  replyFacebookComment,
  likeFacebookPost,
  commentFacebookPost,
} from "../lib/feedsApi.js";

/* ---------------------------
   Small helpers
---------------------------- */
function pill(platform) {
  if (platform === "facebook")
    return "bg-[#1877F2]/15 text-[#7db3ff] border border-[#1877F2]/25";
  return "bg-pink-500/10 text-pink-300 border border-pink-500/20";
}

function fmtWhen(d) {
  try {
    return d ? new Date(d).toLocaleString() : "";
  } catch {
    return "";
  }
}

function clampText(s = "", n = 180) {
  const t = String(s || "");
  if (t.length <= n) return t;
  return t.slice(0, n).trim() + "…";
}

/* ---------------------------
   Media modal (image/video)
   ✅ Sound enabled
---------------------------- */
function MediaModal({ open, onClose, media }) {
  const escClose = (e) => {
    if (e.key === "Escape") onClose?.();
  };

  useEffect(() => {
    if (!open) return;
    window.addEventListener("keydown", escClose);
    return () => window.removeEventListener("keydown", escClose);
    // eslint-disable-next-line
  }, [open]);

  if (!open || !media?.url) return null;
  const isVideo = media.type === "video";

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl rounded-2xl border border-white/10 bg-background-dark/95 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-sm font-bold text-white truncate">
              {media.title || "Preview"}
            </div>
            {media.subtitle ? (
              <div className="text-xs text-white/40 truncate">{media.subtitle}</div>
            ) : null}
          </div>

          <button
            className="px-3 py-2 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 text-xs font-bold"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="bg-black flex items-center justify-center">
          {isVideo ? (
            <video
              src={media.url}
              controls
              autoPlay
              playsInline
              muted={false}
              className="w-full max-h-[78vh] object-contain"
            />
          ) : (
            <img
              src={media.url}
              alt=""
              className="w-full max-h-[78vh] object-contain"
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------
   Extract media (FB/IG)
   ✅ FB video no longer falls back to image as "video"
---------------------------- */
function extractMedia(tab, item) {
  if (!item) return null;

  if (tab === "facebook") {
    const att = item.attachments?.data?.[0] || null;
    const type = String(att?.type || "").toLowerCase();

    const img =
      item.full_picture ||
      att?.media?.image?.src ||
      att?.subattachments?.data?.[0]?.media?.image?.src ||
      "";

    // If your backend expands "source" for videos, use it.
    // Often FB requires extra fields/permissions for video source.
    const videoSrc = att?.media?.source || item?.source || "";

    const isVideo = type.includes("video") || !!videoSrc;

    if (isVideo) {
      return {
        type: "video",
        url: videoSrc || "", // ✅ do NOT fallback to image
        thumb: img || "",
      };
    }

    if (img) return { type: "image", url: img, thumb: img };
    return null;
  }

  // Instagram
  const mediaUrl = item.media_url || "";
  const thumb = item.thumbnail_url || item.media_url || "";
  const isVideo = String(item.media_type || "").toUpperCase() === "VIDEO";

  if (!mediaUrl && !thumb) return null;

  return {
    type: isVideo ? "video" : "image",
    url: mediaUrl || thumb,
    thumb,
  };
}

/* ---------------------------
   Right sidebar (Trending)
---------------------------- */
function TrendingPanel({ tab, items, onOpenMedia }) {
  const top = useMemo(() => {
    const out = [];
    for (const it of items || []) {
      if (out.length >= 6) break;
      const m = extractMedia(tab, it);
      if (m?.thumb || m?.url) out.push({ it, m });
    }
    return out;
  }, [items, tab]);

  return (
    <aside className="hidden xl:flex w-[360px] shrink-0 border-l border-primary/10 bg-background-dark/40 p-6">
      <div className="w-full flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-lg">bolt</span>
          </div>
          <div className="text-lg font-bold text-slate-100">Top Trending</div>
        </div>

        <div className="flex flex-col gap-4">
          {top.length ? (
            top.map(({ it, m }) => {
              const canOpen = m?.type === "video" ? !!m?.url : !!m?.url;
              return (
                <button
                  key={it.id}
                  className="w-full text-left group flex gap-3 disabled:opacity-50"
                  disabled={!canOpen}
                  onClick={() => {
                    if (!canOpen) return;
                    onOpenMedia?.({
                      type: m.type,
                      url: m.url,
                      title: tab === "facebook" ? "Facebook Media" : "Instagram Media",
                      subtitle:
                        tab === "facebook"
                          ? clampText(it.message || it.story || it.id, 70)
                          : clampText(it.caption || it.id, 70),
                    });
                  }}
                >
                  <div className="relative w-28 h-20 rounded-xl overflow-hidden shrink-0 border border-primary/10 bg-black/30">
                    {m?.thumb ? (
                      <img
                        src={m.thumb}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-xl">
                        play_circle
                      </span>
                    </div>
                    {m?.type === "video" ? (
                      <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] text-white px-1.5 py-0.5 rounded">
                        VIDEO
                      </span>
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-slate-200 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                      {tab === "facebook"
                        ? clampText(it.message || it.story || "Facebook post", 60)
                        : clampText(it.caption || "Instagram post", 60)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium mt-1">
                      {tab === "facebook" ? fmtWhen(it.created_time) : fmtWhen(it.timestamp)}
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="text-sm text-white/40">No trending items yet.</div>
          )}
        </div>

        <div className="mt-auto p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent border border-primary/10">
          <p className="text-xs text-primary font-bold uppercase tracking-wider mb-2">
            Pro Feature
          </p>
          <h4 className="text-sm font-bold text-slate-100 mb-2">
            Live Stream Broadcaster
          </h4>
          <p className="text-xs text-slate-400 mb-4">
            Stream to 15+ channels simultaneously with enterprise security.
          </p>
          <button className="w-full py-2 rounded-xl bg-primary text-background-dark font-bold text-xs hover:opacity-95">
            GO LIVE
          </button>
        </div>
      </div>
    </aside>
  );
}

/* ---------------------------
   Feed Card
---------------------------- */
function FeedCard({ tab, item, onOpenComments, onLike, onComment, onOpenMedia }) {
  const isFB = tab === "facebook";
  const title = isFB ? "Facebook" : "Instagram";
  const when = isFB ? fmtWhen(item.created_time) : fmtWhen(item.timestamp);
  const msg = isFB ? item.message || item.story || "" : item.caption || "";

  const likes = isFB
    ? item.likes?.summary?.total_count ?? null
    : typeof item.like_count === "number"
    ? item.like_count
    : null;

  const comments = isFB
    ? item.comments?.summary?.total_count ?? null
    : typeof item.comments_count === "number"
    ? item.comments_count
    : null;

  const media = extractMedia(tab, item);
  const canOpenMedia = media?.type === "video" ? !!media?.url : !!media?.url;

  return (
    <div className="rounded-2xl overflow-hidden border border-primary/10 bg-surface-dark/50 backdrop-blur-md">
      {/* header */}
      <div className="p-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div
              className={[
                "inline-flex px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                pill(isFB ? "facebook" : "instagram"),
              ].join(" ")}
            >
              {title}
            </div>
            <div className="text-xs text-white/40">{when}</div>
          </div>

          {msg ? (
            <div className="mt-3 text-slate-200 leading-relaxed text-sm whitespace-pre-wrap">
              {msg}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isFB ? (
            <>
              <button
                onClick={onLike}
                className="px-3 py-2 rounded-xl border border-primary/15 bg-background-dark/30 text-white/80 text-xs font-bold hover:bg-white/5"
                title="Like post"
              >
                👍 Like
              </button>
              <button
                onClick={onComment}
                className="px-3 py-2 rounded-xl border border-primary/15 bg-background-dark/30 text-white/80 text-xs font-bold hover:bg-white/5"
                title="Add comment"
              >
                💬 Comment
              </button>
              <button
                onClick={onOpenComments}
                className="px-3 py-2 rounded-xl bg-primary/15 border border-primary/25 text-primary text-xs font-bold hover:bg-primary/20"
                title="View comments"
              >
                Comments
              </button>
              {item.permalink_url ? (
                <a
                  className="px-3 py-2 rounded-xl border border-primary/15 bg-background-dark/30 text-white/80 text-xs font-bold hover:bg-white/5"
                  href={item.permalink_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open
                </a>
              ) : null}
            </>
          ) : (
            <>
              {item.permalink ? (
                <a
                  className="px-3 py-2 rounded-xl border border-primary/15 bg-background-dark/30 text-white/80 text-xs font-bold hover:bg-white/5"
                  href={item.permalink}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open
                </a>
              ) : null}
            </>
          )}
        </div>
      </div>

      {/* media (thumbnail + play overlay) */}
      {media?.thumb || media?.url ? (
        <button
          className="relative w-full block bg-black/40 group"
          disabled={!canOpenMedia}
          onClick={() => {
            if (!canOpenMedia) return;
            onOpenMedia?.({
              type: media.type,
              url: media.url,
              title: `${title} Media`,
              subtitle: isFB
                ? clampText(item.message || item.story || item.id, 80)
                : clampText(item.caption || item.id, 80),
            });
          }}
          title={canOpenMedia ? "Open media" : "Video source not available"}
        >
          <div className="relative aspect-video overflow-hidden">
            {media.thumb ? (
              <img
                src={media.thumb}
                alt=""
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition"
              />
            ) : null}

            {media.type === "video" ? (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="size-20 rounded-full bg-primary/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-primary/20">
                    <span className="material-symbols-outlined text-primary text-5xl">
                      play_arrow
                    </span>
                  </div>
                </div>

                {!canOpenMedia ? (
                  <div className="absolute bottom-3 left-3 text-[11px] text-white/80 bg-black/60 border border-white/10 px-2 py-1 rounded">
                    Video URL not returned by API
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </button>
      ) : null}

      {/* counters */}
      <div className="px-6 py-4 border-t border-primary/10 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {likes !== null ? (
            <div className="flex items-center gap-1.5 text-slate-400 text-xs">
              <span className="material-symbols-outlined text-sm text-primary">
                thumb_up
              </span>
              <span>{likes}</span>
            </div>
          ) : null}
          {comments !== null ? (
            <div className="flex items-center gap-1.5 text-slate-400 text-xs">
              <span className="material-symbols-outlined text-sm">chat_bubble</span>
              <span>{comments}</span>
            </div>
          ) : null}
        </div>

        <div className="text-[11px] text-white/35 font-mono">
          {isFB ? `POST: ${item.id}` : `MEDIA: ${item.id}`}
        </div>
      </div>

      {/* actions */}
      <div className="p-2 border-t border-primary/10 bg-primary/[0.02] flex items-center gap-2">
        {isFB ? (
          <>
            <button
              onClick={onLike}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl hover:bg-primary/10 transition-all text-slate-300 hover:text-primary"
            >
              <span className="material-symbols-outlined text-xl">thumb_up</span>
              <span className="text-xs font-bold uppercase tracking-widest">Like</span>
            </button>

            <button
              onClick={onComment}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl hover:bg-primary/10 transition-all text-slate-300 hover:text-primary"
            >
              <span className="material-symbols-outlined text-xl">chat_bubble</span>
              <span className="text-xs font-bold uppercase tracking-widest">Comment</span>
            </button>

            <button
              onClick={onOpenComments}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl hover:bg-primary/10 transition-all text-slate-300 hover:text-primary"
            >
              <span className="material-symbols-outlined text-xl">forum</span>
              <span className="text-xs font-bold uppercase tracking-widest">
                Comments
              </span>
            </button>

            <button
              onClick={() => {
                if (item.permalink_url)
                  window.open(item.permalink_url, "_blank", "noreferrer");
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl hover:bg-primary/10 transition-all text-slate-300 hover:text-primary disabled:opacity-50"
              disabled={!item.permalink_url}
            >
              <span className="material-symbols-outlined text-xl">open_in_new</span>
              <span className="text-xs font-bold uppercase tracking-widest">Open</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => {
                if (canOpenMedia)
                  onOpenMedia?.({
                    type: media.type,
                    url: media.url,
                    title: "Instagram Media",
                  });
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl hover:bg-primary/10 transition-all text-slate-300 hover:text-primary disabled:opacity-50"
              disabled={!canOpenMedia}
            >
              <span className="material-symbols-outlined text-xl">
                {media?.type === "video" ? "play_circle" : "image"}
              </span>
              <span className="text-xs font-bold uppercase tracking-widest">
                {media?.type === "video" ? "Play" : "View"}
              </span>
            </button>

            <button
              onClick={() => {
                if (item.permalink) window.open(item.permalink, "_blank", "noreferrer");
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl hover:bg-primary/10 transition-all text-slate-300 hover:text-primary disabled:opacity-50"
              disabled={!item.permalink}
            >
              <span className="material-symbols-outlined text-xl">open_in_new</span>
              <span className="text-xs font-bold uppercase tracking-widest">Open</span>
            </button>

            <button
              onClick={() => {}}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl hover:bg-primary/10 transition-all text-slate-300 hover:text-primary"
            >
              <span className="material-symbols-outlined text-xl">bookmark</span>
              <span className="text-xs font-bold uppercase tracking-widest">Save</span>
            </button>

            <button
              onClick={() => {}}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl hover:bg-primary/10 transition-all text-slate-300 hover:text-primary"
            >
              <span className="material-symbols-outlined text-xl">share</span>
              <span className="text-xs font-bold uppercase tracking-widest">Share</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------------------
   Main Page
---------------------------- */
export default function Feeds({ theme, setTheme }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [workspaceId, setWorkspaceId] = useState(
    localStorage.getItem("active_workspace_id") || ""
  );

  const [tab, setTab] = useState("facebook"); // facebook | instagram
  const [channels, setChannels] = useState([]);
  const [selectedChannelId, setSelectedChannelId] = useState("");

  const [items, setItems] = useState([]);
  const [paging, setPaging] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");
  const feedTopRef = useRef(null);

  // media modal
  const [mediaOpen, setMediaOpen] = useState(false);
  const [media, setMedia] = useState(null);

  // comments modal (FB only)
  const [cmOpen, setCmOpen] = useState(false);
  const [cmLoading, setCmLoading] = useState(false);
  const [cmErr, setCmErr] = useState("");
  const [cmPost, setCmPost] = useState(null);
  const [cmRows, setCmRows] = useState([]);
  const [cmPaging, setCmPaging] = useState(null);
  const [cmReply, setCmReply] = useState("");
  const [cmPosting, setCmPosting] = useState(false);

  /* -------- load workspaces -------- */
  useEffect(() => {
    (async () => {
      try {
        const j = await apiFetch("/api/workspaces");
        setWorkspaces(j.workspaces || []);
        if (!workspaceId && (j.workspaces || []).length) {
          const first = j.workspaces[0].id;
          setWorkspaceId(first);
          localStorage.setItem("active_workspace_id", first);
        }
      } catch (e) {
        setErr(e?.message || "Failed to load workspaces");
      }
    })();
    // eslint-disable-next-line
  }, []);

  /* -------- load channels per workspace -------- */
  useEffect(() => {
    if (!workspaceId) {
      setChannels([]);
      setSelectedChannelId("");
      setItems([]);
      setPaging(null);
      return;
    }

    (async () => {
      setErr("");
      try {
        const j = await listPublisherChannels(workspaceId, "meta");
        setChannels(j.channels || []);
        setItems([]);
        setPaging(null);
        setSelectedChannelId("");
      } catch (e) {
        setErr(e?.message || "Failed to load channels");
      }
    })();
  }, [workspaceId]);

  const filteredChannels = useMemo(() => {
    return (channels || []).filter((c) => c.platform === tab);
  }, [channels, tab]);

  // auto-select first channel in current tab
  useEffect(() => {
    if (!filteredChannels.length) {
      setSelectedChannelId("");
      return;
    }
    if (!filteredChannels.some((c) => c.id === selectedChannelId)) {
      setSelectedChannelId(filteredChannels[0].id);
    }
  }, [filteredChannels, selectedChannelId]);

  function switchTab(next) {
    setTab(next);
    setItems([]);
    setPaging(null);
    setSelectedChannelId("");
    setErr("");
    setQ("");
    setTimeout(
      () =>
        feedTopRef.current?.scrollIntoView?.({
          behavior: "smooth",
          block: "start",
        }),
      0
    );
  }

  async function loadFeed({ more = false } = {}) {
    if (!workspaceId || !selectedChannelId) return;

    setLoading(true);
    setErr("");

    try {
      let j;
      const after = more ? paging?.cursors?.after || "" : "";

      if (tab === "facebook") {
        j = await fetchFacebookFeed({
          workspaceId,
          pageChannelId: selectedChannelId,
          after,
          limit: 10,
        });
      } else {
        j = await fetchInstagramFeed({
          workspaceId,
          igChannelId: selectedChannelId,
          after,
          limit: 10,
        });
      }

      const newItems = j.data || [];
      setPaging(j.paging || null);
      setItems((prev) => (more ? [...prev, ...newItems] : newItems));
    } catch (e) {
      setErr(e?.message || "Failed to load feed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!workspaceId || !selectedChannelId) return;
    loadFeed({ more: false });
    // eslint-disable-next-line
  }, [tab, selectedChannelId, workspaceId]);

  function onSelectWorkspace(id) {
    const wsId = String(id || "");
    setWorkspaceId(wsId);
    if (wsId) localStorage.setItem("active_workspace_id", wsId);
    else localStorage.removeItem("active_workspace_id");
    setItems([]);
    setPaging(null);
    setSelectedChannelId("");
    setErr("");
    setQ("");
  }

  async function openCommentsForFacebookPost(post) {
    setCmOpen(true);
    setCmPost(post);
    setCmRows([]);
    setCmPaging(null);
    setCmErr("");
    setCmReply("");

    setCmLoading(true);
    try {
      const j = await fetchFacebookComments({
        workspaceId,
        pageChannelId: selectedChannelId,
        postId: post.id,
        limit: 50,
      });
      setCmRows(j.data || []);
      setCmPaging(j.paging || null);
    } catch (e) {
      setCmErr(e?.message || "Failed to load comments");
    } finally {
      setCmLoading(false);
    }
  }

  async function loadMoreComments() {
    if (!cmPost?.id || !cmPaging?.cursors?.after) return;
    setCmLoading(true);
    setCmErr("");
    try {
      const j = await fetchFacebookComments({
        workspaceId,
        pageChannelId: selectedChannelId,
        postId: cmPost.id,
        limit: 50,
        after: cmPaging.cursors.after,
      });
      setCmRows((prev) => [...prev, ...(j.data || [])]);
      setCmPaging(j.paging || null);
    } catch (e) {
      setCmErr(e?.message || "Failed to load more comments");
    } finally {
      setCmLoading(false);
    }
  }

  async function doReplyToComment(commentId) {
    const msg = (cmReply || "").trim();
    if (!msg) return;

    setCmPosting(true);
    setCmErr("");
    try {
      await replyFacebookComment({
        workspaceId,
        pageChannelId: selectedChannelId,
        commentId,
        message: msg,
      });
      setCmReply("");

      const j = await fetchFacebookComments({
        workspaceId,
        pageChannelId: selectedChannelId,
        postId: cmPost.id,
        limit: 50,
      });
      setCmRows(j.data || []);
      setCmPaging(j.paging || null);
    } catch (e) {
      setCmErr(e?.message || "Reply failed");
    } finally {
      setCmPosting(false);
    }
  }

  async function doLikePost(postId) {
    try {
      await likeFacebookPost({
        workspaceId,
        pageChannelId: selectedChannelId,
        postId,
      });
      await loadFeed({ more: false });
    } catch (e) {
      setErr(e?.message || "Like failed");
    }
  }

  async function doCommentPost(postId) {
    const msg = prompt("Write comment:");
    if (!msg) return;
    try {
      await commentFacebookPost({
        workspaceId,
        pageChannelId: selectedChannelId,
        postId,
        message: msg,
      });
      await loadFeed({ more: false });
    } catch (e) {
      setErr(e?.message || "Comment failed");
    }
  }

  const canLoadMore = !!paging?.cursors?.after;

  const filteredItemsByQuery = useMemo(() => {
    const query = (q || "").trim().toLowerCase();
    if (!query) return items;

    return (items || []).filter((it) => {
      const text =
        tab === "facebook"
          ? `${it.message || ""} ${it.story || ""} ${it.id || ""}`
          : `${it.caption || ""} ${it.id || ""}`;
      return String(text).toLowerCase().includes(query);
    });
  }, [items, q, tab]);

  return (
    <AppShell theme={theme} setTheme={setTheme} active="feeds">
      <div className="flex h-[calc(100vh-0px)] min-h-0">
        {/* Center column */}
        <div className="flex-1 min-w-0 overflow-y-auto custom-scrollbar bg-background-dark/40">
          <div ref={feedTopRef} />

          <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-slate-100">Feeds</h2>
                <p className="text-slate-500 text-sm mt-1">
                  Facebook & Instagram posts by workspace and connected page/account.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Search */}
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    search
                  </span>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="bg-surface-dark border border-primary/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none w-64 text-white/80"
                    placeholder="Search feed..."
                    type="text"
                  />
                </div>

                {/* Workspace */}
                <select
                  value={workspaceId}
                  onChange={(e) => onSelectWorkspace(e.target.value)}

  className="bg-surface-dark text-white border border-primary/20 rounded-2xl px-4 py-2 text-sm
             focus:ring-2 focus:ring-primary focus:border-primary outline-none
             [color-scheme:dark]"                >
                  <option value="">Select workspace…</option>
                  {workspaces.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>

                {/* Tabs */}
                <div className="flex gap-2">
                  <button
                    className={[
                      "px-3 py-2 rounded-xl border text-xs font-bold",
                      tab === "facebook"
                        ? "border-[#1877F2]/40 bg-[#1877F2]/10 text-[#a9ccff]"
                        : "border-primary/10 bg-surface-dark text-white/70 hover:bg-white/5",
                    ].join(" ")}
                    onClick={() => switchTab("facebook")}
                    disabled={!workspaceId}
                  >
                    Facebook
                  </button>

                  <button
                    className={[
                      "px-3 py-2 rounded-xl border text-xs font-bold",
                      tab === "instagram"
                        ? "border-pink-500/30 bg-pink-500/10 text-pink-200"
                        : "border-primary/10 bg-surface-dark text-white/70 hover:bg-white/5",
                    ].join(" ")}
                    onClick={() => switchTab("instagram")}
                    disabled={!workspaceId}
                  >
                    Instagram
                  </button>
                </div>

                {/* Channel */}
                <select
/* Improves select dropdown in some browsers */
select, option {
  background-color: #182527; /* surface-dark */
  color: #ffffff;
}                  value={selectedChannelId}
                  onChange={(e) => setSelectedChannelId(e.target.value)}
                  disabled={!workspaceId || !filteredChannels.length}
                >
                  {!filteredChannels.length ? (
                    <option value="">No connected {tab} channels</option>
                  ) : null}
                  {filteredChannels.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.display_name}
                    </option>
                  ))}
                </select>

                <button
                  className="px-3 py-2 rounded-xl border border-primary/10 bg-surface-dark text-white/80 text-xs font-bold hover:bg-white/5 disabled:opacity-50"
                  onClick={() => loadFeed({ more: false })}
                  disabled={!workspaceId || !selectedChannelId || loading}
                >
                  Refresh
                </button>
              </div>
            </div>

            {err ? (
              <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-950/20 p-4 text-sm text-red-200">
                {err}
              </div>
            ) : null}

            {/* Feed list */}
            <div className="mt-6 flex flex-col gap-6">
              {!workspaceId ? (
                <div className="p-8 text-center text-white/40 text-sm">
                  Select a workspace first.
                </div>
              ) : !selectedChannelId ? (
                <div className="p-8 text-center text-white/40 text-sm">
                  Select a page/account.
                </div>
              ) : (
                <>
                  {filteredItemsByQuery.map((it) => (
                    <FeedCard
                      key={it.id}
                      tab={tab}
                      item={it}
                      onOpenComments={() => openCommentsForFacebookPost(it)}
                      onLike={() => doLikePost(it.id)}
                      onComment={() => doCommentPost(it.id)}
                      onOpenMedia={(m) => {
                        setMedia(m);
                        setMediaOpen(true);
                      }}
                    />
                  ))}

                  {!loading && filteredItemsByQuery.length === 0 ? (
                    <div className="text-sm text-white/40">
                      No posts found{q ? " for this search." : "."}
                    </div>
                  ) : null}

                  <div className="flex items-center gap-3">
                    <button
                      className="px-4 py-2 rounded-xl border border-primary/10 bg-surface-dark text-white/80 text-xs font-bold hover:bg-white/5 disabled:opacity-50"
                      onClick={() => loadFeed({ more: true })}
                      disabled={loading || !canLoadMore}
                    >
                      Load more
                    </button>
                    {loading ? (
                      <div className="text-sm text-white/50 py-2">Loading…</div>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <TrendingPanel
          tab={tab}
          items={items}
          onOpenMedia={(m) => {
            setMedia(m);
            setMediaOpen(true);
          }}
        />

        {/* Comments Modal (Facebook only) */}
        {cmOpen ? (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-3xl rounded-2xl border border-primary/10 bg-background-dark/95 overflow-hidden">
              <div className="px-5 py-4 border-b border-primary/10 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white truncate">Comments</div>
                  <div className="text-xs text-white/40 truncate">
                    Post: {(cmPost?.message || cmPost?.story || "").slice(0, 80) || cmPost?.id}
                  </div>
                </div>
                <button
                  className="px-3 py-2 rounded-xl border border-primary/10 bg-surface-dark text-white/70 hover:bg-white/5 text-xs font-bold"
                  onClick={() => setCmOpen(false)}
                >
                  Close
                </button>
              </div>

              <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {cmErr ? (
                  <div className="border border-red-500/20 rounded-xl p-3 text-sm text-red-200 bg-red-950/20">
                    {cmErr}
                  </div>
                ) : null}

                {cmLoading && !cmRows.length ? (
                  <div className="text-white/50 text-sm">Loading comments…</div>
                ) : null}

                {!cmLoading && !cmRows.length ? (
                  <div className="text-white/40 text-sm">No comments.</div>
                ) : null}

                {cmRows.map((c) => (
                  <div key={c.id} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-xs text-white/70 font-bold truncate">
                        {c.from?.name || "User"}
                      </div>
                      <div className="text-[11px] text-white/40 shrink-0">
                        {c.created_time ? new Date(c.created_time).toLocaleString() : ""}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-white/90 whitespace-pre-wrap">
                      {c.message || "—"}
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <input
                        value={cmReply}
                        onChange={(e) => setCmReply(e.target.value)}
                        placeholder="Reply as Page..."
                        className="flex-1 bg-surface-dark border border-primary/10 rounded-xl px-3 py-2 text-sm text-white/80 outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      />
                      <button
                        onClick={() => doReplyToComment(c.id)}
                        disabled={cmPosting || !cmReply.trim()}
                        className="px-3 py-2 rounded-xl bg-primary/15 border border-primary/25 text-primary text-xs font-bold disabled:opacity-50 hover:bg-primary/20"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                ))}

                <div className="flex items-center gap-3">
                  <button
                    className="px-4 py-2 rounded-xl border border-primary/10 bg-surface-dark text-white/80 text-xs font-bold hover:bg-white/5 disabled:opacity-50"
                    onClick={loadMoreComments}
                    disabled={cmLoading || !cmPaging?.cursors?.after}
                  >
                    Load more
                  </button>
                  {cmLoading ? (
                    <div className="text-sm text-white/50 py-2">Loading…</div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Media Preview Modal */}
        <MediaModal
          open={mediaOpen}
          media={media}
          onClose={() => {
            setMediaOpen(false);
            setMedia(null);
          }}
        />
      </div>
    </AppShell>
  );
}