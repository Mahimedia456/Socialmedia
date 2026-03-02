// src/components/Sidebar.jsx
import React, { useEffect, useState, useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/images/logo.png";

function Item({ to, icon, label, badge, active, onClick, disabled }) {
  const base =
    "group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all";
  const activeCls = "bg-primary/10 text-primary active-glow";
  const idleCls = "hover:bg-white/5 text-slate-400 hover:text-white";
  const disabledCls =
    "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-slate-400";

  if (onClick) {
    return (
      <button
        type="button"
        onClick={disabled ? undefined : onClick}
        className={`${base} ${active ? activeCls : idleCls} ${
          disabled ? disabledCls : ""
        } w-full text-left`}
      >
        {active ? (
          <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary rounded-full" />
        ) : null}

        <span className="material-symbols-outlined">{icon}</span>
        <span className="text-sm font-medium">{label}</span>

        {badge ? (
          <span className="ml-auto bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">
            {badge}
          </span>
        ) : null}
      </button>
    );
  }

  return (
    <NavLink
      to={to}
      className={`${base} ${active ? activeCls : idleCls} ${
        disabled ? disabledCls : ""
      }`}
      onClick={(e) => {
        if (disabled) e.preventDefault();
      }}
    >
      {active ? (
        <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary rounded-full" />
      ) : null}

      <span className="material-symbols-outlined">{icon}</span>
      <span className="text-sm font-medium">{label}</span>

      {badge ? (
        <span className="ml-auto bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">
          {badge}
        </span>
      ) : null}
    </NavLink>
  );
}

export default function Sidebar({ active = "dashboard" }) {
  const navigate = useNavigate();
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(
    localStorage.getItem("active_workspace_id") || ""
  );

  useEffect(() => {
    const sync = () =>
      setActiveWorkspaceId(localStorage.getItem("active_workspace_id") || "");

    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const wsId = useMemo(() => String(activeWorkspaceId || "").trim(), [activeWorkspaceId]);
  const hasWs = !!wsId;

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("session_token");
    localStorage.removeItem("user");
    localStorage.removeItem("permissions");
    localStorage.removeItem("active_workspace_id");
    navigate("/login");
  };

  return (
    <aside className="w-[280px] glass-sidebar flex flex-col h-full z-30">
      {/* Header */}
      <div className="p-8 flex items-center gap-3">
        <div className="size-10 rounded-xl overflow-hidden active-glow bg-white/5 border border-primary/20 flex items-center justify-center">
          <img src={logo} alt="Mahimedia" className="h-7 w-auto object-contain" />
        </div>

        <div>
          <h1 className="text-white text-lg font-bold leading-none tracking-tight">
            Unified
          </h1>
          <p className="text-primary text-[10px] uppercase tracking-[0.2em] font-semibold mt-1">
            Social Suite
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 space-y-1 mt-2">
        <Item to="/dashboard" icon="dashboard" label="Dashboard" active={active === "dashboard"} />
        <Item to="/inbox" icon="inbox" label="Inbox" badge="12" active={active === "inbox"} />
        <Item to="/publisher" icon="send" label="Publisher" active={active === "publisher"} />
        <Item to="/calendar" icon="calendar_today" label="Calendar" active={active === "calendar"} />
        <Item to="/analytics" icon="analytics" label="Analytics" active={active === "analytics"} />
        <Item to="/contacts" icon="group" label="Contacts" active={active === "contacts"} />

        {/* ✅ Global Connections */}
        <Item
          to="/connections"
          icon="add_link"
          label="Connections"
          active={active === "connections"}
        />

        {/* Workspace */}
        <div className="pt-3 mt-3 border-t border-white/5">
          <p className="px-4 pb-2 text-[10px] uppercase tracking-[0.22em] text-white/30 font-bold">
            Workspace
          </p>

          <Item
            to="/workspaces"
            icon="workspaces"
            label="Workspaces"
            active={active === "workspaces"}
          />

          {hasWs ? (
            <div className="mt-1 space-y-1">
              <Item
                to={`/workspaces/${wsId}`}
                icon="hub"
                label="Overview"
                active={active === "workspace_overview"}
              />
              <Item
                to={`/workspaces/${wsId}/team`}
                icon="group"
                label="Members"
                active={active === "workspace_members"}
              />
              <Item
                to={`/workspaces/${wsId}/settings`}
                icon="settings"
                label="Settings"
                active={active === "workspace_settings"}
              />
            </div>
          ) : (
            <div className="mt-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-white/70 font-semibold">No workspace selected</p>
              <p className="text-[11px] text-white/50 mt-1">
                Open a workspace to see overview, members, and settings.
              </p>
              <button
                type="button"
                className="mt-2 text-primary text-xs font-bold hover:underline"
                onClick={() => navigate("/workspaces")}
              >
                Go to Workspaces →
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Bottom */}
      <div className="p-4 mt-auto border-t border-white/5">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all"
        >
          <span className="material-symbols-outlined">settings</span>
          <span className="text-sm font-medium">Settings</span>
        </NavLink>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full mt-2 flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="text-sm font-medium">Logout</span>
        </button>

        <div className="mt-4 p-4 glass-card rounded-2xl bg-primary/5 border border-primary/20">
          <p className="text-xs text-slate-400 mb-2">Storage used</p>
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div className="bg-primary h-full w-[65%] rounded-full shadow-[0_0_8px_rgba(19,241,226,0.5)]" />
          </div>
          <p className="text-[10px] text-slate-500 mt-2">6.5 GB of 10 GB</p>
        </div>
      </div>
    </aside>
  );
}