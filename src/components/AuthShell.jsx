import React from "react";
import { toggleTheme } from "../lib/theme.js";

export default function AuthShell({ theme, setTheme, children }) {
  const isDark = theme === "dark";

  return (
    <div className="relative min-h-screen bg-background-light dark:bg-background-dark font-display transition-colors duration-300 overflow-hidden">
      
      {/* Radial Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#112a29_0%,#0a0e0e_100%)] dark:block hidden" />
      
      {/* Glow Accent */}
      <div className="absolute bottom-[-10%] left-[-5%] h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      {/* Theme Toggle */}
      <button
        type="button"
        className="fixed top-8 right-8 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-primary border border-primary/20 hover:bg-primary/10 transition-all backdrop-blur-md"
        onClick={() => setTheme((t) => toggleTheme(t))}
        aria-label="Toggle theme"
      >
        <span
          className={`material-symbols-outlined text-[20px] ${
            isDark ? "hidden" : ""
          }`}
        >
          dark_mode
        </span>
        <span
          className={`material-symbols-outlined text-[20px] ${
            isDark ? "" : "hidden"
          }`}
        >
          light_mode
        </span>
      </button>

      {/* Centered Content */}
      <div className="relative z-10 flex min-h-screen w-full items-center justify-center p-4 sm:p-6">
        {children}
      </div>
    </div>
  );
}
