# ChatKoro — Use Cases & Feature Documentation

ChatKoro is a full-stack real-time chat application with AI-powered features.

---

## Tech Stack

- React, React Hooks, Zustand, React Context API
- Tailwind CSS, HeroUI
- Express, Node.js
- MongoDB, MongoDB Aggregation Pipeline
- Socket.io
- Clerk Authentication
- ImageKit
- OpenAI GPT-4o-mini
- Web Audio API
- CSS Backgrounds
- Cron Jobs

---

## A. Authentication

### UC-1: Sign Up (New Visitor)
1. User is presented with the Clerk-powered auth page.
2. User registers with email/password or Google Popup login.
3. User is redirected to the chat page.

### UC-2: Sign In (Existing User)
1. User enters credentials via Clerk's UI (or Google Popup).
2. On success, navigates to the chat application.

### UC-3: Sign Out
1. Clerk signs the user out.
2. Socket disconnects and the user is removed from the online map.
3. User is redirected to the login page.

### UC-4: Profile Sync (Webhook)
1. On create/update: backend upserts the user's name, email, and profile picture in the database.
2. On delete: backend removes the user document from the database.

---

## B. Conversations & Messaging

### UC-5: Send Friend / Chat Request
1. User sends a friend request to another user.
2. Waits for the recipient to accept.

### UC-6: View Friend Request List
1. User can view incoming requests.
2. Each request has Accept and Reject options.

### UC-7: Accept Request
1. Both users can now chat with each other.
2. Either user can initiate the first message.

### UC-8: Reject Request
1. Neither user can message the other.

### UC-9: Browse All Users
1. Authenticated users can browse the full user list to find someone to connect with.

### UC-10: Search Conversations or Users
1. General search input for messages and users.
2. Category-based filtering per user type.

### UC-11: Send a Text Message
1. Backend saves the message in MongoDB.
2. If the recipient is online, the message is pushed via Socket.io instantly.
3. The sender's UI appends the message bubble immediately.

### UC-12: Send an Image or Video
1. File picker opens (accepts `image/*` and `video/*`).
2. The selected file is uploaded to ImageKit via the backend.

### UC-13: Receive a Real-Time Message
1. Backend emits a `newMessage` Socket.io event to the recipient's socket.
2. The chat store appends the message to the active conversation.
3. The message list scrolls to the bottom.

### UC-14: Get AI Reply Suggestions
1. Fetches the last 20 messages for the conversation.
2. OpenAI `gpt-4o-mini` generates 3 short, natural reply options.
3. Suggestion chips appear above the composer; clicking one fills the text field.

### UC-15: Summarize a Conversation
1. Fetches the last 50 messages.
2. OpenAI `gpt-4o-mini` produces a 2–3 sentence summary.
3. The summary is displayed in an inline panel. Clicking "Hide summary" collapses it.

---

## C. Personalization

### UC-16: Toggle Light / Dark Mode
1. Toggles between light and dark mode globally.

### UC-17: Change Accent Theme
1. A modal opens listing 11 color presets.
2. Selecting a preset applies CSS variables to the document root.
3. The choice is persisted in ThemeContext.

### UC-18: Change Background Wallpaper
1. A modal opens with 13 wallpapers organized by category.
2. Selecting a wallpaper sets it as the outer background of the chat layout.

### UC-19: Toggle Keyboard Sound Effects
1. Sound Enabled is toggled in the chat store.
2. When enabled, a random keystroke sound plays on each keypress and on message send.

### UC-20: Responsive Layout
1. On mobile, the sidebar is hidden and the chat view takes up the full screen.
2. A back arrow appears in the header.
3. Tapping it clears the active conversation and returns to the sidebar.

---

## D. Planned Features

### Messaging Enhancements

#### UC-21: Block / Unblock User
- User can block a contact from their profile or conversation header.
- Blocked users cannot send messages; socket events are guarded on the backend.
- A blocked indicator is shown; user can unblock at any time.
- MongoDB stores a `blockedUsers` array on each user document.

#### UC-22: Message Reactions
- User long-presses or hovers a message bubble to open an emoji picker.
- Reactions (👍 ❤️ 😂 😮 😢 🙏) are stored per message in MongoDB.
- Reaction counts update in real time via Socket.io for all participants.

