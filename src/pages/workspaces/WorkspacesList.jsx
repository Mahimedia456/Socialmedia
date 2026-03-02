import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../components/AppShell.jsx";
import { supabase } from "../../lib/supabaseClient.js";

function AccentTile({ accent = "indigo", icon }) {
  const map = {
    indigo: { bg: "bg-indigo-500/20", text: "text-indigo-400" },
    pink: { bg: "bg-pink-500/20", text: "text-pink-400" },
    blue: { bg: "bg-blue-500/20", text: "text-blue-400" },
    emerald: { bg: "bg-emerald-500/20", text: "text-emerald-400" },
    amber: { bg: "bg-amber-500/20", text: "text-amber-400" },
    cyan: { bg: "bg-cyan-500/20", text: "text-cyan-400" },
  };
  const c = map[accent] || map.indigo;

  return (
    <div className={`w-12 h-12 rounded-lg ${c.bg} ${c.text} flex items-center justify-center mb-4`}>
      <span className="material-symbols-outlined text-2xl">{icon}</span>
    </div>
  );
}

function PlanPill({ plan }) {
  const isPro = String(plan).toUpperCase().includes("PRO");
  return (
    <span
      className={[
        "text-[11px] px-2 py-1 rounded-md font-bold uppercase tracking-wider border",
        isPro
          ? "bg-primary/10 border-primary/20 text-primary"
          : "bg-white/5 border-white/10 text-white/50",
      ].join(" ")}
    >
      {plan}
    </span>
  );
}

function MembersPill({ members }) {
  return (
    <span className="bg-white/5 border border-white/10 text-white/70 text-[11px] px-2 py-1 rounded-md flex items-center gap-1">
      <span className="material-symbols-outlined text-[14px]">group</span>
      {members} Members
    </span>
  );
}

function ViewToggle({ value, onChange }) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange("grid")}
        className={[
          "p-2 rounded-lg glass-panel hover:bg-white/10 transition-colors",
          value === "grid" ? "text-white" : "text-white/60",
        ].join(" ")}
      >
        <span className="material-symbols-outlined text-[20px]">grid_view</span>
      </button>

      <button
        type="button"
        onClick={() => onChange("list")}
        className={[
          "p-2 rounded-lg glass-panel hover:bg-white/10 transition-colors",
          value === "list" ? "text-white" : "text-white/60",
        ].join(" ")}
      >
        <span className="material-symbols-outlined text-[20px]">list</span>
      </button>
    </div>
  );
}

function WorkspaceCard({ w, onOpen, onManage }) {
  return (
    <div className="glass-panel rounded-xl p-6 flex flex-col h-full border border-white/10 hover:border-primary/40 hover:-translate-y-[2px] transition-all duration-300">
      <AccentTile accent={w.accent} icon={w.icon} />
      <div className="flex-1">
        <h4 className="text-lg font-bold mb-1 text-white">{w.name}</h4>
        <p className="text-white/40 text-xs mb-4">Timezone: {w.timezone || "—"}</p>
        <div className="flex flex-wrap gap-2 mb-6">
          <MembersPill members={w.members} />
          <PlanPill plan={w.plan} />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onOpen(w)}
          className="flex-1 bg-primary text-background-dark py-2 rounded-full text-sm font-bold hover:opacity-90 transition-opacity"
        >
          Open
        </button>

        <button
          type="button"
          onClick={() => onManage(w)}
          className="flex-1 glass-panel py-2 rounded-full text-sm font-semibold text-white/90 hover:bg-white/5 transition-colors border border-white/10"
        >
          Manage
        </button>
      </div>
    </div>
  );
}

function pickAccentFromId(id) {
  const accents = ["indigo", "pink", "blue", "emerald", "amber", "cyan"];
  const n = String(id).replace(/-/g, "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return accents[n % accents.length];
}

export default function WorkspacesList({ theme, setTheme }) {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [view, setView] = useState("grid");
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState([]);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);

      const { data: wsRows, error: wsErr } = await supabase
        .from("workspaces")
        .select("id,name,timezone,created_at,description")
        .order("created_at", { ascending: false });

      if (!alive) return;

      if (wsErr) {
        console.error("workspaces fetch error:", wsErr);
        setWorkspaces([]);
        setLoading(false);
        return;
      }

      // member counts
      const { data: memRows, error: memErr } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("status", "active");

      if (memErr) console.error("member counts error:", memErr);

      const counts = (memRows || []).reduce((acc, r) => {
        acc[r.workspace_id] = (acc[r.workspace_id] || 0) + 1;
        return acc;
      }, {});

      const mapped = (wsRows || []).map((w) => ({
        id: w.id,
        name: w.name,
        timezone: w.timezone,
        members: counts[w.id] || 0,
        plan: "PRO PLAN",
        icon: "apartment",
        accent: pickAccentFromId(w.id),
      }));

      setWorkspaces(mapped);
      setLoading(false);
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return workspaces;
    return workspaces.filter((w) => w.name.toLowerCase().includes(s));
  }, [q, workspaces]);

  function onOpen(w) {
    nav(`/workspaces/${w.id}`);
  }
  function onManage(w) {
    nav(`/workspaces/${w.id}/settings`);
  }

  return (
    <AppShell theme={theme} setTheme={setTheme} active="workspaces" topTitle={null}>
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="sticky top-0 z-30 glass-panel border-b border-white/10">
          <div className="h-16 px-8 flex items-center justify-between">
            <div className="flex items-center gap-8 flex-1">
              <h2 className="text-lg font-bold text-white">Workspaces</h2>

              <div className="relative w-full max-w-md group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors">
                  search
                </span>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-white/30 text-white"
                  placeholder="Search workspaces..."
                  type="text"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => nav("/workspaces/new")}
                className="bg-primary hover:opacity-90 text-background-dark px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Create Workspace
              </button>
            </div>
          </div>
        </div>

        <div className="p-8 bg-[#0c1a19] min-h-[calc(100vh-64px)]">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h3 className="text-3xl font-bold mb-1 text-white">Your Workspaces</h3>
                <p className="text-white/40 text-sm">Manage and collaborate across your active brand environments.</p>
              </div>

              <ViewToggle value={view} onChange={setView} />
            </div>

            {loading ? (
              <div className="glass-panel rounded-xl border border-white/10 p-8 text-white/60">
                Loading workspaces...
              </div>
            ) : view === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.map((w) => (
                  <WorkspaceCard key={w.id} w={w} onOpen={onOpen} onManage={onManage} />
                ))}
              </div>
            ) : (
              <div className="glass-panel rounded-xl border border-white/10 overflow-hidden">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <p className="text-white font-bold">List View</p>
                  <p className="text-white/40 text-xs">DB powered</p>
                </div>

                <div className="divide-y divide-white/10">
                  {filtered.map((w) => (
                    <div key={w.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/70">
                          <span className="material-symbols-outlined">{w.icon}</span>
                        </div>
                        <div>
                          <p className="text-white font-bold leading-tight">{w.name}</p>
                          <p className="text-white/40 text-xs">Timezone: {w.timezone || "—"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <MembersPill members={w.members} />
                        <PlanPill plan={w.plan} />
                        <button
                          className="bg-primary text-background-dark px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90"
                          onClick={() => onOpen(w)}
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loading && workspaces.length === 0 ? (
              <div className="mt-6 text-white/50 text-sm">
                No workspaces found in database.
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </AppShell>
  );
}