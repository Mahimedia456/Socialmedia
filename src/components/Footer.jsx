import React from "react";
import { NavLink } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="shrink-0 border-t border-white/5 bg-background-dark/60 backdrop-blur px-8 py-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="text-xs text-white/40">
          © {year} Mahimedia Solutions. All rights reserved.
        </div>

        <div className="flex items-center gap-4 text-xs">
          <NavLink to="/privacy-policy" className="text-white/50 hover:text-white transition">
            Privacy Policy
          </NavLink>
          <NavLink to="/terms" className="text-white/50 hover:text-white transition">
            Terms & Conditions
          </NavLink>
        </div>
      </div>
    </footer>
  );
}