#### UC-23: Reply to a Message (Quoted Reply)
- User taps a reply icon on any message bubble.
- A quoted preview of the original message appears above the composer.
- The sent message stores a `replyTo` reference; the bubble renders the quote inline.

#### UC-24: Edit Message
- User can edit their own sent messages within a configurable time window (e.g., 15 minutes).
- The message bubble shows an "edited" tag after update.
- Socket.io broadcasts the edit to the recipient in real time.

#### UC-25: Delete Message
- User can delete a message with two options: "Delete for Me" or "Delete for Everyone".
- "Delete for Everyone" removes the content and shows a "This message was deleted" placeholder.
- Socket.io notifies the recipient immediately.

#### UC-26: Message Read Receipts
- Single tick (✓) = delivered to server.
- Double tick (✓✓) = seen by recipient.
- Status updates via Socket.io when the recipient opens the conversation.

#### UC-27: Typing Indicator
- When a user is typing, a `typing` socket event is emitted.
- The recipient sees "Gobinda is typing..." in the conversation header.
- Indicator clears after a debounce timeout or when the message is sent.

#### UC-28: Pin Message
- User can pin an important message in a conversation.
- Pinned message is shown in a banner at the top of the chat.
- Only the most recent pinned message is shown; clicking it scrolls to the original.

#### UC-29: Star / Bookmark Messages
- User can star any message for later reference.
- A "Starred Messages" panel accessible from the conversation menu lists all starred items.

### Conversation Management

#### UC-30: Archive Conversation
- User can archive a conversation to hide it from the main list.
- An "Archived" section is accessible separately.
- New messages from archived chats restore the conversation to the main list.

#### UC-31: Mute Conversation
- User can mute a conversation (e.g., for 8 hours, 1 week, or always).
- Muted conversations still receive messages but suppress notifications.
- A mute icon is shown on the conversation list item.

#### UC-32: Mark as Unread
- User can manually mark a conversation as unread for follow-up.
- Unread badge appears on the conversation list item.

### User Presence & Status

#### UC-33: Last Seen
- When a user is offline, their profile shows "last seen [time]".
- Timestamp is updated in MongoDB on socket disconnect.

#### UC-34: Custom Status Message
- User can set a short status (e.g., "Busy", "At work", "Do not disturb" or free text).
- Status is visible on the user's profile and conversation header.

#### UC-35: Hide Online Status
- User can toggle a privacy setting to appear offline to everyone.
- The backend respects this flag when broadcasting the online users list.

### Notifications

#### UC-36: In-App Notification Bell
- A bell icon in the sidebar shows a badge with unread message count.
- Clicking it opens a dropdown listing recent unread messages with sender info.

#### UC-37: Browser Push Notifications
- User grants notification permission.
- When a new message arrives and the tab is not focused, a browser push notification appears.
- Clicking the notification focuses the tab and opens the relevant conversation.

### AI Enhancements

#### UC-38: Message Translation
- User taps a "Translate" option on any received message.
- OpenAI `gpt-4o-mini` translates the message to the user's preferred language.
- The translated text appears below the original bubble inline.

#### UC-39: AI Smart Reply on Receive
- When a new message is received, AI suggests 2–3 short replies based on the last message.
- Suggestion chips appear above the composer without requiring a manual button press.

#### UC-40: Mood / Tone Detector
- AI analyzes the tone of an incoming message (e.g., "Sounds urgent", "Friendly").
- A subtle tag is shown on the message bubble.

### Media & Files

#### UC-41: Voice Message
- User holds a mic button to record an audio clip using the Web Audio API.
- The clip is uploaded to ImageKit and plays inline in the chat with a waveform.

#### UC-42: Image Lightbox
- Clicking an image in the chat opens it in a full-screen overlay with zoom support.
- Navigation arrows allow browsing all images shared in the conversation.

#### UC-43: File / Document Sharing
- User can attach files (PDF, DOCX) via the file picker.
- Files are uploaded to ImageKit and shown as a download card in the chat.

### Privacy & Safety

#### UC-44: Report a Message
- User can report a message as inappropriate.
- The report is stored in MongoDB with the message ID, reporter ID, and reason.
- A confirmation toast confirms the report was submitted.

#### UC-45: Disappearing Messages
- User can enable disappearing messages for a conversation (e.g., auto-delete after 24 hours).
- A cron job runs periodically to purge expired messages from MongoDB.
- Both participants see a notice that disappearing messages are on.

---
