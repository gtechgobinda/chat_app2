import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    profilePic: {
      type: String,
      default: "",
    },
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    archivedConversations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    mutedConversations: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        mutedUntil: { type: Date, default: null }, // null = muted forever
      },
    ],
    starredMessages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
      },
    ],
    lastSeen: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }, // createdAt & updatedAt
);

const User = mongoose.model("User", userSchema);

export default User;
