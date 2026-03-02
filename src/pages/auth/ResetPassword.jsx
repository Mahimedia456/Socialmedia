// src/pages/ResetPassword.jsx
import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../../components/AuthShell.jsx";
import logo from "../../assets/images/logo.png";
import { resetPasswordApi } from "../../lib/authApi.js";

export default function ResetPassword({ theme, setTheme }) {
  const navigate = useNavigate();

  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const match = pwd.length > 0 && pwd === confirm;
  const canSubmit = useMemo(() => pwd.length >= 8 && match, [pwd, match]);

  async function onSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    if (!canSubmit || done || loading) return;

    const reset_token = sessionStorage.getItem("pw_reset_token") || "";
    if (!reset_token) {
      setErrorMsg("Reset session expired. Go back to Forgot Password.");
      return;
    }

    setLoading(true);
    try {
      await resetPasswordApi({ reset_token, new_password: pwd });

      setDone(true);

      // clear reset session
      sessionStorage.removeItem("pw_reset_token");
      sessionStorage.removeItem("pw_reset_email");

      setTimeout(() => {
        navigate("/login");
      }, 700);
    } catch (err) {
      setErrorMsg(
        err?.payload?.message ||
          err?.payload?.error ||
          err?.message ||
          "Failed to reset password"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell theme={theme} setTheme={setTheme}>
      <main className="glass-effect relative z-10 w-full max-w-[460px] rounded-xl p-8 shadow-2xl transition-all duration-500">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src={logo} alt="Mahimedia Solutions" className="h-12 w-auto object-contain" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Reset Password
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Set a new password for your account.
        </p>

        {errorMsg ? (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMsg}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              New password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                <span className="material-symbols-outlined text-[20px]">lock</span>
              </div>

              <input
                type={showPwd ? "text" : "password"}
                className="block w-full rounded-lg border border-slate-200 dark:border-primary/20 bg-white/50 dark:bg-black/20 py-3.5 pl-11 pr-12 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="Minimum 8 characters"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                required
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

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Confirm password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                <span className="material-symbols-outlined text-[20px]">lock</span>
              </div>

              <input
                type={showPwd ? "text" : "password"}
                className="block w-full rounded-lg border border-slate-200 dark:border-primary/20 bg-white/50 dark:bg-black/20 py-3.5 pl-11 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="Re-enter password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>

            <div className="text-xs">
              {confirm.length === 0 ? null : match ? (
                <span className="text-primary/80">Passwords match.</span>
              ) : (
                <span className="text-red-400">Passwords do not match.</span>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit || done || loading}
            className="group relative flex w-full justify-center rounded-lg bg-primary px-4 py-4 text-sm font-bold text-background-dark shadow-lg shadow-primary/20 hover:bg-white hover:shadow-primary/40 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="flex items-center">
              {done ? "Password updated" : loading ? "Updating..." : "Update password"}
              <span className="material-symbols-outlined ml-2 text-[18px] transition-transform group-hover:translate-x-1">
                arrow_forward
              </span>
            </span>
          </button>

          <div className="pt-2 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              Back to login
            </Link>
          </div>
        </form>
      </main>
    </AuthShell>
  );
}