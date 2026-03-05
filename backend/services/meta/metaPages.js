import { env } from "../../config/env.js";

export async function fetchMetaPages({ userAccessToken }) {

  const url = new URL(`https://graph.facebook.com/${env.META_GRAPH_VERSION}/me/accounts`);

  url.searchParams.set(
    "fields",
    "id,name,access_token,instagram_business_account{id,username},connected_instagram_account{id,username},tasks"
  );

  url.searchParams.set("limit", "100");
  url.searchParams.set("access_token", userAccessToken);

  const r = await fetch(url.toString());
  const j = await r.json();

  if (!r.ok) {
    console.error("META PAGES ERROR:", j);
    throw new Error(j?.error?.message || "Failed to fetch pages");
  }

  return j.data || [];
}