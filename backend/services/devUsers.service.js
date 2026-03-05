import bcrypt from "bcryptjs";
import { supabase } from "../config/supabase.js";

const T_USERS = "app_users";

export async function ensureDevUsers() {
  const pwd = process.env.DEV_PASSWORD || "mahimediasolutions";
  const hash = await bcrypt.hash(pwd, 10);

  const devs = [
    { email: "admin@mahimediasolutions.com", role: "owner" },
    { email: "aamir@mahimediasolutions.com", role: "admin" },
    { email: "editor@mahimediasolutions.com", role: "editor" },
    { email: "support@mahimediasolutions.com", role: "support" },
    { email: "viewer@mahimediasolutions.com", role: "viewer" },
  ];

  const rows = devs.map((u) => ({
    email: u.email,
    role: u.role,
    password_hash: hash,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from(T_USERS).upsert(rows, { onConflict: "email" });
  if (error) throw error;

  return { ok: true, count: rows.length };
}