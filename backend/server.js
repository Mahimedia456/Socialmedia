// backend/server.js
import app from "./app.js";
import { env } from "./config/env.js";
import { ensureDevUsers } from "./services/devUsers.service.js";

async function main() {
  try {
    await ensureDevUsers();

    app.listen(env.PORT, () => {
      console.log(`✅ API running: http://localhost:${env.PORT}`);
    });
  } catch (e) {
    console.error("❌ Server boot failed:", e?.message || e);
    process.exit(1);
  }
}

main();