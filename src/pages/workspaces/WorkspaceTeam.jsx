import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../../components/AppShell.jsx";
import { supabase } from "../../lib/supabaseClient.js";

function Glass({ className = "", children }) {
  return <div className={`glass-panel border border-white/10 ${className}`}>{children}</div>;
}

function StatusPill({ status }) {
  const active = status === "active" || status === "Active";
  return (
    <span
      className={[
        "inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-black uppercase border",
        active ? "bg-primary/10 text-primary border-primary/20" : "bg-white/5 text-white/50 border-white/10",
      ].join(" ")}
    >
      <span className={["size-1.5 rounded-full", active ? "bg-primary animate-pulse" : "bg-slate-500"].join(" ")} />
      {active ? "Active" : "Invited"}
    </span>
  );
}

function RoleSelect({ value, onChange }) {
  return (
    <div className="relative inline-block">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent border-none text-sm font-semibold focus:ring-0 cursor-pointer pr-8 py-1 rounded appearance-none hover:text-primary text-white/80"
      >
        <option className="bg-background-dark" value="owner">Owner</option>
        <option className="bg-background-dark" value="admin">Admin</option>
        <option className="bg-background-dark" value="agent">Agent</option>
        <option className="bg-background-dark" value="viewer">Viewer</option>
      </select>
      <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 text-sm">
        expand_more
      </span>
    </div>
  );
}

