import { env } from "../../config/env.js";

export async function exchangeMetaCodeForToken({ code }) {
  const url = new URL(`https://graph.facebook.com/${env.META_GRAPH_VERSION}/oauth/access_token`);

  url.searchParams.set("client_id", env.META_APP_ID);
  url.searchParams.set("client_secret", env.META_APP_SECRET);
  url.searchParams.set("redirect_uri", env.META_REDIRECT_URI);
  url.searchParams.set("code", code);

  const r = await fetch(url.toString());
  const j = await r.json();

  if (!r.ok) {
    console.error("META TOKEN ERROR:", j);
    throw new Error(j?.error?.message || "Meta token exchange failed");
  }

  return j;
}