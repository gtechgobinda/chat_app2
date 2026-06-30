import User from "../models/user.model.js";
import FriendRequest from "../models/friendRequest.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export async function sendFriendRequest(req, res) {
  try {
    const senderId = req.user._id;
    const { userId: receiverId } = req.params;

    if (String(senderId) === String(receiverId)) {
      return res.status(400).json({ message: "You cannot send a friend request to yourself" });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ message: "User not found" });

    if (req.user.friends.map(String).includes(String(receiverId))) {
      return res.status(400).json({ message: "Already friends" });
    }

    const existing = await FriendRequest.findOne({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
      status: "pending",
    });

    if (existing) {
      return res.status(400).json({ message: "Friend request already pending" });
    }

    const friendRequest = await FriendRequest.create({ senderId, receiverId });

    const populatedRequest = await FriendRequest.findById(friendRequest._id)
      .populate("senderId", "-clerkId")
      .populate("receiverId", "-clerkId");

    const receiverSocketId = getReceiverSocketId(String(receiverId));
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newFriendRequest", populatedRequest);
    }

    res.status(201).json(populatedRequest);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Friend request already sent" });
    }
    console.error("Error in sendFriendRequest:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function respondToFriendRequest(req, res) {
  try {
    const { requestId } = req.params;
    const { action } = req.body; // "accept" | "reject"
    const userId = req.user._id;

    if (!["accept", "reject"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) return res.status(404).json({ message: "Friend request not found" });

    if (String(friendRequest.receiverId) !== String(userId)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (friendRequest.status !== "pending") {
      return res.status(400).json({ message: "Request already resolved" });
    }

    if (action === "accept") {
      friendRequest.status = "accepted";
      await friendRequest.save();

      await User.findByIdAndUpdate(friendRequest.senderId, {
        $addToSet: { friends: friendRequest.receiverId },
      });
      await User.findByIdAndUpdate(friendRequest.receiverId, {
        $addToSet: { friends: friendRequest.senderId },
      });

      const senderSocketId = getReceiverSocketId(String(friendRequest.senderId));
      if (senderSocketId) {
        io.to(senderSocketId).emit("friendRequestAccepted", {
          requestId: String(friendRequest._id),
          newFriend: {
            _id: String(req.user._id),
            fullName: req.user.fullName,
            profilePic: req.user.profilePic,
            email: req.user.email,
          },
        });
      }
    } else {
      friendRequest.status = "rejected";
      await friendRequest.save();
    }

    res.status(200).json({ message: `Request ${action}ed`, status: friendRequest.status });
  } catch (error) {
    console.error("Error in respondToFriendRequest:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getReceivedFriendRequests(req, res) {
  try {
    const userId = req.user._id;

    const requests = await FriendRequest.find({ receiverId: userId, status: "pending" })
      .populate("senderId", "-clerkId")
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    console.error("Error in getReceivedFriendRequests:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getSentFriendRequests(req, res) {
  try {
    const userId = req.user._id;

    const requests = await FriendRequest.find({ senderId: userId, status: "pending" })
      .populate("receiverId", "-clerkId")
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    console.error("Error in getSentFriendRequests:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getFriends(req, res) {
  try {
    const user = await User.findById(req.user._id)
      .populate("friends", "-clerkId")
      .select("friends");

    res.status(200).json(user.friends);
  } catch (error) {
    console.error("Error in getFriends:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}
