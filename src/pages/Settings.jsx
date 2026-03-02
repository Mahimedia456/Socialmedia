// src/pages/SettingsHome.jsx
import React from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";

function SettingsCard({ to, icon, title, desc, meta }) {
  return (
    <Link
      to={to}
      className="glass-panel border border-primary/10 rounded-2xl p-6 hover:border-primary/25 hover:bg-white/5 transition-all block"
    >
      <div className="flex items-start gap-4">
        <div className="size-12 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary">{icon}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-extrabold text-white truncate">{title}</h3>
            <span className="material-symbols-outlined text-slate-500">chevron_right</span>
          </div>

          <p className="text-sm text-slate-400 mt-1 leading-relaxed">{desc}</p>

          {meta ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {meta.map((m) => (
                <span
                  key={m}
                  className="px-3 py-1 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-widest"
                >
                  {m}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export default function SettingsHome({ theme, setTheme }) {
  return (
    <AppShell theme={theme} setTheme={setTheme} active="settingsHome" topSearchPlaceholder="Search settings...">
      <header className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 glass-panel border-b border-primary/10">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white">Settings</h1>
          <span className="text-slate-500">/</span>
          <span className="text-slate-300">Overview</span>
        </div>

        <div className="flex items-center gap-3">
          <button className="text-slate-400 hover:text-white transition-colors" type="button">
            <span className="material-symbols-outlined">help</span>
          </button>
        </div>
      </header>

      <div className="p-8 max-w-6xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white">Management</h2>
          <p className="text-slate-500 mt-2">
            Configure automation, team access, and connected social channels.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SettingsCard
            to="/settings/inbox-rules"
            icon="rule"
            title="Inbox Rules"
            desc="Automate routing, tagging, and assignments for your Social Inbox."
            meta={["Automation", "Routing", "Tags"]}
          />

          <SettingsCard
            to="/settings/team-roles"
            icon="group"
            title="Team & Roles"
            desc="Manage members, roles, and permission matrices across the workspace."
            meta={["Members", "Permissions", "Security"]}
          />

          <SettingsCard
            to="/settings/channel-connections"
            icon="link"
            title="Channel Connections"
            desc="Connect, reconnect, and monitor social accounts with health and logs."
            meta={["Facebook", "Instagram", "Reddit"]}
          />
        </div>
      </div>
    </AppShell>
  );
}
