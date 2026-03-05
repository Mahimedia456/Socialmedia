import fetch from "node-fetch";
import { supabase } from "../config/supabase.js";

const GRAPH = "https://graph.facebook.com/v19.0";

/*
Get Meta tokens stored for workspace
*/

async function getChannels(workspaceId) {
  const { data } = await supabase
    .from("workspace_channels")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("provider", "meta");

  return data || [];
}

async function getTokens(workspaceId) {
  const { data } = await supabase
    .from("meta_tokens")
    .select("*")
    .eq("workspace_id", workspaceId);

  return data || [];
}

function mapTokens(tokens) {
  const map = new Map();
  tokens.forEach((t) => {
    map.set(t.external_id, t.access_token);
  });
  return map;
}

/*
Facebook Page Insights
*/

async function fetchFacebookInsights(pageId, token, since, until) {
  const url = `${GRAPH}/${pageId}/insights?metric=page_impressions,page_impressions_unique,page_post_engagements&period=day&since=${since}&until=${until}&access_token=${token}`;

  const r = await fetch(url);
  const j = await r.json();

  if (!j.data) return { impressions: 0, reach: 0, engagements: 0, series: [] };

  const metrics = {};
  j.data.forEach((m) => {
    metrics[m.name] = m.values || [];
  });

  const series = metrics.page_impressions?.map((v, i) => ({
    date: v.end_time?.slice(0, 10),
    impressions: v.value || 0,
    reach: metrics.page_impressions_unique?.[i]?.value || 0,
    engagements: metrics.page_post_engagements?.[i]?.value || 0,
  })) || [];

  return {
    impressions: series.reduce((a, b) => a + b.impressions, 0),
    reach: series.reduce((a, b) => a + b.reach, 0),
    engagements: series.reduce((a, b) => a + b.engagements, 0),
    series,
  };
}

/*
Instagram Insights
*/

async function fetchInstagramInsights(igUserId, token, since, until) {
  const url = `${GRAPH}/${igUserId}/insights?metric=impressions,reach,profile_views&period=day&since=${since}&until=${until}&access_token=${token}`;

  const r = await fetch(url);
  const j = await r.json();

  if (!j.data) return { impressions: 0, reach: 0, profile_views: 0, series: [] };

  const metrics = {};
  j.data.forEach((m) => {
    metrics[m.name] = m.values || [];
  });

  const series = metrics.impressions?.map((v, i) => ({
    date: v.end_time?.slice(0, 10),
    impressions: v.value || 0,
    reach: metrics.reach?.[i]?.value || 0,
    profile_views: metrics.profile_views?.[i]?.value || 0,
  })) || [];

  return {
    impressions: series.reduce((a, b) => a + b.impressions, 0),
    reach: series.reduce((a, b) => a + b.reach, 0),
    profile_views: series.reduce((a, b) => a + b.profile_views, 0),
    series,
  };
}

/*
Main service
*/

export async function getMetaAnalytics(workspaceId, days = 30) {

  const until = new Date();
  const since = new Date();
  since.setDate(until.getDate() - days);

  const sinceStr = since.toISOString().slice(0, 10);
  const untilStr = until.toISOString().slice(0, 10);

  const channels = await getChannels(workspaceId);
  const tokens = await getTokens(workspaceId);

  const tokenMap = mapTokens(tokens);

  const fbTotals = { impressions: 0, reach: 0, engagements: 0 };
  const igTotals = { impressions: 0, reach: 0, profile_views: 0 };

  let fbSeries = [];
  let igSeries = [];

  for (const ch of channels) {

    if (ch.platform === "facebook") {

      const token = tokenMap.get(ch.external_id);
      if (!token) continue;

      const res = await fetchFacebookInsights(
        ch.external_id,
        token,
        sinceStr,
        untilStr
      );

      fbTotals.impressions += res.impressions;
      fbTotals.reach += res.reach;
      fbTotals.engagements += res.engagements;

      fbSeries = res.series;

    }

    if (ch.platform === "instagram") {

      const meta = typeof ch.meta === "string"
        ? JSON.parse(ch.meta)
        : ch.meta;

      const igUserId = meta?.ig_user_id;
      const pageId = meta?.page_id;

      const token = tokenMap.get(pageId);
      if (!token || !igUserId) continue;

      const res = await fetchInstagramInsights(
        igUserId,
        token,
        sinceStr,
        untilStr
      );

      igTotals.impressions += res.impressions;
      igTotals.reach += res.reach;
      igTotals.profile_views += res.profile_views;

      igSeries = res.series;

    }
  }

  return {

    kpis: {
      facebook: fbTotals,
      instagram: igTotals
    },

    series: {
      facebook: fbSeries,
      instagram: igSeries
    },

    channels: channels.map((c) => ({
      id: c.id,
      name: c.display_name,
      platform: c.platform,
      external_id: c.external_id,
      has_token: !!tokenMap.get(c.external_id)
    }))
  };
}