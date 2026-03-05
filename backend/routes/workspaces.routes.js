// backend/routes/workspaces.routes.js
import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { requireAuth, isGlobalAdmin } from "../middleware/auth_.js";

const router = Router();

const T_WORKSPACES = "workspaces";
const T_WSM = "workspace_members";

async function getWorkspaceMemberRole(userId, workspaceId) {
  const { data, error } = await supabase
    .from(T_WSM)
    .select("role,status")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data || data.status !== "active") return null;
  return data.role || null;
}

/**
 * Mounted at: /api/workspaces
 * So this route becomes: GET /api/workspaces
 */
router.get("/", requireAuth, async (req, res, next) => {
  try {
    // Global admins can see all workspaces
    if (isGlobalAdmin(req.auth.role)) {
      const { data, error } = await supabase
        .from(T_WORKSPACES)
        .select("id,name,description,plan,created_at,created_by")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return res.json({
        workspaces: (data || []).map((w) => ({ ...w, my_role: req.auth.role })),
      });
    }

    // Normal users see only workspaces they are members of
    const { data, error } = await supabase
      .from(T_WSM)
      .select(
        "role, workspaces:workspace_id ( id, name, description, plan, created_at, created_by )"
      )
      .eq("user_id", req.auth.userId)
      .eq("status", "active")
      .order("joined_at", { ascending: false });

    if (error) throw error;

    const rows = (data || [])
      .map((r) => ({
        id: r.workspaces?.id,
        name: r.workspaces?.name,
        description: r.workspaces?.description,
        plan: r.workspaces?.plan,
        created_at: r.workspaces?.created_at,
        created_by: r.workspaces?.created_by,
        my_role: r.role,
      }))
      .filter((x) => x.id);

    res.json({ workspaces: rows });
  } catch (e) {
    next(e);
  }
});

/**
 * Mounted at: /api/workspaces
 * So this route becomes: GET /api/workspaces/:workspaceId
 */
router.get("/:workspaceId", requireAuth, async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    if (!isGlobalAdmin(req.auth.role)) {
      const role = await getWorkspaceMemberRole(req.auth.userId, workspaceId);
      if (!role) return res.status(403).json({ error: "WORKSPACE_FORBIDDEN" });
    }

    const { data, error } = await supabase
      .from(T_WORKSPACES)
      .select("id,name,description,plan,created_at,created_by")
      .eq("id", workspaceId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "WORKSPACE_NOT_FOUND" });

    res.json({ workspace: data });
  } catch (e) {
    next(e);
  }
});

export default router;