import { createClient } from "@supabase/supabase-js";

export async function createRealtimeClient({ apiBase, accessToken }) {
  const r = await fetch(`${apiBase}/api/supabase/realtime-token`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.message || j?.error || "Failed to get realtime token");

  const supabase = createClient(j.supabase_url, j.supabase_anon_key, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 20 } },
  });

  // important: authorize realtime (and RLS) with minted JWT
  supabase.realtime.setAuth(j.token);

  return supabase;
}