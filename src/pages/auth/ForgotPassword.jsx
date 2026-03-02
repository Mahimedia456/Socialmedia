// src/pages/ForgotPassword.jsx
import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../../components/AuthShell.jsx";
import logo from "../../assets/images/logo.png";
import { forgotPasswordApi } from "../../lib/authApi.js";

export default function ForgotPassword({ theme, setTheme }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const canSubmit = useMemo(() => email.trim().length > 0, [email]);

  async function onSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    if (!canSubmit || loading) return;

    setLoading(true);
    try {
      await forgotPasswordApi({ email: email.trim() });

      // keep email for verify step
      sessionStorage.setItem("pw_reset_email", email.trim());

      setSent(true);
      setTimeout(() => {
        navigate("/verify-email");
      }, 300);
    } catch (err) {
      setErrorMsg(
        err?.payload?.message ||
          err?.payload?.error ||
          err?.message ||
          "Failed to send reset code"
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
          Forgot Password
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Enter your email address and we&apos;ll send you a 6-digit code to reset your password.
        </p>

        {errorMsg ? (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMsg}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email address
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                <span className="material-symbols-outlined text-[20px]">mail</span>
              </div>
              <input
                type="email"
                className="block w-full rounded-lg border border-slate-200 dark:border-primary/20 bg-white/50 dark:bg-black/20 py-3.5 pl-11 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit || sent || loading}
            className="group relative flex w-full justify-center rounded-lg bg-primary px-4 py-4 text-sm font-bold text-background-dark shadow-lg shadow-primary/20 hover:bg-white hover:shadow-primary/40 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="flex items-center">
              {sent ? "Code sent" : loading ? "Sending..." : "Send reset code"}
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
              Back to sign in
            </Link>
          </div>
        </form>

        <div className="mt-10 text-center text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-600">
          Secure recovery system
        </div>
      </main>
    </AuthShell>
  );
}