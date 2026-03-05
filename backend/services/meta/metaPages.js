import { env } from "../../config/env.js";

export async function fetchMetaPages({ userAccessToken }) {
  const out = [];
  let after = null;

  while (true) {
    const url = new URL(`https://graph.facebook.com/${env.META_GRAPH_VERSION}/me/accounts`);
    url.searchParams.set(
      "fields",
      [
        "id",
        "name",
        "access_token",
        "instagram_business_account{id,username}",
        "connected_instagram_account{id,username}",
        "tasks",
      ].join(",")
    );
    url.searchParams.set("limit", "100");
    if (after) url.searchParams.set("after", after);
    url.searchParams.set("access_token", userAccessToken);

    const r = await fetch(url.toString());
    const j = await r.json().catch(() => ({}));

    console.log("META /me/accounts PAGE:", JSON.stringify(j, null, 2));

    if (!r.ok) {
      const msg = j?.error?.message || "Failed to fetch pages";
      throw new Error(msg);
    }

    out.push(...(j?.data || []));

    const nextAfter = j?.paging?.cursors?.after || null;
    if (!nextAfter) break;
    after = nextAfter;

    if (out.length >= 1000) break;
  }

  return out;
}