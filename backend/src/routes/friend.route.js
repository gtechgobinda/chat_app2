import express from "express";
import {
  sendFriendRequest,
  respondToFriendRequest,
  getReceivedFriendRequests,
  getSentFriendRequests,
  getFriends,
} from "../controllers/friend.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.get("/", getFriends);
router.post("/request/:userId", sendFriendRequest);
router.post("/respond/:requestId", respondToFriendRequest);
router.get("/requests", getReceivedFriendRequests);
router.get("/sent", getSentFriendRequests);

export default router;
