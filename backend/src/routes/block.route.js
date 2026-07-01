import express from "express";
import { blockUser, unblockUser, getBlockedUsers } from "../controllers/block.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.get("/", getBlockedUsers);
router.post("/:userId", blockUser);
router.delete("/:userId", unblockUser);

export default router;
