import React, { useEffect, useMemo, useState } from "react";
import AppShell from "../../components/AppShell.jsx";
import { buildMetaAuthUrl } from "../../lib/metaConnect";
import { buildTikTokAuthUrl } from "../../lib/tiktokConnect";

function StatusBadge({ tone, label }) {
  const dotCls = tone === "warn" ? "bg-amber-500 animate-pulse" : "bg-primary";
  const textCls = tone === "warn" ? "text-amber-500" : "text-primary";

  return (
    <div className="mt-1 flex items-center gap-2">
      <span className={["flex h-2 w-2 rounded-full", dotCls].join(" ")} />
      <span
        className={[textCls, "text-sm font-semibold uppercase tracking-wide"].join(" ")}
      >
        {label}
      </span>
    </div>
  );
}

function channelIcon(platform) {
  if (platform === "facebook") {
    return {
      bg: "bg-blue-600/20",
      border: "border-blue-500/30",
      text: "text-blue-400",
      glyph: "social_leaderboard",
    };
  }

  if (platform === "instagram") {
    return {
      bg: "bg-gradient-to-tr from-pink-500/20 to-orange-500/20",
      border: "border-pink-500/30",
      text: "text-pink-400",
      glyph: "camera",
    };
  }

  if (platform === "tiktok") {
    return {
      bg: "bg-black/30",
      border: "border-white/20",
      text: "text-white",
      glyph: "music_note",
    };
  }

  return {
    bg: "bg-orange-600/20",
    border: "border-orange-500/30",
    text: "text-orange-400",
    glyph: "forum",
  };
}

function toneFromStatus(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("reconnect") || s.includes("needs")) return "warn";
  if (s.includes("disconnected")) return "warn";
  return "ok";
}

function labelFromStatus(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("disconnected")) return "Disconnected";
  if (s.includes("reconnect") || s.includes("needs")) return "Needs reconnect";
  return "Connected";
}

function platformLabel(platform) {
  const p = String(platform || "").toLowerCase();
  if (p === "facebook") return "Facebook";
  if (p === "instagram") return "Instagram";
  if (p === "tiktok") return "TikTok";
  return "Channel";
}

