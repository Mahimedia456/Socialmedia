// src/pages/auth/MetaCallback.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE;

function getAccessToken() {
  return localStorage.getItem("access_token") || "";
}

function parseState(stateRaw) {
  // supports JSON and base64(JSON)
  try {
    return JSON.parse(stateRaw);
  } catch {}
  try {
    return JSON.parse(atob(stateRaw));
  } catch {}
  return null;
}

export default function MetaCallback() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [status, setStatus] = useState("Connecting to Meta…");

  useEffect(() => {
    const run = async () => {
      const code = params.get("code");
      const stateRaw = params.get("state");

      // must have code+state
      if (!code || !stateRaw) {
        nav("/connections", { replace: true });
        return;
      }

      // must be logged in
      const access = getAccessToken();
      if (!access) {
        nav("/login", { replace: true });
        return;
      }

      // must include workspaceId in state
      const st = parseState(stateRaw);
      const workspaceId = String(st?.workspaceId || "");
      if (!workspaceId) {
        setStatus("Invalid state (missing workspaceId).");
        nav("/connections", { replace: true });
        return;
      }

      try {
        setStatus("Exchanging code…");

        const r = await fetch(`${API_BASE}/api/meta/exchange`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access}`,
          },
          body: JSON.stringify({ code, workspaceId }),
        });

        const j = await r.json().catch(() => ({}));

        if (!r.ok) {
          console.error("Meta exchange failed:", j);
          const msg = j?.message || j?.error || "Meta exchange failed";
          setStatus(msg);
          // go back to connections (no query params)
          setTimeout(() => nav("/connections", { replace: true }), 300);
          return;
        }

        // ✅ ensure workspaceId is present for ChannelConnections Option A
        const payload = { ...j, workspaceId };

        // ✅ store for ChannelConnections to open modal
        localStorage.setItem("meta_exchange_result", JSON.stringify(payload));

        setStatus("Redirecting…");
        nav("/connections", { replace: true });
      } catch (e) {
        console.error(e);
        setStatus("Network error while connecting Meta");
        setTimeout(() => nav("/connections", { replace: true }), 300);
      }
    };

    run();
  }, [params, nav]);

  return (
    <div className="min-h-screen bg-background-dark text-white flex items-center justify-center">
      <div className="glass-panel p-6 rounded-2xl border border-white/10">
        {status}
      </div>
    </div>
  );
}