import express from "express";
import {
  signup,
  login,
  logout,
  checkAdminAuth,
  getAllUsers,
  getStats,
  getAllMessages,
  getAllFriendRequests,
} from "../controllers/admin.controller.js";
import { protectAdminRoute } from "../middleware/admin.middleware.js";

const router = express.Router();

router.post("/auth/signup", signup);
router.post("/auth/login", login);
router.post("/auth/logout", logout);
router.get("/auth/check", protectAdminRoute, checkAdminAuth);

router.get("/stats", protectAdminRoute, getStats);
router.get("/users", protectAdminRoute, getAllUsers);
router.get("/messages", protectAdminRoute, getAllMessages);
router.get("/friend-requests", protectAdminRoute, getAllFriendRequests);

export default router;
