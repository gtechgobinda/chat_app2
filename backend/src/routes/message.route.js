import express from "express";
import {
  getConversationsForSidebar,
  getArchivedConversations,
  archiveConversation,
  unarchiveConversation,
  getMutedConversations,
  muteConversation,
  unmuteConversation,
  getMessages,
  getUsersForSidebar,
  sendMessage,
} from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.get("/users", getUsersForSidebar);
router.get("/conversations", getConversationsForSidebar);
router.get("/archived", getArchivedConversations);
router.post("/archive/:id", archiveConversation);
router.delete("/archive/:id", unarchiveConversation);
router.get("/muted", getMutedConversations);
router.post("/mute/:id", muteConversation);
router.delete("/mute/:id", unmuteConversation);
router.get("/:id", getMessages);
router.post("/send/:id", upload.single("media"), sendMessage);

export default router;
