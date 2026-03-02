import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE;

function getAccessToken() {
  return localStorage.getItem("access_token") || "";
}

function parseState(stateRaw) {
  // your state looks like JSON: {"workspaceId":"...","t":...,"nonce":"..."}
  // sometimes people base64 it; we support both
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

      if (!code || !stateRaw) {
        nav("/connections", { replace: true });
        return;
      }

      const st = parseState(stateRaw);
      const workspaceId = st?.workspaceId;

      if (!workspaceId) {
        // fallback: still allow connections page to handle it
        nav(
          `/connections?code=${encodeURIComponent(code)}&state=${encodeURIComponent(
            stateRaw
          )}`,
          { replace: true }
        );
        return;
      }

      const access = getAccessToken();
      if (!access) {
        nav("/login", { replace: true });
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
          setStatus(j?.message || j?.error || "Meta exchange failed");
          // send to connections screen with params so user can retry
          nav(
            `/workspaces/${workspaceId}/connections?code=${encodeURIComponent(
              code
            )}&state=${encodeURIComponent(stateRaw)}`,
            { replace: true }
          );
          return;
        }

        // store result for Connections screen to show pages list
        localStorage.setItem("meta_exchange_result", JSON.stringify(j));

        setStatus("Redirecting…");
        nav(`/workspaces/${workspaceId}/connections`, { replace: true });
      } catch (e) {
        console.error(e);
        setStatus("Network error while connecting Meta");
        nav("/connections", { replace: true });
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