// src/pages/Login.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toggleTheme } from "../../lib/theme.js";
import logo from "../../assets/images/logo.png";
import { apiLogin, setSession } from "../../lib/api.js";

const DEV_PASSWORD = "mahimediasolutions";

const QUICK_USERS = [
  { key: "owner", label: "Owner", email: "admin@mahimediasolutions.com" },
  { key: "admin", label: "Admin", email: "aamir@mahimediasolutions.com" },
  { key: "editor", label: "Editor", email: "editor@mahimediasolutions.com" },
  { key: "support", label: "Support", email: "support@mahimediasolutions.com" },
  { key: "viewer", label: "Viewer", email: "viewer@mahimediasolutions.com" },
];

export default function Login({ theme, setTheme }) {
  const isDark = theme === "dark";
  const navigate = useNavigate();

  const [showPwd, setShowPwd] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [activeRole, setActiveRole] = useState("owner");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const canSubmit = useMemo(
    () => email.trim().length > 0 && password.trim().length > 0,
    [email, password]
  );

  function pickRole(roleKey) {
    const u = QUICK_USERS.find((x) => x.key === roleKey);
    if (!u) return;
    setActiveRole(roleKey);
    setEmail(u.email);
    setPassword(DEV_PASSWORD);
    setErrorMsg("");
  }

  useEffect(() => {
    pickRole("owner");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    if (!canSubmit || loading) return;

    setLoading(true);
    try {
      const payload = await apiLogin({
        email: email.trim(),
        password,
      });

      // backend returns: { access_token, refresh_token, user }
      setSession({
        access_token: payload?.access_token,
        refresh_token: payload?.refresh_token,
        user: payload?.user,
      });

      // Go to workspaces (better default than dashboard)
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg =
        err?.payload?.message ||
        err?.payload?.error ||
        err?.message ||
        (typeof err === "string" ? err : "Login failed");
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-background-light dark:bg-background-dark font-display transition-colors duration-300">
      <div className="bg-glow flex min-h-screen w-full items-center justify-center p-4 sm:p-6">
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

        <main className="glass-effect relative z-10 w-full max-w-[460px] rounded-xl p-8 shadow-2xl transition-all duration-500">
          <div className="mb-6 flex flex-col items-center text-center">
            <img
              src={logo}
              alt="Mahimedia Solutions"
              className="h-12 w-auto object-contain"
            />
            <h2 className="mt-4 text-sm font-bold uppercase tracking-[0.2em] text-primary/80 dark:text-primary">
              MAHIMEDIA solutions
            </h2>
          </div>

          <div className="mb-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Internal quick login
            </div>

            <div className="grid grid-cols-5 gap-2">
              {QUICK_USERS.map((u) => {
                const active = activeRole === u.key;
                return (
                  <button
                    key={u.key}
                    type="button"
                    onClick={() => pickRole(u.key)}
                    className={[
                      "rounded-lg px-2 py-2 text-xs font-semibold transition-all border",
                      active
                        ? "bg-primary text-background-dark border-primary shadow-lg shadow-primary/20"
                        : "bg-white/40 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-primary/10 hover:bg-white dark:hover:bg-white/10",
                    ].join(" ")}
                  >
                    {u.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-500">
              Click a role to auto-fill credentials (dev mode).
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Sign in
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-primary/60">
              Enter your credentials to access the Unified Social Suite.
            </p>
          </div>

          {errorMsg ? (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMsg}
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">
                    mail
                  </span>
                </div>
                <input
                  type="email"
                  className="block w-full rounded-lg border border-slate-200 dark:border-primary/20 bg-white/50 dark:bg-black/20 py-3.5 pl-11 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">
                    lock
                  </span>
                </div>

                <input
                  type={showPwd ? "text" : "password"}
                  className="block w-full rounded-lg border border-slate-200 dark:border-primary/20 bg-white/50 dark:bg-black/20 py-3.5 pl-11 pr-12 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-primary transition-colors"
                  onClick={() => setShowPwd((v) => !v)}
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPwd ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!canSubmit || loading}
                className="group relative flex w-full justify-center rounded-lg bg-primary px-4 py-4 text-sm font-bold text-background-dark shadow-lg shadow-primary/20 hover:bg-white hover:shadow-primary/40 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="flex items-center">
                  {loading ? "Signing in..." : "Sign in"}
                  <span className="material-symbols-outlined ml-2 text-[18px] transition-transform group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </span>
              </button>
            </div>
          </form>

          <footer className="mt-10 border-t border-slate-200 dark:border-primary/10 pt-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                © 2026 MAHIMEDIA solutions. All rights reserved.
              </p>
            </div>
          </footer>
        </main>

        <div className="absolute bottom-[-10%] left-[-5%] h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      </div>
    </div>
  );
}