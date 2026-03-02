import React from "react";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";

export default function AppShell({
  theme,
  setTheme,
  active = "dashboard",
  children,

  // ✅ optional: page-controlled topbar search
  topSearchPlaceholder,
  topSearchValue,
  onTopSearchChange,
}) {
  return (
    <div className="app-bg min-h-screen text-slate-200 overflow-hidden font-display">
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar active={active} />

        <main className="flex-1 flex flex-col min-w-0 bg-transparent overflow-hidden">
          <Topbar
            theme={theme}
            setTheme={setTheme}
            topSearchPlaceholder={topSearchPlaceholder}
            topSearchValue={topSearchValue}
            onTopSearchChange={onTopSearchChange}
          />
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">{children}</div>
        </main>
      </div>
    </div>
  );
}