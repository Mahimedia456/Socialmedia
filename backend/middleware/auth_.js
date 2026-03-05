import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { supabase } from "../config/supabase.js";

export function getBearerToken(req) {
  const h = String(req.headers.authorization || "");
  if (!h.toLowerCase().startsWith("bearer ")) return "";
  return h.slice(7).trim();
}

export function verifyAccess(token) {
  return jwt.verify(token, env.ACCESS_SECRET);
}

export function requireAuth(req, res, next) {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).json({ error: "NO_ACCESS_TOKEN" });
    }

    const decoded = verifyAccess(token);

    req.auth = {
      userId: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch {
    return res.status(401).json({ error: "INVALID_ACCESS_TOKEN" });
  }
}

export function isGlobalAdmin(role) {
  const r = String(role || "").toLowerCase();
  return r === "owner" || r === "admin";
}

/* Workspace Access Check */

export async function requireWorkspaceAccess(req, res, next) {
  try {
    const workspaceId = req.params.workspaceId;

    if (!workspaceId) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "workspaceId required",
      });
    }

    if (isGlobalAdmin(req.auth?.role)) {
      return next();
    }

    const { data, error } = await supabase
      .from("workspace_members")
      .select("role,status")
      .eq("workspace_id", workspaceId)
      .eq("user_id", req.auth.userId)
      .maybeSingle();

    if (error) throw error;

    if (!data || data.status !== "active") {
      return res.status(403).json({
        error: "WORKSPACE_FORBIDDEN",
      });
    }

    req.workspaceRole = data.role;

    next();
  } catch (err) {
    next(err);
  }
}

/* SSE helper (EventSource can't send Authorization header) */

export async function verifyAccessFromQuery(req, res) {
  const token = String(req.query.access_token || "");

  if (!token) {
    res.status(401).json({ error: "NO_ACCESS_TOKEN" });
    return null;
  }

  try {
    return verifyAccess(token);
  } catch {
    res.status(401).json({ error: "INVALID_ACCESS_TOKEN" });
    return null;
  }
}