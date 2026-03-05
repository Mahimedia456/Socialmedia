export function buildMetaAuthUrl({ workspaceId }) {

  const APP_ID = import.meta.env.VITE_META_APP_ID;
  const REDIRECT = import.meta.env.VITE_META_REDIRECT_URI;

  const scope = [
    "public_profile",
    "email",
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts",
    "pages_manage_metadata",
    "instagram_basic",
    "instagram_manage_insights",
    "instagram_content_publish",
  ].join(",");

  const url = new URL("https://www.facebook.com/v19.0/dialog/oauth");

  url.searchParams.set("client_id", APP_ID);
  url.searchParams.set("redirect_uri", REDIRECT);
  url.searchParams.set("scope", scope);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", workspaceId);

  return url.toString();
}