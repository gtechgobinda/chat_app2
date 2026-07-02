import jwt from "jsonwebtoken";

export function generateAdminToken(adminId, res) {
  const token = jwt.sign({ adminId }, process.env.JWT_SECRET, { expiresIn: "7d" });

  res.cookie("admin_jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });

  return token;
}