export default function ChannelConnections({ theme, setTheme }) {
  const API_BASE = import.meta.env.VITE_API_BASE?.trim();

  const [q, setQ] = useState("");

  const [workspaces, setWorkspaces] = useState([]);
  const [wsLoading, setWsLoading] = useState(true);

  const [workspaceId, setWorkspaceId] = useState(
    localStorage.getItem("active_workspace_id") || ""
  );

  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // meta picker modal
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerBusy, setPickerBusy] = useState(false);
  const [pages, setPages] = useState([]);
  const [userToken, setUserToken] = useState("");
  const [expiresIn, setExpiresIn] = useState(null);
  const [selections, setSelections] = useState({});

  function getAccessToken() {
    return localStorage.getItem("access_token") || "";
  }

  async function apiFetch(path, opts = {}) {
    if (!API_BASE) throw new Error("Missing VITE_API_BASE");

    const fetchOptions = {
      ...opts,
      headers: {
        ...(opts.headers || {}),
        Authorization: `Bearer ${getAccessToken()}`,
      },
    };

    if (opts.body) {
      fetchOptions.headers["Content-Type"] = "application/json";
      fetchOptions.body =
        typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body);
    }

    const res = await fetch(`${API_BASE}${path}`, fetchOptions);

    const isJson = (res.headers.get("content-type") || "").includes("application/json");
    const payload = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const msg =
        (payload &&
          typeof payload === "object" &&
          (payload.message || payload.error || payload.details)) ||
        (typeof payload === "string" ? payload : "") ||
        `Request failed: ${res.status}`;

      const e = new Error(msg);
      e.payload = payload;
      throw e;
    }

    return payload;
  }

  async function loadWorkspaces() {
    try {
      setWsLoading(true);
      setErr("");

      const j = await apiFetch("/api/workspaces", { method: "GET" });
      const ws = j?.workspaces || [];
      setWorkspaces(ws);

      if (!workspaceId && ws.length) {
        const saved = localStorage.getItem("active_workspace_id") || "";
        const foundSaved = ws.find((w) => String(w.id) === String(saved));

        if (foundSaved) {
          setWorkspaceId(foundSaved.id);
        } else {
          setWorkspaceId(ws[0].id);
        }
      }
    } catch (e) {
      setErr(String(e?.message || e));
      setWorkspaces([]);
    } finally {
      setWsLoading(false);
    }
  }

  // Load workspaces
  useEffect(() => {
    loadWorkspaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist active workspace
  useEffect(() => {
    if (workspaceId) localStorage.setItem("active_workspace_id", workspaceId);
    else localStorage.removeItem("active_workspace_id");
  }, [workspaceId]);

  async function loadChannels(wsId) {
    if (!wsId) {
      setChannels([]);
      return;
    }

    setLoading(true);
    setErr("");

    try {
      const j = await apiFetch(
        `/api/workspaces/${encodeURIComponent(wsId)}/channels`,
        { method: "GET" }
      );

      setChannels(j?.channels || []);
    } catch (e) {
      setErr(String(e?.message || e));
      setChannels([]);
    } finally {
      setLoading(false);
    }
  }

  // Load channels when workspace changes
  useEffect(() => {
    if (!workspaceId) {
      setChannels([]);
      return;
    }
    loadChannels(workspaceId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  function connectMeta() {
    if (!workspaceId) {
      alert("Select a workspace first.");
      return;
    }
    window.location.assign(buildMetaAuthUrl({ workspaceId }));
  }

  function connectTikTok() {
    if (!workspaceId) {
      alert("Select a workspace first.");
      return;
    }
    window.location.assign(buildTikTokAuthUrl({ workspaceId }));
  }

  function reconnectChannel(channel) {
    const platform = String(channel?.platform || "").toLowerCase();
    if (platform === "tiktok") {
      connectTikTok();
      return;
    }
    connectMeta();
  }

  // MetaCallback result
  useEffect(() => {
    try {
      const raw = localStorage.getItem("meta_exchange_result");
      if (!raw) return;

      localStorage.removeItem("meta_exchange_result");

      const j = JSON.parse(raw || "{}");
      const stWsId = String(j?.workspaceId || "");

      if (!stWsId) {
        setErr("Meta connect failed: missing workspaceId in exchange result.");
        return;
      }

      if (stWsId !== workspaceId) {
        setWorkspaceId(stWsId);
        localStorage.setItem("active_workspace_id", stWsId);
      }

      const returnedPages = Array.isArray(j?.pages) ? j.pages : [];
      setPages(returnedPages);
      setUserToken(j?.user_access_token || "");
      setExpiresIn(j?.expires_in ?? null);

      const next = {};
      for (const p of returnedPages) {
        next[p.pageId] = {
          connectFacebook: true,
          connectInstagram: !!p.igId,
        };
      }
      setSelections(next);

      setTimeout(() => setPickerOpen(true), 0);
    } catch (e) {
      console.error("Failed to read meta_exchange_result:", e);
      setErr("Meta connect failed: could not parse exchange result.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // TikTokCallback result
 useEffect(() => {
  try {
    const raw = localStorage.getItem("tiktok_exchange_result");
    if (!raw) return;

    localStorage.removeItem("tiktok_exchange_result");

    const j = JSON.parse(raw || "{}");
    const stWsId = String(j?.workspaceId || "");

    if (!j?.ok) {
      setErr(
        String(
          j?.error ||
            j?.message ||
            "TikTok connect failed. Check backend logs."
        )
      );

      if (stWsId && stWsId !== workspaceId) {
        setWorkspaceId(stWsId);
        localStorage.setItem("active_workspace_id", stWsId);
      }

      return;
    }

    if (!stWsId) {
      setErr("TikTok connect failed: missing workspaceId in exchange result.");
      return;
    }

    if (stWsId !== workspaceId) {
      setWorkspaceId(stWsId);
      localStorage.setItem("active_workspace_id", stWsId);
    }

    setErr("");

    setTimeout(() => {
      loadChannels(stWsId);
    }, 0);
  } catch (e) {
    console.error("Failed to read tiktok_exchange_result:", e);
    setErr("TikTok connect failed: could not parse exchange result.");
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  function toggle(pageId, key) {
    setSelections((prev) => ({
      ...prev,
      [pageId]: {
        ...prev[pageId],
        [key]: !prev[pageId]?.[key],
      },
    }));
  }

  async function connectSelected() {
    try {
      if (!workspaceId) {
        alert("Select a workspace first.");
        return;
      }

      setPickerBusy(true);

      const selectedRows = (pages || [])
        .map((p) => {
          const s = selections[p.pageId] || {};
          return {
            pageId: p.pageId,
            pageName: p.pageName,
            pageToken: p.pageToken,
            igId: p.igId,
            connectFacebook: !!s.connectFacebook,
            connectInstagram: !!s.connectInstagram && !!p.igId,
          };
        })
        .filter((x) => x.connectFacebook || x.connectInstagram);

      if (!selectedRows.length) {
        alert("Select at least one Facebook Page or Instagram account.");
        return;
      }

      await apiFetch("/api/meta/connect-pages", {
        method: "POST",
        body: {
          workspaceId,
          user_access_token: userToken,
          expires_in: expiresIn,
          selections: selectedRows,
        },
      });

      setPickerOpen(false);
      setPages([]);
      setSelections({});
      setUserToken("");
      setExpiresIn(null);

      await loadChannels(workspaceId);
    } catch (e) {
      alert(String(e?.message || e));
    } finally {
      setPickerBusy(false);
    }
  }

  async function disconnectChannel(channelId) {
    try {
      if (!workspaceId) return;

      await apiFetch(
        `/api/workspaces/${encodeURIComponent(workspaceId)}/channels/${encodeURIComponent(
          channelId
        )}/disconnect`,
        { method: "POST" }
      );

      await loadChannels(workspaceId);
    } catch (e) {
      alert(String(e?.message || e));
    }
  }

  const filteredChannels = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return channels;

    return (channels || []).filter((c) => {
      return (
        String(c.platform || "").toLowerCase().includes(s) ||
        String(c.display_name || "").toLowerCase().includes(s) ||
        String(c.status || "").toLowerCase().includes(s) ||
        String(c.external_id || "").toLowerCase().includes(s)
      );
    });
  }, [q, channels]);

  return (
    <AppShell
      theme={theme}
      setTheme={setTheme}
      active="connections"
      topSearchPlaceholder="Search accounts..."
      topSearchValue={q}
      onTopSearchChange={setQ}
    >
      <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-extrabold text-white tracking-tight">
              Connections
            </h2>
            <p className="text-slate-400 mt-2 text-lg">
              Select workspace, connect Meta, then choose Facebook Pages and linked Instagram accounts.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="min-w-[280px]">
              <label className="text-[10px] uppercase tracking-[0.22em] text-white/30 font-bold block mb-2">
                Active Workspace
              </label>

              <select
                value={workspaceId}
                onChange={(e) => setWorkspaceId(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-sm text-white outline-none focus:border-primary/40"
              >
                <option value="">
                  {wsLoading ? "Loading workspaces..." : "Select workspace..."}
                </option>
                {(workspaces || []).map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="bg-primary text-background-dark px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:shadow-[0_0_20px_rgba(19,241,226,0.35)] transition-all disabled:opacity-60"
              type="button"
              onClick={connectMeta}
              disabled={pickerBusy || !workspaceId}
              title={!workspaceId ? "Select a workspace first" : "Connect Meta"}
            >
              <span className="material-symbols-outlined">add_link</span>
              Connect Meta
            </button>

            <button
              className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-60"
              type="button"
              onClick={connectTikTok}
              disabled={!workspaceId}
              title={!workspaceId ? "Select a workspace first" : "Connect TikTok"}
            >
              <span className="material-symbols-outlined">music_note</span>
              Connect TikTok
            </button>
          </div>
        </div>

        {pickerBusy ? (
          <div className="glass-panel border border-white/10 rounded-2xl p-6 text-white/70">
            Preparing Meta connection…
          </div>
        ) : null}

        {err ? (
          <div className="glass-panel border border-red-500/20 bg-red-500/5 rounded-2xl p-6">
            <p className="text-red-200 font-bold">Failed</p>
            <pre className="text-red-200/70 text-sm mt-2 whitespace-pre-wrap">
              {err}
            </pre>
          </div>
        ) : null}

        <section className="space-y-4">
          {loading ? (
            <div className="glass-panel border border-white/10 rounded-2xl p-6 text-white/70">
              Loading connections…
            </div>
          ) : !workspaceId ? (
            <div className="glass-panel border border-white/10 rounded-2xl p-8 text-center">
              <p className="text-white font-bold">
                Select a workspace to view/manage connections
              </p>
              <p className="text-white/50 text-sm mt-2">
                Connected channels are saved under a workspace.
              </p>
            </div>
          ) : filteredChannels.length === 0 ? (
            <div className="glass-panel border border-white/10 rounded-2xl p-8 text-center">
              <p className="text-white font-bold">No channels connected yet</p>
              <p className="text-white/50 text-sm mt-2">
                Click <span className="text-primary font-semibold">Connect Meta</span> or{" "}
                <span className="text-white font-semibold">Connect TikTok</span> to link accounts.
              </p>
            </div>
          ) : (
            filteredChannels.map((c) => {
              const tone = toneFromStatus(c.status);
              const icon = channelIcon(c.platform);

              const metaGrid = [
                { label: "Platform", value: platformLabel(c.platform) },
                { label: "External ID", value: c.external_id },
                {
                  label: "Status",
                  value: labelFromStatus(c.status),
                  accent: tone === "warn" ? "warn" : "primary",
                },
                {
                  label: "Updated",
                  value: c.updated_at ? new Date(c.updated_at).toLocaleString() : "—",
                },
              ];

              return (
                <div
                  key={c.id}
                  className={[
                    "glass-panel rounded-2xl p-6 flex items-start gap-6 transition-all duration-300",
                    tone === "warn"
                      ? "border border-amber-500/20 hover:border-amber-500/40"
                      : "border border-primary/10 hover:border-primary/25",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "w-16 h-16 rounded-xl flex items-center justify-center border",
                      icon.bg,
                      icon.border,
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "material-symbols-outlined text-3xl leading-none",
                        icon.text,
                      ].join(" ")}
                    >
                      {icon.glyph}
                    </span>
                  </div>

                  <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-1">
                      <h3 className="text-xl font-bold text-white">
                        {platformLabel(c.platform)}
                      </h3>
                      <StatusBadge tone={tone} label={labelFromStatus(c.status)} />
                    </div>

                    <div className="lg:col-span-2 space-y-2">
                      <p className="text-slate-300 font-medium">
                        Account: <span className="text-white">{c.display_name || "—"}</span>
                      </p>

                      <div className="grid grid-cols-2 gap-4 text-xs text-slate-500 uppercase font-bold tracking-widest mt-2">
                        {metaGrid.map((m) => (
                          <div key={m.label}>
                            {m.label}:
                            <span
                              className={[
                                "block",
                                m.accent === "primary"
                                  ? "text-primary"
                                  : m.accent === "warn"
                                  ? "text-amber-500"
                                  : "text-slate-300",
                                "normal-case tracking-normal font-semibold mt-1",
                              ].join(" ")}
                            >
                              {m.value || "—"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="lg:col-span-1 flex flex-col gap-2 justify-center">
                      <button
                        className={[
                          "w-full py-2 text-sm font-bold rounded-lg transition-all",
                          tone === "warn"
                            ? "bg-amber-500 text-background-dark hover:bg-amber-400"
                            : "bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-background-dark",
                        ].join(" ")}
                        type="button"
                        onClick={() => reconnectChannel(c)}
                      >
                        Reconnect
                      </button>

                      <button
                        className="w-full py-2 text-slate-500 text-sm font-bold rounded-lg hover:text-rose-400 transition-all"
                        type="button"
                        onClick={() => disconnectChannel(c.id)}
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* Page Picker Modal */}
        {pickerOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="glass-panel border border-white/10 rounded-2xl w-full max-w-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-white">Select Pages to Connect</h3>
                  <p className="text-white/50 text-sm mt-1">
                    Choose which Facebook Pages and linked Instagram accounts to connect.
                  </p>
                </div>

                <button
                  className="text-white/60 hover:text-white"
                  onClick={() => setPickerOpen(false)}
                  type="button"
                  disabled={pickerBusy}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="mt-5 space-y-3 max-h-[55vh] overflow-y-auto custom-scrollbar pr-1">
                {(pages || []).map((p) => {
                  const sel = selections[p.pageId] || {};

                  return (
                    <div
                      key={p.pageId}
                      className="border border-white/10 rounded-xl p-4 bg-white/5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-white font-bold truncate">{p.pageName}</div>
                          <div className="text-white/40 text-xs mt-1">Page ID: {p.pageId}</div>

                          {p.igId ? (
                            <div className="text-white/40 text-xs mt-1">
                              IG ID: {p.igId}
                              {p.igUsername ? ` • @${p.igUsername}` : ""}
                            </div>
                          ) : (
                            <div className="text-amber-400/80 text-xs mt-1">
                              No linked IG business account returned by Meta
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 items-end">
                          <label className="flex items-center gap-2 text-sm text-white/80">
                            <input
                              type="checkbox"
                              checked={!!sel.connectFacebook}
                              onChange={() => toggle(p.pageId, "connectFacebook")}
                            />
                            Facebook Page
                          </label>

                          <label
                            className={`flex items-center gap-2 text-sm ${
                              p.igId ? "text-white/80" : "text-white/30"
                            }`}
                          >
                            <input
                              type="checkbox"
                              disabled={!p.igId}
                              checked={!!sel.connectInstagram}
                              onChange={() => toggle(p.pageId, "connectInstagram")}
                            />
                            Instagram
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {!pages || pages.length === 0 ? (
                  <div className="text-white/50 text-sm">
                    No pages returned. The Facebook user must be admin of the pages and required permissions must be approved.
                  </div>
                ) : null}
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white/70 hover:text-white hover:bg-white/5 disabled:opacity-60"
                  onClick={() => setPickerOpen(false)}
                  disabled={pickerBusy}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="bg-primary px-5 py-2.5 rounded-xl text-sm font-black text-background-dark hover:opacity-90 disabled:opacity-60"
                  onClick={connectSelected}
                  disabled={pickerBusy}
                >
                  {pickerBusy ? "Connecting…" : "Connect Selected"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}