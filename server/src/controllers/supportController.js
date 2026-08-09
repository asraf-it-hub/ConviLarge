import { SupportTicket } from "../models/SupportTicket.js";
import { Feedback } from "../models/Feedback.js";
import { BugReport } from "../models/BugReport.js";
import { AppError } from "../utils/errors.js";

export async function submitSupportTicket(req, res) {
  const { subject, category, message } = req.body;
  if (!subject?.trim() || !message?.trim()) {
    throw new AppError("Subject and message are required", 400);
  }

  const userEmail = req.user?.email || req.body.email || "guest@convilarge.com";
  const userId = req.user?._id || req.user?.id || null;

  const ticket = await SupportTicket.create({
    user: userId,
    email: userEmail,
    subject: subject.trim(),
    category: category || "technical",
    message: message.trim(),
    status: "open"
  });

  console.log(`[SUPPORT TICKET] New ticket #${ticket._id} from ${userEmail}: "${subject}"`);

  res.status(201).json({
    message: "Support ticket submitted successfully!",
    ticket
  });
}

export async function submitFeedback(req, res) {
  const { rating, comments } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    throw new AppError("Please provide a rating from 1 to 5 stars", 400);
  }

  const userEmail = req.user?.email || req.body.email || "guest@convilarge.com";
  const userId = req.user?._id || req.user?.id || null;

  const feedback = await Feedback.create({
    user: userId,
    email: userEmail,
    rating: Number(rating),
    comments: (comments || "").trim()
  });

  console.log(`[FEEDBACK] New feedback from ${userEmail}: Rating ${rating}/5`);

  res.status(201).json({
    message: "Feedback submitted successfully!",
    feedback
  });
}

export async function submitBugReport(req, res) {
  const { priority, description } = req.body;
  if (!description?.trim()) {
    throw new AppError("Please describe the issue encountered", 400);
  }

  const userEmail = req.user?.email || req.body.email || "guest@convilarge.com";
  const userId = req.user?._id || req.user?.id || null;
  const screenshotUrl = req.file ? `/uploads/${req.file.filename}` : "";

  const report = await BugReport.create({
    user: userId,
    email: userEmail,
    priority: priority || "medium",
    description: description.trim(),
    screenshotUrl,
    status: "new"
  });

  console.log(`[BUG REPORT] New bug report #${report._id} from ${userEmail} (Priority: ${priority})`);

  res.status(201).json({
    message: "Bug report submitted successfully!",
    report
  });
}
