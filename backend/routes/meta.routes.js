import express from "express";
import { connectMetaPages } from "../controllers/meta.controller.js";

const router = express.Router();

router.post("/meta/connect-pages", connectMetaPages);

export default router;