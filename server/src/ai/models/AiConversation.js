import mongoose from "mongoose";

const aiConversationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    sessionId: String,
    sourceTask: { type: mongoose.Schema.Types.ObjectId, ref: "AiTask", required: false },
    toolType: { type: String, default: "chat-with-pdf" },
    provider: String,
    model: String,
    document: {
      name: String,
      textHash: String,
      pageCount: Number,
      textPreview: String
    },
    messages: [
      {
        role: { type: String, enum: ["user", "assistant", "system"], required: true },
        content: String,
        citations: mongoose.Schema.Types.Mixed,
        usage: mongoose.Schema.Types.Mixed,
        createdAt: { type: Date, default: Date.now }
      }
    ],
    expiresAt: Date
  },
  { timestamps: true }
);

aiConversationSchema.index({ user: 1, updatedAt: -1 });
aiConversationSchema.index({ sessionId: 1, updatedAt: -1 });

export const AiConversation = mongoose.model("AiConversation", aiConversationSchema);
