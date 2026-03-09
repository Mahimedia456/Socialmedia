export function providerTikTok() {
  return "tiktok";
}

export function parseTikTokStateSafe(stateRaw) {
  try {
    const raw = String(stateRaw || "");
    if (!raw) return null;

    const pad = raw.length % 4 ? "=".repeat(4 - (raw.length % 4)) : "";
    const b64 = (raw + pad).replace(/-/g, "+").replace(/_/g, "/");
    const decoded = Buffer.from(b64, "base64").toString("utf8");
    const obj = JSON.parse(decoded);

    if (!obj?.workspaceId) return null;
    return obj;
  } catch {
    return null;
  }
}

export async function tiktokTokenExchange({ code }) {
  const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY || "";
  const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET || "";
  const TIKTOK_REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI || "";

  if (!TIKTOK_CLIENT_KEY || !TIKTOK_CLIENT_SECRET || !TIKTOK_REDIRECT_URI) {
    const e = new Error(
      "Missing TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET / TIKTOK_REDIRECT_URI"
    );
    e.meta = {
      has_client_key: !!TIKTOK_CLIENT_KEY,
      has_client_secret: !!TIKTOK_CLIENT_SECRET,
      has_redirect_uri: !!TIKTOK_REDIRECT_URI,
    };
    throw e;
  }

  const body = new URLSearchParams({
    client_key: TIKTOK_CLIENT_KEY,
    client_secret: TIKTOK_CLIENT_SECRET,
    code: String(code || "").trim(),
    grant_type: "authorization_code",
    redirect_uri: TIKTOK_REDIRECT_URI,
  });

  const r = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
    },
    body: body.toString(),
  });

  const raw = await r.text();
  let j = {};
  try {
    j = raw ? JSON.parse(raw) : {};
  } catch {
    j = { raw };
  }

  console.log("TIKTOK TOKEN RESPONSE:", {
    ok: r.ok,
    status: r.status,
    body: j,
  });

  if (!r.ok) {
    const msg =
      j?.error_description ||
      j?.message ||
      j?.error ||
      j?.data?.description ||
      "TikTok token exchange failed";
    const e = new Error(msg);
    e.meta = j;
    throw e;
  }

  if (!j?.access_token) {
    const e = new Error("TikTok token exchange returned no access_token");
    e.meta = j;
    throw e;
  }

  return j;
}

export async function tiktokGetUserInfo({ accessToken }) {
  const url = new URL("https://open.tiktokapis.com/v2/user/info/");
  url.searchParams.set(
    "fields",
    "open_id,union_id,avatar_url,display_name"
  );

  const r = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Cache-Control": "no-cache",
    },
  });

  const raw = await r.text();
  let j = {};
  try {
    j = raw ? JSON.parse(raw) : {};
  } catch {
    j = { raw };
  }

  console.log("TIKTOK USER INFO RESPONSE:", {
    ok: r.ok,
    status: r.status,
    body: j,
  });

  if (!r.ok) {
    const msg =
      j?.error?.message ||
      j?.error_description ||
      j?.message ||
      j?.error?.code ||
      "TikTok user info fetch failed";
    const e = new Error(msg);
    e.meta = j;
    throw e;
  }

  const user = j?.data?.user || null;

  if (!user?.open_id) {
    const e = new Error("TikTok user info returned no open_id");
    e.meta = j;
    throw e;
  }

  return user;
}

export async function tiktokListVideos({
  accessToken,
  cursor = 0,
  maxCount = 20,
}) {
  const safeCursor = Math.max(0, Number(cursor || 0));
  const safeMaxCount = Math.min(20, Math.max(1, Number(maxCount || 20)));

  const url = new URL("https://open.tiktokapis.com/v2/video/list/");
  url.searchParams.set(
    "fields",
    [
      "id",
      "title",
      "video_description",
      "duration",
      "height",
      "width",
      "cover_image_url",
      "share_url",
      "embed_html",
      "embed_link",
      "like_count",
      "comment_count",
      "share_count",
      "view_count",
      "create_time",
    ].join(",")
  );

  const r = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
    body: JSON.stringify({
      cursor: safeCursor,
      max_count: safeMaxCount,
    }),
  });

  const raw = await r.text();
  let j = {};
  try {
    j = raw ? JSON.parse(raw) : {};
  } catch {
    j = { raw };
  }

  console.log("TIKTOK VIDEO LIST RESPONSE:", {
    ok: r.ok,
    status: r.status,
    body: j,
  });

  if (!r.ok) {
    const msg =
      j?.error?.message ||
      j?.error_description ||
      j?.message ||
      j?.error?.code ||
      "TikTok video list failed";
    const e = new Error(msg);
    e.meta = j;
    throw e;
  }

  // TikTok v2 APIs often return 200 with embedded error object too
  if (j?.error?.code && j?.error?.code !== "ok") {
    const e = new Error(
      j?.error?.message || j?.error?.code || "TikTok video list failed"
    );
    e.meta = j;
    throw e;
  }

  return {
    videos: Array.isArray(j?.data?.videos) ? j.data.videos : [],
    cursor: Number(j?.data?.cursor || 0),
    has_more: !!j?.data?.has_more,
    raw: j,
  };
}