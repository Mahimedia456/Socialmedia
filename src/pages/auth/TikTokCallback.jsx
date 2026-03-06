import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function TikTokCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleTikTok() {
      const params = new URLSearchParams(window.location.search);

      const code = params.get("code");
      const state = params.get("state");

      if (!code) {
        navigate("/connections");
        return;
      }

      const accessToken = localStorage.getItem("access_token");

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE}/api/tiktok/exchange`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              code,
              state,
            }),
          }
        );

        const data = await res.json();

        localStorage.setItem(
          "tiktok_exchange_result",
          JSON.stringify(data)
        );

        navigate("/connections");
      } catch (err) {
        console.error("TikTok connect error:", err);
        navigate("/connections");
      }
    }

    handleTikTok();
  }, []);

  return (
    <div className="flex items-center justify-center h-screen text-white">
      Connecting TikTok...
    </div>
  );
}