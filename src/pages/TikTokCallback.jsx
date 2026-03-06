// src/pages/TikTokCallback.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { apiFetch, setActiveWorkspaceId } from "../lib/api.js";
import {
  clearTikTokOAuthState,
  validateStoredTikTokState,
} from "../lib/tiktokConnect.js";

export default function TikTokCallback({ theme, setTheme }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState("Connecting TikTok...");
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const code = String(searchParams.get("code") || "");
        const state = String(searchParams.get("state") || "");
        const error = String(searchParams.get("error") || "");
        const errorDescription = String(
          searchParams.get("error_description") || ""
        );

        if (error) {
          throw new Error(errorDescription || error);
        }

        if (!code) {
          throw new Error("Missing TikTok authorization code.");
        }

        const stateCheck = validateStoredTikTokState(state);
        if (!stateCheck.ok || !stateCheck.parsed?.workspaceId) {
          throw new Error("Invalid or expired TikTok state.");
        }

        const workspaceId = String(stateCheck.parsed.workspaceId);
        setActiveWorkspaceId(workspaceId);

        setStatus("Exchanging TikTok token...");

        const result = await apiFetch("/api/tiktok/exchange", {
          method: "POST",
          body: {
            code,
            workspaceId,
          },
        });

        clearTikTokOAuthState();

        localStorage.setItem(
          "tiktok_exchange_result",
          JSON.stringify({
            ...result,
            workspaceId,
          })
        );

        setStatus("TikTok connected successfully.");

        setTimeout(() => {
          navigate("/connections");
        }, 800);
      } catch (e) {
        clearTikTokOAuthState();
        setErr(String(e?.message || e));
        setStatus("TikTok connection failed.");
      }
    })();
  }, [navigate, searchParams]);

  return (
    <AppShell theme={theme} setTheme={setTheme} active="connections">
      <div className="min-h-[70vh] flex items-center justify-center p-8">
        <div className="glass-panel border border-white/10 rounded-2xl p-8 max-w-xl w-full">
          <h2 className="text-2xl font-black text-white">TikTok Callback</h2>
          <p className="text-white/70 mt-3">{status}</p>
          {err ? (
            <pre className="mt-4 text-sm text-red-300 whitespace-pre-wrap">
              {err}
            </pre>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}