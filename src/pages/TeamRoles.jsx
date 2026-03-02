// src/pages/TeamRoles.jsx
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";

const MEMBERS = [
  {
    id: "m1",
    name: "Alex Rivera",
    email: "active@example.com",
    role: "Owner",
    status: "Active",
    lastActive: "2m ago",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuADzj3nrpjLx0rRhyFsSNGP0ot0356BkhxnIUdeHb9lfUt_nb1G_z1aQSnVLZaNHzErTwqbT3IZ14fmU434KdvBYD1qQ-a4PPWDY0npex90azzr_X3N0sOGGWM9un6nDJI0SWrczbweSOjfd-Meg0PNyGXByqx_DeGWLkC9RnAMwPBjuY9dQhX4PglowKWAkNGdIALbfhmVKVYRLGb6KIINPwXeBssKMU0_DA1ICaq81nxIi6xckFXxLbc-_zUM3cHYauS4fUntV4A",
  },
  {
    id: "m2",
    name: "Sarah Jenkins",
    email: "sarah.j@example.com",
    role: "Admin",
    status: "Active",
    lastActive: "1h ago",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBpfLsTtBc6SLx2LJ2OIIEOAS-TFUZst5Q4vK16pVkR48JQZyYk1F2ZVpYVU33clLv-KobWLW_l28njJXak-Bw6sPrO8Cad2KmyThKdKuyPbrOWE3RtoCO4sBzjsRMTXRdxXg9WVqAmRVCnK3KykpjVHBAUzaeeco8Lxysw2RrELTp2VkukehK-fd8f8DwnHm6ngiBaYaoXQStnGkI1WUKrXcLieAYGP90W_Sk4m8rJ-rBpY438_CLsfZOJmDF6xDQ98QH_rhYUGAw",
  },
  {
    id: "m3",
    name: "Mark Wood",
    email: "mark.w@example.com",
    role: "Agent",
    status: "Invited",
    lastActive: "N/A",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAitmwI-Rz64PWAK5vUnGCXtaVbaqOVW5D3N5sdQtPLhhsxUKOdzHVcNIdlrKwJX74p4itHIJG1C4CCRMsTVPc7c3z1vq85iUFTbUb3Eg25wTWv6tqRmOHVC1BjkeRZreOWzYSIy3P19qQGQM1fe3HN-FmvDdMcpf1x0Dy4c4xSSnyYHVbUFdr2vapmP-kC3zskL_CEFaRm7arUcwyYB7t6I737ZgzvfOIdTpGSZ1iI_fOBGVqsEZnkdLX8ow-CbgdIV422etr56Qw",
  },
  {
    id: "m4",
    name: "Elena Rossi",
    email: "elena@example.com",
    role: "Viewer",
    status: "Active",
    lastActive: "5h ago",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAF1eLSvGBW-oKD0op4QFzoGAqGrfWqYCTwEpz9wo4njagdiPYRhK3oFd8hmeETxitEeOwrm-4Un6B4PmVxS_UqZM9-uES1ZCMW0E-sPOtmfmPD22RomCqkQDrHLx4wSS7lYPpELGhNnYa4il4ON1_XHvS5obzDzNZg6QEa-bS8YFDWR8-Fpg-WNJvcMPwJTj18Q3Kpe9IOeToXzaggZMZ3PHlwUZIE2AdpmaSOLzGaOc2ewlRY2G0Xmf6wzVB9-u7iu5BwGUQlXpU",
  },
];

const PERMISSIONS = [
  { key: "view_inbox", label: "View Social Inbox", owner: true, admin: true, agent: true, viewer: true },
  { key: "reply", label: "Reply to Messages", owner: true, admin: true, agent: true, viewer: false },
  { key: "assign", label: "Assign Conversations", owner: true, admin: true, agent: true, viewer: false },
  { key: "publish", label: "Create/Schedule Posts", owner: true, admin: true, agent: false, viewer: false },
  { key: "delete", label: "Delete Content", owner: true, admin: false, agent: false, viewer: false },
  { key: "billing", label: "Manage Billing", owner: true, admin: false, agent: false, viewer: false },
];

const ACTIVITY = [
  { id: "a1", tone: "primary", text: "Sarah Jenkins invited Mark Wood", time: "2 hours ago" },
  { id: "a2", tone: "muted", text: "Alex Rivera updated permissions for Admin role", time: "5 hours ago" },
  { id: "a3", tone: "primary", text: "Elena Rossi logged in", time: "12 hours ago" },
  { id: "a4", tone: "muted", text: 'Alex Rivera changed workspace name to "Global Ops"', time: "1 day ago" },
  { id: "a5", tone: "warn", text: "Billing failed for the monthly subscription", time: "2 days ago" },
];

function StatusDot({ status }) {
  const isInvited = status === "Invited";
  return (
    <span
      className={[
        "inline-block size-2 rounded-full",
        isInvited ? "bg-amber-500" : "bg-primary",
      ].join(" ")}
    />
  );
}

function RolePill({ role }) {
  if (role === "Owner") {
    return (
      <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-primary/20 text-primary border border-primary/30 uppercase tracking-tighter">
        Owner
      </span>
    );
  }
  return (
    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 uppercase tracking-tighter">
      {role}
    </span>
  );
}

function PermIcon({ ok }) {
  return ok ? (
    <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
  ) : (
    <span className="material-symbols-outlined text-slate-700 text-[20px]">cancel</span>
  );
}

