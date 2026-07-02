import bcrypt from "bcryptjs";
import Admin from "../models/admin.model.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import FriendRequest from "../models/friendRequest.model.js";
import { generateAdminToken } from "../lib/adminJwt.js";

export async function signup(req, res) {
  const { name, email, password, signupSecret } = req.body;

  try {
    if (!name || !email || !password || !signupSecret) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    if (signupSecret !== process.env.ADMIN_SIGNUP_SECRET) {
      return res.status(403).json({ message: "Invalid signup secret" });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(409).json({ message: "An admin with this email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = await Admin.create({ name, email, password: hashedPassword });

    generateAdminToken(admin._id, res);

    res.status(201).json({ _id: admin._id, name: admin.name, email: admin.email });
  } catch (error) {
    console.error("Error in admin signup controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, admin.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    generateAdminToken(admin._id, res);

    res.status(200).json({ _id: admin._id, name: admin.name, email: admin.email });
  } catch (error) {
    console.error("Error in admin login controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export function logout(req, res) {
  res.clearCookie("admin_jwt");
  res.status(200).json({ message: "Logged out successfully" });
}

export function checkAdminAuth(req, res) {
  res.status(200).json(req.admin);
}

export async function getAllUsers(req, res) {
  try {
    const users = await User.find().select("-clerkId").sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    console.error("Error in getAllUsers controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getStats(req, res) {
  try {
    const [totalUsers, totalMessages, pendingRequests, totalBlocked] = await Promise.all([
      User.countDocuments(),
      Message.countDocuments({ deletedForEveryone: { $ne: true } }),
      FriendRequest.countDocuments({ status: "pending" }),
      User.countDocuments({ "blockedUsers.0": { $exists: true } }),
    ]);

    res.status(200).json({ totalUsers, totalMessages, pendingRequests, totalBlocked });
  } catch (error) {
    console.error("Error in getStats controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAllMessages(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      Message.find({ deletedForEveryone: { $ne: true } })
        .populate("senderId", "fullName profilePic email")
        .populate("receiverId", "fullName profilePic email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Message.countDocuments({ deletedForEveryone: { $ne: true } }),
    ]);

    res.status(200).json({ messages, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Error in getAllMessages controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAllFriendRequests(req, res) {
  try {
    const requests = await FriendRequest.find()
      .populate("senderId", "fullName profilePic email")
      .populate("receiverId", "fullName profilePic email")
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    console.error("Error in getAllFriendRequests controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}
