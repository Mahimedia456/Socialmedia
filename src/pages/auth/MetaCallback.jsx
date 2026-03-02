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
      // Meta can send error params too
      const error = params.get("error");
      const errorReason = params.get("error_reason");
      const errorDescription = params.get("error_description");

      if (error || errorDescription) {
        const msg = errorDescription || errorReason || error || "Meta login failed";
        console.error("Meta OAuth error:", { error, errorReason, errorDescription });
        setStatus(msg);
        setTimeout(() => nav("/connections", { replace: true }), 400);
        return;
      }

      const code = params.get("code");
      const stateRaw = params.get("state");

      // must have code+state
      if (!code || !stateRaw) {
        nav("/connections", { replace: true });
        return;
      }

      // must be logged in (your app)
      const access = getAccessToken();
      if (!access) {
        nav("/login", { replace: true });
        return;
      }

      // must include workspaceId in state
      const st = parseState(stateRaw);
      const workspaceId = String(st?.workspaceId || "");
      if (!workspaceId) {
        console.error("MetaCallback invalid stateRaw:", stateRaw);
        setStatus("Invalid state (missing workspaceId).");
        setTimeout(() => nav("/connections", { replace: true }), 400);
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
          const msg = j?.message || j?.error || `Meta exchange failed (${r.status})`;
          setStatus(msg);

          // Clear any stale payload so Connections doesn't try opening old data
          localStorage.removeItem("meta_exchange_result");

          setTimeout(() => nav("/connections", { replace: true }), 500);
          return;
        }

        // ✅ CRITICAL: include workspaceId for Option A modal logic
        // ChannelConnections reads this and forces correct workspace selection + opens picker
        const payload = { ...j, workspaceId };

        // Replace to avoid mixing old results
        localStorage.setItem("meta_exchange_result", JSON.stringify(payload));

        setStatus("Redirecting…");
        nav("/connections", { replace: true });
      } catch (e) {
        console.error(e);
        setStatus("Network error while connecting Meta");
        localStorage.removeItem("meta_exchange_result");
        setTimeout(() => nav("/connections", { replace: true }), 500);
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