import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env");
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const PASSWORD = process.env.RESET_PASSWORD || "mahimediasolutions";

const USERS = [
  "admin@mahimediasolutions.com",
  "editor@mahimediasolutions.com",
  "support@mahimediasolutions.com",
  "viewer@mahimediasolutions.com",
];

async function resetPasswords() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;

  for (const email of USERS) {
    const user = data.users.find((u) => u.email === email);
    if (!user) {
      console.log("User not found:", email);
      continue;
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: PASSWORD,
    });

    if (updateError) console.log("Failed:", email, updateError.message);
    else console.log("Updated:", email);
  }
}

resetPasswords().catch((e) => {
  console.error(e);
  process.exit(1);
});