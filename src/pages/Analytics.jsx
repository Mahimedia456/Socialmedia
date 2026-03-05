// src/pages/Analytics.jsx
import React, { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell.jsx";
import { getSession } from "../lib/api.js";

/* API helper */

async function apiFetch(path) {
  const s = getSession?.();
  const token = s?.access_token || s?.accessToken || s?.token || "";
  const base = import.meta.env.VITE_API_URL || "http://localhost:4000";

  const r = await fetch(`${base}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.message || j?.error || "Request failed");
  return j;
}

/* helpers */

function fmt(n) {
  return Number(n || 0).toLocaleString();
}

function pct(n, d) {
  if (!d) return 0;
  return Math.round((n / d) * 100);
}

/* chart */

function LineChart({ series }) {
  const points = useMemo(() => {
    const data = series || [];
    if (!data.length) return "";

    const max = Math.max(...data.map((x) => x.value || 0), 1);

    return data
      .map((p, i) => {
        const x = (i / (data.length - 1 || 1)) * 1000;
        const y = 260 - (p.value / max) * 220;
        return `${i === 0 ? "M" : "L"}${x},${y}`;
      })
      .join(" ");
  }, [series]);

  if (!series?.length)
    return (
      <div className="flex items-center justify-center text-slate-500 h-full">
        No data
      </div>
    );

  return (
    <svg viewBox="0 0 1000 280" className="w-full h-full">
      <path d={points} fill="none" stroke="#13f1e2" strokeWidth="4" />
    </svg>
  );
}

/* page */

export default function Analytics({ theme, setTheme }) {
  const [workspaceId, setWorkspaceId] = useState("");
  const [workspaces, setWorkspaces] = useState([]);

  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  /* load workspaces */

  useEffect(() => {
    (async () => {
      try {
        const j = await apiFetch("/api/workspaces");
        const ws = j.workspaces || [];
        setWorkspaces(ws);
        if (ws.length) setWorkspaceId(ws[0].id);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, []);

  /* load analytics */

  async function load() {
    if (!workspaceId) return;

    setLoading(true);
    setErr("");

    try {
      const j = await apiFetch(
        `/api/workspaces/${workspaceId}/analytics/meta?days=${days}`
      );
      setData(j);
    } catch (e) {
      setErr(e.message);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [workspaceId, days]);

  /* totals */

  const fb = data?.totals?.facebook || {};
  const ig = data?.totals?.instagram || {};

  const impressions = (fb.impressions || 0) + (ig.impressions || 0);
  const reach = (fb.reach || 0) + (ig.reach || 0);

  const dist = {
    fb: pct(fb.impressions || 0, impressions),
    ig: pct(ig.impressions || 0, impressions),
  };

  /* chart */

  const chartSeries = useMemo(() => {
    return (data?.chart?.series || []).map((x) => ({
      date: x.date,
      value: x.value,
    }));
  }, [data]);

  return (
    <AppShell theme={theme} setTheme={setTheme} active="analytics">
      {/* IMPORTANT: prevent header scroll */}
      <main className="flex flex-col h-full overflow-hidden">

        {/* HEADER (never scrolls) */}

        <header className="border-b border-border-dark px-8 py-6 bg-background-dark sticky top-0 z-50">
          <div className="flex justify-between items-center flex-wrap gap-4">

            <div>
              <h2 className="text-3xl font-black text-white">Analytics</h2>
              <p className="text-slate-400 text-sm">
                Meta Insights (Facebook + Instagram)
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">

              <select
                value={workspaceId}
                onChange={(e) => setWorkspaceId(e.target.value)}
                className="bg-white/5 border border-border-dark px-4 h-11 rounded-xl text-white"
              >
                {workspaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>

              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="bg-white/5 border border-border-dark px-4 h-11 rounded-xl text-white"
              >
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
              </select>

              <button
                onClick={load}
                className="px-6 h-11 rounded-xl bg-primary text-black font-bold"
              >
                Refresh
              </button>
            </div>
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}

        <div className="flex-1 overflow-y-auto p-8 space-y-8">

          {err && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-lg text-rose-300">
              {err}
            </div>
          )}

          {/* KPIs */}

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">

            <div className="glass-panel p-6 rounded-xl">
              <div className="text-slate-400 text-sm">Total Impressions</div>
              <div className="text-3xl font-black text-primary">
                {loading ? "..." : fmt(impressions)}
              </div>
            </div>

            <div className="glass-panel p-6 rounded-xl">
              <div className="text-slate-400 text-sm">Total Reach</div>
              <div className="text-3xl font-black text-primary">
                {loading ? "..." : fmt(reach)}
              </div>
            </div>

            <div className="glass-panel p-6 rounded-xl">
              <div className="text-slate-400 text-sm">FB Engagement</div>
              <div className="text-3xl font-black text-primary">
                {loading ? "..." : fmt(fb.post_engagements)}
              </div>
            </div>

            <div className="glass-panel p-6 rounded-xl">
              <div className="text-slate-400 text-sm">IG Profile Views</div>
              <div className="text-3xl font-black text-primary">
                {loading ? "..." : fmt(ig.profile_views)}
              </div>
            </div>

          </div>

          {/* CHART */}

          <div className="glass-panel p-8 rounded-xl h-96 flex flex-col">

            <div className="flex justify-between mb-6">
              <h3 className="text-lg font-bold text-white">
                Engagement Over Time
              </h3>
            </div>

            <div className="flex-1">
              <LineChart series={chartSeries} />
            </div>

          </div>

          {/* CHANNEL DISTRIBUTION */}

          <div className="grid xl:grid-cols-2 gap-8">

            <div className="glass-panel p-8 rounded-xl">

              <h3 className="text-lg font-bold text-white mb-6">
                Channel Distribution
              </h3>

              <div className="space-y-4">

                <div className="flex justify-between text-sm">
                  <span>Facebook</span>
                  <span>{dist.fb}%</span>
                </div>

                <div className="h-2 bg-white/10 rounded-full">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${dist.fb}%` }}
                  />
                </div>

                <div className="flex justify-between text-sm mt-4">
                  <span>Instagram</span>
                  <span>{dist.ig}%</span>
                </div>

                <div className="h-2 bg-white/10 rounded-full">
                  <div
                    className="h-full bg-primary/60 rounded-full"
                    style={{ width: `${dist.ig}%` }}
                  />
                </div>

              </div>
            </div>

            <div className="glass-panel p-8 rounded-xl">

              <h3 className="text-lg font-bold text-white mb-6">
                Meta Totals
              </h3>

              <div className="space-y-4 text-sm">

                <div className="flex justify-between">
                  <span>FB Impressions</span>
                  <span>{fmt(fb.impressions)}</span>
                </div>

                <div className="flex justify-between">
                  <span>FB Reach</span>
                  <span>{fmt(fb.reach)}</span>
                </div>

                <div className="flex justify-between">
                  <span>IG Impressions</span>
                  <span>{fmt(ig.impressions)}</span>
                </div>

                <div className="flex justify-between">
                  <span>IG Reach</span>
                  <span>{fmt(ig.reach)}</span>
                </div>

              </div>
            </div>

          </div>

        </div>
      </main>
    </AppShell>
  );
}