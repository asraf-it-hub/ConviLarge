import mongoose from "mongoose";

const supportTicketSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  category: { type: String, default: "technical" },
  message: { type: String, required: true },
  status: { type: String, enum: ["open", "in-progress", "resolved"], default: "open" },
  createdAt: { type: Date, default: Date.now }
});

export const SupportTicket = mongoose.model("SupportTicket", supportTicketSchema);