export default function TeamRoles({ theme, setTheme }) {
  const [memberQuery, setMemberQuery] = useState("");
  const [filterRole, setFilterRole] = useState("All");

  const filteredMembers = useMemo(() => {
    const q = memberQuery.trim().toLowerCase();
    return MEMBERS.filter((m) => {
      const roleOk = filterRole === "All" ? true : m.role === filterRole;
      if (!roleOk) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q)
      );
    });
  }, [memberQuery, filterRole]);

  return (
    <AppShell theme={theme} setTheme={setTheme} active="teamRoles" topSearchPlaceholder="Search members...">
      {/* Top navbar (breadcrumb + search + icons) */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 glass-panel border-b border-primary/10">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white">Settings</h1>
          <span className="text-slate-500">/</span>
          <span className="text-slate-300">Team &amp; Roles</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xl">
              search
            </span>
            <input
              value={memberQuery}
              onChange={(e) => setMemberQuery(e.target.value)}
              className="w-64 bg-slate-800/50 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary placeholder:text-slate-500 text-white"
              placeholder="Search members..."
              type="text"
            />
          </div>

          <button className="text-slate-400 hover:text-white transition-colors relative" type="button">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-0 right-0 size-2 bg-primary rounded-full" />
          </button>

          <button className="text-slate-400 hover:text-white transition-colors" type="button">
            <span className="material-symbols-outlined">help</span>
          </button>
        </div>
      </header>

      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-tight mb-1 text-white">Team &amp; Roles</h2>
            <p className="text-slate-500">
              Manage your team member access and define specific permissions for each role.
            </p>
          </div>

          <button
            className="flex items-center justify-center gap-2 bg-primary text-background-dark px-6 py-2.5 rounded-xl font-bold hover:brightness-110 transition-all shrink-0"
            type="button"
          >
            <span className="material-symbols-outlined">person_add</span>
            Invite member
          </button>
        </div>

        {/* Members table */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Members</h3>

            <div className="flex items-center gap-2">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 focus:ring-0"
              >
                <option>All</option>
                <option>Owner</option>
                <option>Admin</option>
                <option>Agent</option>
                <option>Viewer</option>
              </select>

              <button className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300" type="button">
                Export
              </button>
            </div>
          </div>

          <div className="glass-panel rounded-xl overflow-hidden border border-primary/10">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-primary/5 text-primary text-xs font-bold uppercase tracking-widest border-b border-primary/10">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Last Active</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>

              <tbody className="divide-y divide-primary/5">
                {filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-primary/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={[
                            "size-10 rounded-full overflow-hidden",
                            m.role === "Owner"
                              ? "bg-slate-700 border-2 border-primary"
                              : "bg-slate-700 border border-slate-600",
                          ].join(" ")}
                        >
                          <img alt={m.name} className="size-full object-cover" src={m.avatar} />
                        </div>

                        <span className="font-medium text-white">{m.name}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate-400 text-sm">{m.email}</td>

                    <td className="px-6 py-4">
                      <RolePill role={m.role} />
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <StatusDot status={m.status} />
                        <span className="text-sm font-medium text-white">{m.status}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate-400 text-sm">{m.lastActive}</td>

                    <td className="px-6 py-4 text-right">
                      <button className="material-symbols-outlined text-slate-500 hover:text-white" type="button">
                        more_vert
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredMembers.length === 0 ? (
                  <tr>
                    <td className="px-6 py-8 text-center text-slate-500 text-sm" colSpan={6}>
                      No members matched your search.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Role permissions matrix */}
          <section className="xl:col-span-2">
            <h3 className="text-xl font-bold mb-4 text-white">Role Permissions</h3>

            <div className="glass-panel rounded-xl overflow-hidden border border-primary/10">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-primary/5 border-b border-primary/10">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-primary">
                      Capability
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-bold uppercase text-slate-400">
                      Owner
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-bold uppercase text-slate-400">
                      Admin
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-bold uppercase text-slate-400">
                      Agent
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-bold uppercase text-slate-400">
                      Viewer
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-primary/5">
                  {PERMISSIONS.map((p) => (
                    <tr key={p.key}>
                      <td className="px-6 py-4 font-medium text-sm text-white">{p.label}</td>
                      <td className="px-4 py-4 text-center"><PermIcon ok={p.owner} /></td>
                      <td className="px-4 py-4 text-center"><PermIcon ok={p.admin} /></td>
                      <td className="px-4 py-4 text-center"><PermIcon ok={p.agent} /></td>
                      <td className="px-4 py-4 text-center"><PermIcon ok={p.viewer} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Activity timeline */}
          <section className="xl:col-span-1">
            <h3 className="text-xl font-bold mb-4 text-white">Team Activity</h3>

            <div className="glass-panel rounded-xl p-6 border border-primary/10">
              <div className="space-y-6 relative before:content-[''] before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-primary/20">
                {ACTIVITY.map((a) => (
                  <div key={a.id} className="relative pl-8">
                    <div
                      className={[
                        "absolute left-1.5 top-1.5 size-3 rounded-full border-4 border-background-dark",
                        a.tone === "primary"
                          ? "bg-primary"
                          : a.tone === "warn"
                          ? "bg-amber-500"
                          : "bg-primary/40",
                      ].join(" ")}
                    />
                    <p className="text-sm font-medium text-white">{a.text}</p>
                    <p className="text-xs text-slate-500 mt-1">{a.time}</p>
                  </div>
                ))}
              </div>

              <button
                className="w-full mt-6 py-2 rounded-lg bg-primary/5 text-primary text-xs font-bold hover:bg-primary/10 transition-colors uppercase tracking-widest"
                type="button"
              >
                View all activity
              </button>
            </div>
          </section>
        </div>

        {/* Footer spacing */}
        <div className="h-4" />
      </div>
    </AppShell>
  );
}
