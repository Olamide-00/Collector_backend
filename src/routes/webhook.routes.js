import { Router } from "express";
import { handleFlutterwaveWebhook } from "../controllers/webhook.controller.js";

const router = Router();

router.post("/webhook", handleFlutterwaveWebhook);

export default router;
