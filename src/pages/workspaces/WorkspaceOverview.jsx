import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppShell from "../../components/AppShell.jsx";
import { supabase } from "../../lib/supabaseClient.js";
import { isUuid } from "../../lib/isUuid.js";

function GlassCard({ children, className = "" }) {
  return <div className={`glass-panel p-6 rounded-xl ${className}`}>{children}</div>;
}

function RolePill({ type, text }) {
  if (type === "primary") {
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] bg-primary/10 border border-primary/20 text-primary font-bold uppercase tracking-tighter">
        {text}
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/10 text-white/50 font-bold uppercase tracking-tighter">
      {text}
    </span>
  );
}

function iconFromAction(action) {
  if (action === "scheduled_post") return "edit_square";
  if (action === "refreshed_token") return "sync";
  if (action === "member_joined") return "person_add";
  return "bolt";
}

export default function WorkspaceOverview({ theme, setTheme }) {
  const { workspaceId } = useParams();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [ws, setWs] = useState(null);
  const [members, setMembers] = useState([]);
  const [activity, setActivity] = useState([]);

  const [memberSearch, setMemberSearch] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!isUuid(workspaceId)) {
        setWs(null);
        setMembers([]);
        setActivity([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      const req1 = supabase
        .from("workspaces")
        .select("id,name,timezone,description,created_at")
        .eq("id", workspaceId)
        .single();

      const req2 = supabase
        .from("workspace_members")
        .select("id,workspace_id,user_id,role,status,created_at")
        .eq("workspace_id", workspaceId)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      const req3 = supabase
        .from("workspace_activity")
        .select("id,actor_name,action,target,meta,created_at")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(10);

      const [{ data: w, error: e1 }, { data: m, error: e2 }, { data: a, error: e3 }] =
        await Promise.all([req1, req2, req3]);

      if (!alive) return;

      if (e1) console.error("workspace load error:", e1);
      if (e2) console.error("members load error:", e2);
      if (e3) console.error("activity load error:", e3);

      setWs(w || null);

      const mappedMembers = (m || []).map((r) => {
        const role = String(r.role || "viewer");
        const initials = role.slice(0, 2).toUpperCase();
        return {
          initials,
          name: r.user_id, // later: join profiles for real name
          email: r.user_id,
          role: role,
          online: false,
          roleStyle: role === "owner" ? "primary" : "neutral",
        };
      });

      const mappedActivity = (a || []).map((r) => ({
        icon: iconFromAction(r.action),
        title: r.actor_name || "System",
        text: r.meta || r.action,
        target: r.target || "",
        meta: new Date(r.created_at).toLocaleString(),
        primary: r.action === "scheduled_post",
      }));

      setMembers(mappedMembers);
      setActivity(mappedActivity);

      setLoading(false);
    }

    load();
    return () => {
      alive = false;
    };
  }, [workspaceId]);

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        String(m.name).toLowerCase().includes(q) ||
        String(m.email).toLowerCase().includes(q) ||
        String(m.role).toLowerCase().includes(q)
    );
  }, [memberSearch, members]);

  const kpis = useMemo(() => {
    return [
      { label: "Connected Channels", value: 0, icon: "share_reviews", delta: "" },
      { label: "Scheduled Posts", value: 0, icon: "calendar_month", delta: "" },
      { label: "Unread Messages", value: 0, icon: "mark_chat_unread", highlight: true },
      { label: "Active Members", value: members.length, icon: "groups", tag: "Stable" },
    ];
  }, [members.length]);

  if (loading) {
    return (
      <AppShell theme={theme} setTheme={setTheme} active="workspaces" topTitle={null}>
        <main className="flex-1 p-8 text-white/60">Loading workspace…</main>
      </AppShell>
    );
  }

  if (!isUuid(workspaceId) || !ws) {
    return (
      <AppShell theme={theme} setTheme={setTheme} active="workspaces" topTitle={null}>
        <main className="flex-1 p-8 text-white/60">Workspace not found.</main>
      </AppShell>
    );
  }

  return (
    <AppShell theme={theme} setTheme={setTheme} active="workspaces" topTitle={null}>
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm text-white/50">
                <Link to="/workspaces" className="hover:text-primary transition-colors">
                  Workspaces
                </Link>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
                <span className="text-white font-semibold truncate">{ws.name}</span>
              </div>

              <h2 className="text-3xl font-bold text-white tracking-tight mt-2">{ws.name}</h2>
              <p className="text-white/60 text-sm mt-1">
                Workspace overview, quick actions and team visibility.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => nav("/workspaces")}
                className="glass-panel px-4 py-2 rounded-xl text-sm font-bold text-white hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px] text-primary">apartment</span>
                {ws.name}
                <span className="material-symbols-outlined text-[18px] text-white/40">expand_more</span>
              </button>

              <button
                type="button"
                onClick={() => nav(`/workspaces/${ws.id}/team`)}
                className="bg-primary px-4 py-2 rounded-xl text-sm font-bold text-background-dark hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                Invite member
              </button>

              <button
                type="button"
                onClick={() => nav(`/workspaces/${ws.id}/settings`)}
                className="glass-panel px-4 py-2 rounded-xl text-sm font-bold text-white hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">settings</span>
                Settings
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi) => {
              const highlight = !!kpi.highlight;
              return (
                <div
                  key={kpi.label}
                  className={[
                    "glass-panel p-6 rounded-xl border border-glass-border transition-all",
                    highlight ? "bg-primary/5 border-primary/20" : "",
                  ].join(" ")}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <span className="material-symbols-outlined">{kpi.icon}</span>
                    </div>
                    {kpi.delta ? (
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                        {kpi.delta}
                      </span>
                    ) : kpi.tag ? (
                      <span className="text-xs font-bold text-white/50 bg-white/5 px-2 py-1 rounded">
                        {kpi.tag}
                      </span>
                    ) : highlight ? (
                      <div className="size-2 rounded-full bg-primary animate-pulse mt-2" />
                    ) : null}
                  </div>

                  <p className={`text-sm font-medium mb-1 ${highlight ? "text-primary/80" : "text-white/50"}`}>
                    {kpi.label}
                  </p>
                  <h3 className="text-3xl font-black text-white tracking-tight">{kpi.value}</h3>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <GlassCard>
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-bold text-white">Recent Activity</h4>
                  <button className="text-sm font-semibold text-primary hover:underline">
                    View All Audit Logs
                  </button>
                </div>

                <div className="space-y-6">
                  {activity.map((a, idx) => (
                    <div key={idx} className={`flex gap-4 relative ${idx < activity.length - 1 ? "pb-6" : ""}`}>
                      {idx < activity.length - 1 ? (
                        <div className="absolute left-[15px] top-8 bottom-0 w-[2px] bg-white/5" />
                      ) : null}

                      <div className="size-8 rounded-full glass-panel flex items-center justify-center z-10 border border-glass-border">
                        <span className={`material-symbols-outlined text-sm ${a.primary ? "text-primary" : "text-white/50"}`}>
                          {a.icon}
                        </span>
                      </div>

                      <div className="flex-1">
                        <p className="text-sm text-white/70">
                          <span className="font-bold text-white">{a.title}</span> {a.text}{" "}
                          {a.target ? <span className="text-primary font-semibold">{a.target}</span> : null}
                        </p>
                        <span className="text-xs text-white/40 mt-1 block">{a.meta}</span>
                      </div>
                    </div>
                  ))}

                  {activity.length === 0 ? (
                    <div className="text-white/40 text-sm">No activity yet.</div>
                  ) : null}
                </div>
              </GlassCard>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <GlassCard>
                <h4 className="text-lg font-bold text-white mb-6">Quick Actions</h4>
                <div className="grid grid-cols-1 gap-3">
                  <button className="flex items-center gap-3 w-full p-4 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors text-left">
                    <span className="material-symbols-outlined text-primary">add_box</span>
                    <div>
                      <p className="text-sm font-bold text-white">Compose Post</p>
                      <p className="text-xs text-white/50">Draft new content</p>
                    </div>
                  </button>

                  <button className="flex items-center gap-3 w-full p-4 rounded-xl glass-panel hover:bg-white/5 transition-colors text-left border border-glass-border">
                    <span className="material-symbols-outlined text-white/50">add_link</span>
                    <div>
                      <p className="text-sm font-bold text-white">Add Channel</p>
                      <p className="text-xs text-white/50">Link social accounts</p>
                    </div>
                  </button>

                  <button className="flex items-center gap-3 w-full p-4 rounded-xl glass-panel hover:bg-white/5 transition-colors text-left border border-glass-border">
                    <span className="material-symbols-outlined text-white/50">insights</span>
                    <div>
                      <p className="text-sm font-bold text-white">Run Report</p>
                      <p className="text-xs text-white/50">Generate analytics</p>
                    </div>
                  </button>
                </div>
              </GlassCard>
            </div>
          </div>
        </main>

        <aside className="w-80 border-l border-glass-border hidden xl:flex flex-col bg-black/10 backdrop-blur-xl">
          <div className="p-6 border-b border-glass-border">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-lg font-bold text-white">Workspace Team</h4>
              <span className="text-xs font-bold bg-white/5 px-2 py-1 rounded text-white/50">
                {members.length} total
              </span>
            </div>

            <div className="relative mt-4">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">
                search
              </span>
              <input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full bg-white/5 border border-glass-border rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 text-white"
                placeholder="Search members..."
                type="text"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
            {filteredMembers.map((m) => (
              <div key={m.email} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
                <div className="relative">
                  <div className="size-10 rounded-full bg-white/5 border border-glass-border flex items-center justify-center text-white/60 font-bold">
                    {m.initials}
                  </div>
                  <div
                    className={[
                      "absolute bottom-0 right-0 size-3 border-2 border-background-dark rounded-full",
                      m.online ? "bg-green-500" : "bg-white/20",
                    ].join(" ")}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{m.name}</p>
                  <p className="text-xs text-white/40 truncate">{m.email}</p>
                </div>

                <RolePill type={m.roleStyle} text={m.role} />
              </div>
            ))}

            {filteredMembers.length === 0 ? (
              <div className="text-white/40 text-sm p-2">No members.</div>
            ) : null}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}