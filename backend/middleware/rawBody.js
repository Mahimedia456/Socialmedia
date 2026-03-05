import express from "express";

export const rawBodyRouter = express.Router();

// Keep exactly like your old behavior:
rawBodyRouter.use("/api/meta/webhook", express.raw({ type: "application/json" }));
rawBodyRouter.use("/api/webhooks/meta", express.raw({ type: "application/json" }));