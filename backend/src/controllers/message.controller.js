import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import { hasImageKitConfig, uploadChatMedia } from "../lib/imagekit.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export async function getUsersForSidebar(req, res) {
  try {
    const loggedInUserId = req.user._id;

    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-clerkId");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getConversationsForSidebar(req, res) {
  try {
    const loggedInUserId = req.user._id;
    const archivedIds = req.user.archivedConversations || [];

    const conversations = await Message.aggregate([
      { $match: { $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }] } },
      {
        $group: {
          _id: { $cond: [{ $eq: ["$senderId", loggedInUserId] }, "$receiverId", "$senderId"] },
          lastMessageAt: { $max: "$createdAt" },
        },
      },
      // Exclude archived conversation partners
      { $match: { _id: { $nin: archivedIds } } },
      { $sort: { lastMessageAt: -1 } },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $replaceRoot: { newRoot: { $first: "$user" } } },
      { $project: { clerkId: 0 } },
    ]);

    res.status(200).json(conversations);
  } catch (error) {
    console.error("Error in getConversationsForSidebar:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getArchivedConversations(req, res) {
  try {
    const loggedInUserId = req.user._id;
    const archivedIds = req.user.archivedConversations || [];

    if (archivedIds.length === 0) {
      return res.status(200).json([]);
    }

    const conversations = await Message.aggregate([
      { $match: { $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }] } },
      {
        $group: {
          _id: { $cond: [{ $eq: ["$senderId", loggedInUserId] }, "$receiverId", "$senderId"] },
          lastMessageAt: { $max: "$createdAt" },
        },
      },
      // Only include archived conversation partners
      { $match: { _id: { $in: archivedIds } } },
      { $sort: { lastMessageAt: -1 } },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $replaceRoot: { newRoot: { $first: "$user" } } },
      { $project: { clerkId: 0 } },
    ]);

    res.status(200).json(conversations);
  } catch (error) {
    console.error("Error in getArchivedConversations:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getMutedConversations(req, res) {
  try {
    const now = new Date();
    const muted = (req.user.mutedConversations || []).filter(
      (m) => m.mutedUntil === null || m.mutedUntil > now,
    );
    res.status(200).json(muted);
  } catch (error) {
    console.error("Error in getMutedConversations:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function muteConversation(req, res) {
  try {
    const { id: targetUserId } = req.params;
    const { duration } = req.body; // "8h" | "1w" | "forever"
    const loggedInUserId = req.user._id;

    let mutedUntil = null;
    if (duration === "8h") mutedUntil = new Date(Date.now() + 8 * 60 * 60 * 1000);
    else if (duration === "1w") mutedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Remove any existing mute entry then insert the new one
    await User.updateOne(
      { _id: loggedInUserId },
      { $pull: { mutedConversations: { userId: targetUserId } } },
    );
    await User.updateOne(
      { _id: loggedInUserId },
      { $push: { mutedConversations: { userId: targetUserId, mutedUntil } } },
    );

    res.status(200).json({ mutedUntil });
  } catch (error) {
    console.error("Error in muteConversation:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function unmuteConversation(req, res) {
  try {
    const { id: targetUserId } = req.params;
    await User.updateOne(
      { _id: req.user._id },
      { $pull: { mutedConversations: { userId: targetUserId } } },
    );
    res.status(200).json({ message: "Conversation unmuted" });
  } catch (error) {
    console.error("Error in unmuteConversation:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function archiveConversation(req, res) {
  try {
    const { id: targetUserId } = req.params;
    const loggedInUserId = req.user._id;

    await User.updateOne(
      { _id: loggedInUserId },
      { $addToSet: { archivedConversations: targetUserId } },
    );

    res.status(200).json({ message: "Conversation archived" });
  } catch (error) {
    console.error("Error in archiveConversation:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function unarchiveConversation(req, res) {
  try {
    const { id: targetUserId } = req.params;
    const loggedInUserId = req.user._id;

    await User.updateOne(
      { _id: loggedInUserId },
      { $pull: { archivedConversations: targetUserId } },
    );

    res.status(200).json({ message: "Conversation unarchived" });
  } catch (error) {
    console.error("Error in unarchiveConversation:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getMessages(req, res) {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const iHaveBlocked = req.user.blockedUsers.map(String).includes(String(userToChatId));

    // If I blocked them, only return messages I sent — their messages stay hidden.
    const query = iHaveBlocked
      ? { senderId: myId, receiverId: userToChatId }
      : {
          $or: [
            { senderId: myId, receiverId: userToChatId },
            { senderId: userToChatId, receiverId: myId },
          ],
        };

    const messages = await Message.find(query).sort({ createdAt: 1 });

    // Mark messages from the other user as delivered since receiver is now fetching them
    if (!iHaveBlocked) {
      const undeliveredIds = messages
        .filter((m) => String(m.senderId) === String(userToChatId) && !m.deliveredAt)
        .map((m) => m._id);

      if (undeliveredIds.length > 0) {
        const now = new Date();
        await Message.updateMany(
          { _id: { $in: undeliveredIds }, deliveredAt: { $exists: false } },
          { $set: { deliveredAt: now } },
        );
        const senderSocketId = getReceiverSocketId(userToChatId);
        if (senderSocketId) {
          for (const messageId of undeliveredIds) {
            io.to(senderSocketId).emit("messageDelivered", { messageId, deliveredAt: now });
          }
        }
        // Patch the in-memory messages so the response reflects the update
        messages.forEach((m) => {
          if (undeliveredIds.some((id) => String(id) === String(m._id))) {
            m.deliveredAt = now;
          }
        });
      }
    }

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getMessages:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function sendMessage(req, res) {
  try {
    const { text } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!req.user.friends.map(String).includes(String(receiverId))) {
      return res.status(403).json({ message: "You can only message friends" });
    }

    if (req.user.blockedUsers.map(String).includes(String(receiverId))) {
      return res.status(403).json({ message: "You have blocked this user" });
    }

    // Check if receiver has blocked sender — save the message but silently drop delivery
    // so the sender has no idea they are blocked.
    const receiver = await User.findById(receiverId).select("blockedUsers");
    const senderIsBlockedByReceiver = receiver?.blockedUsers.map(String).includes(String(senderId));

    let imageUrl;
    let videoUrl;

    if (req.file) {
      if (!hasImageKitConfig()) {
        return res.status(500).json({ message: "Media upload is not configured" });
      }

      const url = await uploadChatMedia(req.file);
      if (req.file.mimetype.startsWith("video/")) videoUrl = url;
      else imageUrl = url;
    }

    const receiverSocketId = getReceiverSocketId(receiverId);
    const deliveredAt = !senderIsBlockedByReceiver && receiverSocketId ? new Date() : undefined;

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      video: videoUrl,
      deliveredAt,
    });

    await newMessage.save();

    // Auto-unarchive: if receiver had this sender archived, move them back to the main list
    if (!senderIsBlockedByReceiver) {
      await User.updateOne(
        { _id: receiverId, archivedConversations: senderId },
        { $pull: { archivedConversations: senderId } },
      );
    }

    // Only deliver if the receiver has not blocked the sender
    if (!senderIsBlockedByReceiver) {
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage);
      }
      // Notify sender their message was delivered (receiver is online)
      if (deliveredAt) {
        const senderSocketId = getReceiverSocketId(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit("messageDelivered", {
            messageId: newMessage._id,
            deliveredAt: newMessage.deliveredAt,
          });
        }
      }
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendMessage:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}
