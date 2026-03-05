import app, { ensureDevUsers } from "./app.js";

const PORT = Number(process.env.PORT || 4000);

async function boot() {
  await ensureDevUsers();
  app.listen(PORT, () => {
    console.log(`Backend running: http://localhost:${PORT}`);
    console.log(`Health: http://localhost:${PORT}/api/health`);
    console.log(`Meta webhook verify URL: http://localhost:${PORT}/api/meta/webhook`);
    console.log(`Meta webhook alias URL: http://localhost:${PORT}/api/webhooks/meta`);
  });
}

boot().catch((e) => {
  console.error("Boot failed:", e);
  process.exit(1);
});