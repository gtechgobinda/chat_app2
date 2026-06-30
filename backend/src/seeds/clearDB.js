import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import FriendRequest from "../models/friendRequest.model.js";

async function clearDB() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) throw new Error("MONGO_URI is required");

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const [users, messages, requests] = await Promise.all([
      User.deleteMany({}),
      Message.deleteMany({}),
      FriendRequest.deleteMany({}),
    ]);

    console.log(`Deleted ${users.deletedCount} users`);
    console.log(`Deleted ${messages.deletedCount} messages`);
    console.log(`Deleted ${requests.deletedCount} friend requests`);
    console.log("Database cleared successfully.");
  } catch (error) {
    console.error("Error clearing DB:", error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

clearDB();
