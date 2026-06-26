import express from "express";
import { suggestReplies, summarizeConversation } from "../controllers/ai.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.get("/suggest/:id", suggestReplies);
router.get("/summarize/:id", summarizeConversation);

export default router;
