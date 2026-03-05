import { env } from "../../config/env.js";

function mustEnv(v, name) {
  if (!v) throw new Error(`Missing ${name} in backend/.env`);
  return v;
}

export async function exchangeMetaCodeForToken({ code }) {
  const META_APP_ID = mustEnv(process.env.META_APP_ID, "META_APP_ID");
  const META_APP_SECRET = mustEnv(process.env.META_APP_SECRET, "META_APP_SECRET");
  const META_REDIRECT_URI = mustEnv(process.env.META_REDIRECT_URI, "META_REDIRECT_URI");

  const url = new URL(`https://graph.facebook.com/${env.META_GRAPH_VERSION}/oauth/access_token`);
  url.searchParams.set("client_id", META_APP_ID);
  url.searchParams.set("client_secret", META_APP_SECRET);
  url.searchParams.set("redirect_uri", META_REDIRECT_URI);
  url.searchParams.set("code", code);

  const r = await fetch(url.toString());
  const j = await r.json().catch(() => ({}));

  if (!r.ok) {
    const msg = j?.error?.message || j?.error?.error_user_msg || "Token exchange failed";
    throw new Error(msg);
  }
  return j;
}