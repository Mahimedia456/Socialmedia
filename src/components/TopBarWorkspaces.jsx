import React from "react";

export default function TopBarWorkspaces({ onSearch, searchValue = "" }) {
  return (
    <header className="flex items-center justify-between border-b border-primary/10 px-8 py-3 bg-background-light dark:bg-background-dark sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3 text-primary">
          <div className="size-6 bg-primary/20 rounded flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-xl">hub</span>
          </div>
          <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold tracking-tight">
            Unified Social Suite
          </h2>
        </div>

        <div className="hidden md:flex flex-col min-w-64 !h-10">
          <div className="flex w-full flex-1 items-stretch rounded-lg h-full bg-slate-200/50 dark:bg-primary/10 border border-primary/10">
            <div className="text-slate-500 dark:text-primary/60 flex items-center justify-center pl-3">
              <span className="material-symbols-outlined text-xl">search</span>
            </div>
            <input
              value={searchValue}
              onChange={(e) => onSearch?.(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-400 dark:placeholder:text-primary/40"
              placeholder="Search workspaces..."
              type="text"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 rounded-lg bg-slate-200/50 dark:bg-primary/10 text-slate-600 dark:text-primary transition-colors hover:bg-primary/20">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="p-2 rounded-lg bg-slate-200/50 dark:bg-primary/10 text-slate-600 dark:text-primary transition-colors hover:bg-primary/20">
          <span className="material-symbols-outlined">settings</span>
        </button>

        <div className="h-8 w-px bg-primary/10 mx-2" />

        <div className="size-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center overflow-hidden">
          {/* replace with real avatar */}
          <div className="size-full bg-primary/10" />
        </div>
      </div>
    </header>
  );
}