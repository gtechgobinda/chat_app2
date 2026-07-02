import jwt from "jsonwebtoken";
import Admin from "../models/admin.model.js";

export async function protectAdminRoute(req, res, next) {
  try {
    const token = req.cookies.admin_jwt;

    if (!token) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await Admin.findById(decoded.adminId).select("-password");

    if (!admin) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    req.admin = admin;

    next();
  } catch (error) {
    console.error("Error in protectAdminRoute middleware:", error.message);
    res.status(401).json({ message: "Unauthorized" });
  }
}
