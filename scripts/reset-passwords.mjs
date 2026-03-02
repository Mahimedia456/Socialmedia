import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://tauzhecmzztesllltpai.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhdXpoZWNtenp0ZXNsbGx0cGFpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTI1MDQyNywiZXhwIjoyMDg2ODI2NDI3fQ.T-78WdiCLXkPhatl-xZEPq5ma4bBGsMeumUwPhKGa7s";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const PASSWORD = "mahimediasolutions";

const USERS = [
  "admin@mahimediasolutions.com",
  "editor@mahimediasolutions.com",
  "support@mahimediasolutions.com",
  "viewer@mahimediasolutions.com",
];

async function resetPasswords() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error("Failed to list users:", error);
    return;
  }

  for (const email of USERS) {
    const user = data.users.find((u) => u.email === email);

    if (!user) {
      console.log("User not found:", email);
      continue;
    }

    const { error: updateError } =
      await supabase.auth.admin.updateUserById(user.id, {
        password: PASSWORD,
      });

    if (updateError) {
      console.log("Failed to update:", email, updateError.message);
    } else {
      console.log("Password updated:", email);
    }
  }

  console.log("Done.");
}

resetPasswords();
