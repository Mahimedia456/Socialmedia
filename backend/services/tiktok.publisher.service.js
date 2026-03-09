export function providerTikTok() {
  return "tiktok";
}

async function tiktokApiFetchJson(
  url,
  { method = "GET", accessToken = "", body } = {}
) {
  const r = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-cache",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const raw = await r.text();
  let j = {};
  try {
    j = raw ? JSON.parse(raw) : {};
  } catch {
    j = { raw };
  }

  if (!r.ok) {
    const msg =
      j?.error?.message ||
      j?.error_description ||
      j?.message ||
      j?.error?.code ||
      "TikTok request failed";
    const e = new Error(msg);
    e.meta = j;
    throw e;
  }

  if (j?.error?.code && j?.error?.code !== "ok") {
    const e = new Error(
      j?.error?.message || j?.error?.code || "TikTok request failed"
    );
    e.meta = j;
    throw e;
  }

  return j;
}

export async function tiktokCreatorInfoQuery({ accessToken }) {
  const url =
    "https://open.tiktokapis.com/v2/post/publish/creator_info/query/";
  return tiktokApiFetchJson(url, {
    method: "POST",
    accessToken,
    body: {},
  });
}

export function pickTikTokPrivacyLevel(creatorInfo) {
  const opts = Array.isArray(creatorInfo?.data?.privacy_level_options)
    ? creatorInfo.data.privacy_level_options
    : [];

  if (opts.includes("SELF_ONLY")) return "SELF_ONLY";
  if (opts.length) return opts[0];
  return "SELF_ONLY";
}

export async function tiktokDirectPostVideoFromUrl({
  accessToken,
  videoUrl,
  title = "",
  privacyLevel = "SELF_ONLY",
  disableComment = false,
  disableDuet = false,
  disableStitch = false,
  coverTimestampMs = 1000,
}) {
  const url = "https://open.tiktokapis.com/v2/post/publish/video/init/";

  return tiktokApiFetchJson(url, {
    method: "POST",
    accessToken,
    body: {
      post_info: {
        title: String(title || "").slice(0, 2200),
        privacy_level: privacyLevel,
        disable_comment: !!disableComment,
        disable_duet: !!disableDuet,
        disable_stitch: !!disableStitch,
        video_cover_timestamp_ms: Number(coverTimestampMs || 1000),
      },
      source_info: {
        source: "PULL_FROM_URL",
        video_url: String(videoUrl || ""),
      },
    },
  });
}

export async function tiktokDirectPostPhotoFromUrl({
  accessToken,
  photoUrls,
  title = "",
  description = "",
  privacyLevel = "SELF_ONLY",
  disableComment = false,
  autoAddMusic = true,
}) {
  const url = "https://open.tiktokapis.com/v2/post/publish/content/init/";

  return tiktokApiFetchJson(url, {
    method: "POST",
    accessToken,
    body: {
      media_type: "PHOTO",
      post_mode: "DIRECT_POST",
      post_info: {
        title: String(title || "").slice(0, 90),
        description: String(description || "").slice(0, 4000),
        privacy_level: privacyLevel,
        disable_comment: !!disableComment,
        auto_add_music: !!autoAddMusic,
      },
      source_info: {
        source: "PULL_FROM_URL",
        photo_cover_index: 0,
        photo_images: Array.isArray(photoUrls) ? photoUrls : [],
      },
    },
  });
}

export async function tiktokUploadPhotoDraftFromUrl({
  accessToken,
  photoUrls,
  title = "",
  description = "",
}) {
  const url = "https://open.tiktokapis.com/v2/post/publish/content/init/";

  return tiktokApiFetchJson(url, {
    method: "POST",
    accessToken,
    body: {
      media_type: "PHOTO",
      post_mode: "MEDIA_UPLOAD",
      post_info: {
        title: String(title || "").slice(0, 90),
        description: String(description || "").slice(0, 4000),
      },
      source_info: {
        source: "PULL_FROM_URL",
        photo_cover_index: 0,
        photo_images: Array.isArray(photoUrls) ? photoUrls : [],
      },
    },
  });
}