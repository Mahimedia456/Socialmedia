import { supabase } from "../config/supabase.js";
import { isGlobalAdmin } from "./auth_.js";

const T_WSM = "workspace_members";

export async function getWorkspaceMemberRole(userId, workspaceId) {
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

export async function requireWorkspaceAccess(req, res, next) {
  try {
    const { workspaceId } = req.params;
    if (isGlobalAdmin(req.auth.role)) {
      req.workspaceRole = req.auth.role;
      return next();
    }

    const role = await getWorkspaceMemberRole(req.auth.userId, workspaceId);
    if (!role) return res.status(403).json({ error: "WORKSPACE_FORBIDDEN" });

    req.workspaceRole = role;
    next();
  } catch (e) {
    next(e);
  }
}