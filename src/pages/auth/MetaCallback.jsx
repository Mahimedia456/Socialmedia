// src/pages/auth/MetaCallback.jsx
import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function MetaCallback() {
  const nav = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const code = params.get("code");
    const stateRaw = params.get("state");

    if (!code || !stateRaw) {
      nav("/connections", { replace: true });
      return;
    }

    nav(
      `/connections?code=${encodeURIComponent(code)}&state=${encodeURIComponent(stateRaw)}`,
      { replace: true }
    );
  }, [params, nav]);

  return (
    <div className="min-h-screen bg-background-dark text-white flex items-center justify-center">
      <div className="glass-panel p-6 rounded-2xl border border-white/10">
        Connecting to Meta…
      </div>
    </div>
  );
}