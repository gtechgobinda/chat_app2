import User from "../models/user.model.js";

export async function blockUser(req, res) {
  try {
    const { userId } = req.params;
    const me = req.user;

    if (String(me._id) === String(userId)) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }

    const target = await User.findById(userId);
    if (!target) return res.status(404).json({ message: "User not found" });

    if (me.blockedUsers.map(String).includes(String(userId))) {
      return res.status(400).json({ message: "User is already blocked" });
    }

    await User.findByIdAndUpdate(me._id, { $addToSet: { blockedUsers: userId } });

    res.status(200).json({ message: "User blocked" });
  } catch (error) {
    console.error("Error in blockUser:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function unblockUser(req, res) {
  try {
    const { userId } = req.params;
    const me = req.user;

    await User.findByIdAndUpdate(me._id, { $pull: { blockedUsers: userId } });

    res.status(200).json({ message: "User unblocked" });
  } catch (error) {
    console.error("Error in unblockUser:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getBlockedUsers(req, res) {
  try {
    const user = await User.findById(req.user._id)
      .populate("blockedUsers", "-clerkId")
      .select("blockedUsers");

    res.status(200).json(user.blockedUsers);
  } catch (error) {
    console.error("Error in getBlockedUsers:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}
