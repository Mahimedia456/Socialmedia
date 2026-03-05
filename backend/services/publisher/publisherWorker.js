import { env } from "../../config/env.js";
import { supabase } from "../../config/supabase.js";
import { publishPostNow } from "./publisherEngine.js";

const T_SOCIAL_POSTS = "social_posts";

export function startPublisherWorker() {
  if (!env.PUBLISHER_WORKER) return;

  setInterval(async () => {
    try {
      const nowIso = new Date().toISOString();

      const { data: due, error } = await supabase
        .from(T_SOCIAL_POSTS)
        .select("id,workspace_id")
        .eq("status", "scheduled")
        .lte("scheduled_at", nowIso)
        .limit(20);

      if (error) throw error;

      for (const p of due || []) {
        try {
          await publishPostNow({ workspaceId: p.workspace_id, postId: p.id });
        } catch (e) {
          console.warn("Scheduled publish failed:", p.id, e?.message);
        }
      }
    } catch (e) {
      console.warn("Publisher worker loop error:", e?.message);
    }
  }, 60_000);
}