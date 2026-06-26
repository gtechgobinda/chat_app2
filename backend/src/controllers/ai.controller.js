import OpenAI from "openai";
import Message from "../models/message.model.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function formatMessages(messages, myId) {
  return messages.map((m) => ({
    role: String(m.senderId) === String(myId) ? "user" : "assistant",
    content: m.text || "[media]",
  }));
}

export async function suggestReplies(req, res) {
  try {
    const { id: otherUserId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: myId },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(20);

    if (!messages.length) return res.json({ suggestions: [] });

    const history = formatMessages(messages.reverse(), myId);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant. Based on the conversation, suggest 3 short, natural reply options the user could send next. Return ONLY a JSON array of 3 strings. No extra text.",
        },
        ...history,
        {
          role: "user",
          content: "Give me 3 short reply suggestions for my next message.",
        },
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    const raw = completion.choices[0].message.content.trim();
    const suggestions = JSON.parse(raw);

    res.json({ suggestions });
  } catch (error) {
    console.error("Error in suggestReplies:", error.message);
    res.status(500).json({ message: "Failed to generate suggestions" });
  }
}

export async function summarizeConversation(req, res) {
  try {
    const { id: otherUserId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: myId },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(50);

    if (!messages.length) return res.json({ summary: "No messages yet." });

    const history = formatMessages(messages.reverse(), myId);
    const textOnly = history
      .filter((m) => m.content !== "[media]")
      .map((m) => `${m.role === "user" ? "Me" : "Them"}: ${m.content}`)
      .join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Summarize this chat conversation in 2-3 sentences. Be concise and friendly.",
        },
        { role: "user", content: textOnly },
      ],
      max_tokens: 150,
      temperature: 0.5,
    });

    const summary = completion.choices[0].message.content.trim();
    res.json({ summary });
  } catch (error) {
    console.error("Error in summarizeConversation:", error.message);
    res.status(500).json({ message: "Failed to generate summary" });
  }
}
