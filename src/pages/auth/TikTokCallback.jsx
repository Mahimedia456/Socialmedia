// src/pages/auth/TikTokCallback.jsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  clearTikTokOAuthState,
  getStoredTikTokWorkspaceId,
  parseTikTokState,
  validateStoredTikTokState,
} from "../../lib/tiktokConnect";

export default function TikTokCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleTikTok() {
      const params = new URLSearchParams(window.location.search);

      const code = String(params.get("code") || "");
      const state = String(params.get("state") || "");
      const error = String(params.get("error") || "");
      const errorDescription = String(params.get("error_description") || "");

      if (error) {
        localStorage.setItem(
          "tiktok_exchange_result",
          JSON.stringify({
            ok: false,
            error: errorDescription || error || "TikTok authorization failed",
          })
        );
        clearTikTokOAuthState();
        navigate("/connections", { replace: true });
        return;
      }

      if (!code) {
        localStorage.setItem(
          "tiktok_exchange_result",
          JSON.stringify({
            ok: false,
            error: "Missing TikTok authorization code",
          })
        );
        clearTikTokOAuthState();
        navigate("/connections", { replace: true });
        return;
      }

      const stateCheck = validateStoredTikTokState(state);
      const parsedState = stateCheck.ok
        ? stateCheck.parsed
        : parseTikTokState(state);

      const workspaceId =
        String(parsedState?.workspaceId || "") ||
        String(getStoredTikTokWorkspaceId() || "");

      if (!workspaceId) {
        localStorage.setItem(
          "tiktok_exchange_result",
          JSON.stringify({
            ok: false,
            error: "TikTok connect failed: missing workspaceId in exchange result.",
          })
        );
        clearTikTokOAuthState();
        navigate("/connections", { replace: true });
        return;
      }

      const accessToken = localStorage.getItem("access_token") || "";

      if (!accessToken) {
        localStorage.setItem(
          "tiktok_exchange_result",
          JSON.stringify({
            ok: false,
            workspaceId,
            error: "You are not logged in. Please login again and reconnect TikTok.",
          })
        );
        clearTikTokOAuthState();
        navigate("/login", { replace: true });
        return;
      }

      try {
        const API_BASE =
          import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || "";

        const res = await fetch(`${API_BASE}/api/tiktok/exchange`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            code,
            state,
            workspaceId,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          localStorage.setItem(
            "tiktok_exchange_result",
            JSON.stringify({
              ok: false,
              workspaceId,
              error: data?.message || data?.error || "TikTok exchange failed",
              raw: data,
            })
          );
          clearTikTokOAuthState();
          navigate("/connections", { replace: true });
          return;
        }

        localStorage.setItem(
          "tiktok_exchange_result",
          JSON.stringify({
            ...data,
            ok: data?.ok !== false,
            workspaceId: String(data?.workspaceId || workspaceId),
          })
        );

        clearTikTokOAuthState();
        navigate("/connections", { replace: true });
      } catch (err) {
        console.error("TikTok connect error:", err);

        localStorage.setItem(
          "tiktok_exchange_result",
          JSON.stringify({
            ok: false,
            workspaceId,
            error: err?.message || "TikTok connect failed",
          })
        );

        clearTikTokOAuthState();
        navigate("/connections", { replace: true });
      }
    }

    handleTikTok();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background-dark text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-lg font-bold">Connecting TikTok...</div>
        <div className="text-sm text-slate-400 mt-2">
          Please wait while we finish authorization.
        </div>
      </div>
    </div>
  );
}