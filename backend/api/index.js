import app, { ensureDevUsers } from "../app.js";

let booted = false;

export default async function handler(req, res) {
  if (!booted) {
    booted = true;
    await ensureDevUsers();
  }
  return app(req, res);
}