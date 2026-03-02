import React, { useState } from "react";
import { toggleTheme } from "../lib/theme.js";

export default function Topbar({
  theme,
  setTheme,

  // ✅ Optional controlled search from pages
  topSearchPlaceholder = "Search data or analytics...",
  topSearchValue,
  onTopSearchChange,
}) {
  const isDark = theme === "dark";
  const [activeBrandTab, setActiveBrandTab] = useState("BrandA");

  const isControlled = typeof topSearchValue === "string" && typeof onTopSearchChange === "function";

  return (
    <header className="h-16 flex items-center justify-between px-8 glass-header sticky top-0 z-20">
      {/* Left: Brand Selector + tabs */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 cursor-pointer group">
          <div className="size-8 rounded-lg bg-white/10 overflow-hidden flex items-center justify-center">
            <div
              className="size-full bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=128&q=60')",
              }}
            />
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-slate-500 font-medium leading-none mb-0.5">
              Active Brand
            </span>
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold text-white">Mahimedia</span>
              <span className="material-symbols-outlined text-sm text-slate-500 group-hover:text-primary transition-colors">
                keyboard_arrow_down
              </span>
            </div>
          </div>
        </div>

        <div className="h-8 w-px bg-white/10" />

        <nav className="hidden lg:flex items-center gap-6">
          <button
            type="button"
            onClick={() => setActiveBrandTab("BrandA")}
            className={
              activeBrandTab === "BrandA"
                ? "text-xs font-semibold text-primary"
                : "text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            }
          >
            BrandA
          </button>
          <button
            type="button"
            onClick={() => setActiveBrandTab("BrandB")}
            className={
              activeBrandTab === "BrandB"
                ? "text-xs font-semibold text-primary"
                : "text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            }
          >
            BrandB
          </button>
        </nav>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-md px-8">
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg group-focus-within:text-primary transition-colors">
            search
          </span>

          <input
            value={isControlled ? topSearchValue : undefined}
            onChange={isControlled ? (e) => onTopSearchChange(e.target.value) : undefined}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-12 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder-slate-500 transition-all"
            placeholder={topSearchPlaceholder}
            type="text"
          />

          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none">
            <span className="text-[10px] text-slate-500 border border-white/10 rounded px-1.5 py-0.5 bg-white/5">
              ⌘
            </span>
            <span className="text-[10px] text-slate-500 border border-white/10 rounded px-1.5 py-0.5 bg-white/5">
              K
            </span>
          </div>
        </div>
      </div>

      {/* Right: Utilities */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="size-10 flex items-center justify-center rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all"
          onClick={() => setTheme((t) => toggleTheme(t))}
          aria-label="Toggle theme"
        >
          <span className="material-symbols-outlined">
            {isDark ? "dark_mode" : "light_mode"}
          </span>
        </button>

        <button
          type="button"
          className="size-10 flex items-center justify-center rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all relative"
          aria-label="Notifications"
        >
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2.5 right-2.5 size-2 bg-primary rounded-full border-2 border-background-dark" />
        </button>

        <div className="h-8 w-px bg-white/10 mx-1" />

        <div className="flex items-center gap-3 pl-2 cursor-pointer group">
          <div className="size-9 rounded-full border border-primary/30 p-0.5">
            <div
              className="size-full rounded-full bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=128&q=60')",
              }}
            />
          </div>

          <div className="hidden md:flex flex-col text-right">
            <span className="text-sm font-semibold text-white group-hover:text-primary transition-colors">
              Alex Morgan
            </span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
              Administrator
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}