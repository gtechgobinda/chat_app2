import express from "express";
import http from "http";
import { Server } from "socket.io";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";

const app = express();
const server = http.createServer(app);

const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";

const io = new Server(server, { cors: { origin: [allowedOrigin] } });

function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// online users map = { userId: socketId }
const userSocketMap = {};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;

  if (userId) userSocketMap[userId] = socket.id;

  // io.emit() sends event to everyone - broadcast
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("typing", ({ receiverId }) => {
    const receiverSocketId = userSocketMap[receiverId];
    console.log(`[typing] from=${userId} to=${receiverId} receiverSocket=${receiverSocketId}`);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing", { senderId: userId });
    }
  });

  socket.on("stopTyping", ({ receiverId }) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("stopTyping", { senderId: userId });
    }
  });

  socket.on("markMessagesRead", async ({ senderId }) => {
    if (!userId || !senderId) return;
    const now = new Date();
    const result = await Message.updateMany(
      { senderId, receiverId: userId, readAt: { $exists: false } },
      { $set: { readAt: now } },
    );
    if (result.modifiedCount > 0) {
      const senderSocketId = userSocketMap[senderId];
      if (senderSocketId) {
        io.to(senderSocketId).emit("messagesRead", { by: userId, at: now.toISOString() });
      }
    }
  });

  socket.on("disconnect", async () => {
    if (userId) {
      delete userSocketMap[userId];
      try {
        await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
      } catch (e) {
        console.error("Failed to update lastSeen:", e.message);
      }
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { app, server, io, getReceiverSocketId };
