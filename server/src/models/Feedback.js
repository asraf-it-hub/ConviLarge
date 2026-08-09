import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  email: { type: String, default: "" },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comments: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

export const Feedback = mongoose.model("Feedback", feedbackSchema);