function Drawer({ open, onClose, onSend }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("agent");
  const canSend = useMemo(() => /^\S+@\S+\.\S+$/.test(email.trim()), [email]);

  function submit(e) {
    e.preventDefault();
    if (!canSend) return;
    onSend({ email: email.trim(), role });
    setEmail("");
    setRole("agent");
  }

  return (
    <>
      <div
        className={[
          "fixed inset-0 z-40 transition-opacity",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-background-dark/80 backdrop-blur-sm" />
      </div>

      <div
        className={[
          "fixed inset-y-0 right-0 w-[420px] max-w-[90vw] z-50 transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <div className="h-full glass-panel border-l border-white/10 shadow-2xl">
          <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-white">Invite New Member</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <span className="material-symbols-outlined text-white/50">close</span>
              </button>
            </div>

            <form onSubmit={submit} className="space-y-6 flex-1">
              <div>
                <label className="block text-sm font-semibold text-white/50 mb-2">Email Address</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                    alternate_email
                  </span>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-11 pr-4 py-2.5 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all text-white placeholder:text-white/30"
                    placeholder="colleague@company.com"
                    type="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/50 mb-4">Select Workspace Role</label>
                <div className="space-y-3">
                  {["admin", "agent", "viewer"].map((r) => (
                    <label
                      key={r}
                      className={[
                        "flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all border",
                        role === r ? "border-primary/50 bg-primary/5" : "border-transparent hover:border-primary/30 hover:bg-white/5",
                      ].join(" ")}
                    >
                      <input
                        className="mt-1 text-primary focus:ring-primary bg-background-dark border-white/20"
                        name="role"
                        type="radio"
                        value={r}
                        checked={role === r}
                        onChange={() => setRole(r)}
                      />
                      <div>
                        <p className={["font-black text-sm", role === r ? "text-primary" : "text-white"].join(" ")}>
                          {r.toUpperCase()}
                        </p>
                        <p className="text-xs text-white/50 mt-1 leading-relaxed">
                          {r === "admin"
                            ? "Manage team + workspace settings."
                            : r === "agent"
                            ? "Can handle posts/messages."
                            : "View-only access."}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </form>

            <div className="mt-auto space-y-3">
              <button
                onClick={submit}
                disabled={!canSend}
                className="w-full bg-primary hover:opacity-90 disabled:opacity-60 text-background-dark font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/10"
              >
                <span className="material-symbols-outlined">send</span>
                <span>Send Invitation</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full bg-transparent hover:bg-white/5 text-white/50 font-semibold py-3 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function WorkspaceTeam({ theme, setTheme }) {
  const nav = useNavigate();
  const { workspaceId } = useParams();

  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState(false);

  const [loading, setLoading] = useState(true);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [members, setMembers] = useState([]);

  async function loadAll() {
    setLoading(true);

    const membersReq = supabase
      .from("workspace_members")
      .select("id,user_id,role,status,created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    const invitesReq = supabase
      .from("workspace_invites")
      .select("id,email,role,status,created_at")
      .eq("workspace_id", workspaceId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    const [{ data: memRows, error: memErr }, { data: invRows, error: invErr }] =
      await Promise.all([membersReq, invitesReq]);

    if (memErr) console.error("members load error:", memErr);
    if (invErr) console.error("invites load error:", invErr);

    setMembers(
      (memRows || []).map((m) => ({
        id: m.id,
        name: m.user_id, // later: join profiles table for real name/email/avatar
        email: m.user_id,
        role: m.role,
        status: m.status,
        added: new Date(m.created_at).toLocaleDateString(),
        avatar: "https://api.dicebear.com/7.x/initials/svg?seed=" + encodeURIComponent(m.user_id),
      }))
    );

    setPendingInvites(
      (invRows || []).map((i) => ({
        id: i.id,
        email: i.email,
        role: i.role,
        when: new Date(i.created_at).toLocaleString(),
      }))
    );

    setLoading(false);
  }

  useEffect(() => {
    if (!workspaceId) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => String(m.name).toLowerCase().includes(q) || String(m.email).toLowerCase().includes(q));
  }, [members, search]);

  async function updateMemberRole(memberId, nextRole) {
    const { error } = await supabase
      .from("workspace_members")
      .update({ role: nextRole })
      .eq("id", memberId);

    if (error) {
      console.error("update role error:", error);
      return;
    }

    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role: nextRole } : m)));
  }

  async function removeMember(memberId) {
    const { error } = await supabase
      .from("workspace_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      console.error("remove member error:", error);
      return;
    }

    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  }

  async function resendInvite(inviteId) {
    // simplest: just touch updated time or keep as UI dummy
    // If you want: call an Edge Function to send email.
    await loadAll();
  }

  async function onSendInvite({ email, role }) {
    const { error } = await supabase
      .from("workspace_invites")
      .insert({
        workspace_id: workspaceId,
        email,
        role,
        status: "pending",
      });

    if (error) {
      console.error("invite insert error:", error);
      return;
    }

    setDrawer(false);
    await loadAll();
  }

  return (
    <AppShell theme={theme} setTheme={setTheme} active="members" topTitle={null}>
      <main className="flex-1 overflow-y-auto custom-scrollbar relative">
        <header className="sticky top-0 z-20 glass-panel border-b border-white/10 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6 flex-1">
            <h1 className="text-2xl font-black tracking-tight text-white">Members</h1>

            <div className="relative max-w-md w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-xl">
                search
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-11 pr-4 py-2 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-white/30 text-white"
                placeholder="Search members by name or email..."
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setDrawer(true)}
              className="bg-primary hover:opacity-90 text-background-dark font-black px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-primary/10"
            >
              <span className="material-symbols-outlined text-xl">person_add</span>
              <span>Invite Member</span>
            </button>

            <button
              onClick={() => nav(`/workspaces/${workspaceId}`)}
              className="size-10 rounded-full border border-primary/30 p-0.5 overflow-hidden"
              title="Back to workspace"
            >
              <img
                alt="User Profile"
                className="rounded-full w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBU1TK5N_AkTWNLM6WSopEis2gt2aCRUFzigi-W2P4g-Piz9T0o-g7YibsoSxknjp9ZYHI68cYva9Q34XCDfPPtj_bzbfK9z9-BrdJUUW8o6yVJHCiF0Mby5JFiq5sXHaVQIR08bgkeaTts0ITNdQazYzs293vCH0KGYN7n_KIbH1FMm_8S_Lx0n1IapgHo1FaQFPdG2eg8p6ckPCemORkEqMGruk2aUIBZ15-TFSOHrJxaySRWJa80UZj05UN5rV0CtTAPIWRkgp8"
              />
            </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full space-y-10">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black flex items-center gap-2 text-white">
                <span className="material-symbols-outlined text-primary">schedule_send</span>
                Pending Invites
              </h2>

              <span className="text-xs font-bold uppercase tracking-wider text-white/40">
                {pendingInvites.length} Pending
              </span>
            </div>

            {loading ? (
              <div className="glass-panel rounded-xl border border-white/10 p-6 text-white/60">Loading...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingInvites.map((inv) => (
                  <Glass
                    key={inv.id}
                    className="rounded-xl p-4 flex items-center justify-between border-l-2 border-l-primary/50 bg-white/0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary border border-primary/20">
                        <span className="material-symbols-outlined">mail</span>
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate max-w-[180px] text-white">{inv.email}</p>
                        <p className="text-xs text-white/40">
                          {inv.role} • {inv.when}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => resendInvite(inv.id)}
                      className="text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg text-xs font-black transition-colors"
                    >
                      Resend
                    </button>
                  </Glass>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black flex items-center gap-2 text-white">
                <span className="material-symbols-outlined text-primary">verified_user</span>
                Active Workspace Members
              </h2>
            </div>

            <Glass className="rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[920px]">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="px-6 py-4 text-[11px] font-black text-white/40 uppercase tracking-wider">
                        Name / Email
                      </th>
                      <th className="px-6 py-4 text-[11px] font-black text-white/40 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-4 text-[11px] font-black text-white/40 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-[11px] font-black text-white/40 uppercase tracking-wider">
                        Added Date
                      </th>
                      <th className="px-6 py-4 text-[11px] font-black text-white/40 uppercase tracking-wider text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/10">
                    {filteredMembers.map((m) => (
                      <tr key={m.id} className="group hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              alt={m.name}
                              className="size-10 rounded-full object-cover border border-white/10"
                              src={m.avatar}
                            />
                            <div>
                              <p className="font-semibold text-white">{m.name}</p>
                              <p className="text-xs text-white/40">{m.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <RoleSelect value={m.role} onChange={(next) => updateMemberRole(m.id, next)} />
                        </td>

                        <td className="px-6 py-4">
                          <StatusPill status={m.status} />
                        </td>

                        <td className="px-6 py-4 text-sm text-white/40">{m.added}</td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-primary transition-colors"
                              title="Change Role"
                            >
                              <span className="material-symbols-outlined text-xl">manage_accounts</span>
                            </button>

                            <button
                              onClick={() => removeMember(m.id)}
                              className="p-2 hover:bg-red-500/10 rounded-lg text-white/40 hover:text-red-400 transition-colors"
                              title="Remove Member"
                            >
                              <span className="material-symbols-outlined text-xl">person_remove</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!loading && filteredMembers.length === 0 ? (
                      <tr>
                        <td className="px-6 py-8 text-white/40" colSpan={5}>
                          No members found.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </Glass>
          </section>
        </div>

        <Drawer open={drawer} onClose={() => setDrawer(false)} onSend={onSendInvite} />
      </main>
    </AppShell>
  );
}