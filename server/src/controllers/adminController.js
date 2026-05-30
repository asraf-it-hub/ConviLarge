import { dbState } from "../config/db.js";
import { redisState } from "../config/redis.js";
import { User } from "../models/User.js";
import { ConversionJob } from "../models/ConversionJob.js";
import { AppError } from "../utils/errors.js";

function requireDb() {
  if (!dbState.connected) throw new AppError("Admin analytics need MongoDB", 503);
}

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export async function adminOverview(_req, res) {
  requireDb();
  const since = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalJobs,
    guestJobs,
    loggedInJobs,
    completedJobs,
    failedJobs,
    recentUsers,
    recentJobs,
    toolUsage,
    dailyUsage
  ] = await Promise.all([
    User.countDocuments(),
    ConversionJob.countDocuments(),
    ConversionJob.countDocuments({ user: null }),
    ConversionJob.countDocuments({ user: { $exists: true, $ne: null } }),
    ConversionJob.countDocuments({ status: "completed" }),
    ConversionJob.countDocuments({ status: "failed" }),
    User.find().select("name email role createdAt lastLoginAt").sort({ createdAt: -1 }).limit(8),
    ConversionJob.find()
      .select("toolType status user outputFile error createdAt expiresAt")
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(12),
    ConversionJob.aggregate([
      { $group: { _id: "$toolType", count: { $sum: 1 }, failures: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),
    ConversionJob.aggregate([
      { $match: { createdAt: { $gte: startOfDay(since) } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, jobs: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])
  ]);

  res.json({
    totals: { totalUsers, totalJobs, guestJobs, loggedInJobs, completedJobs, failedJobs },
    recentUsers,
    recentJobs,
    toolUsage: toolUsage.map((item) => ({ toolType: item._id, count: item.count, failures: item.failures })),
    dailyUsage: dailyUsage.map((item) => ({ date: item._id, jobs: item.jobs })),
    health: {
      database: dbState.connected ? "connected" : "offline",
      redis: redisState.connected ? "connected" : "inline-fallback",
      redisError: redisState.error
    }
  });
}

export async function adminUsers(req, res) {
  requireDb();
  const users = await User.find()
    .select("name email role createdAt lastLoginAt")
    .sort({ createdAt: -1 })
    .limit(Number(req.query.limit || 100));
  res.json({ users });
}

export async function adminJobs(req, res) {
  requireDb();
  const query = {};
  if (req.query.status) query.status = req.query.status;
  if (req.query.toolType) query.toolType = req.query.toolType;

  const jobs = await ConversionJob.find(query)
    .select("toolType status user outputFile error createdAt expiresAt meta")
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .limit(Number(req.query.limit || 100));
  res.json({ jobs });
}

export async function deleteAdminUser(req, res) {
  requireDb();
  if (req.params.id === String(req.user._id || req.user.id)) throw new AppError("You cannot delete your own admin account", 400);
  await Promise.all([
    User.findByIdAndDelete(req.params.id),
    ConversionJob.updateMany({ user: req.params.id }, { $set: { user: null } })
  ]);
  res.json({ message: "User deleted" });
}

export async function deleteAdminJob(req, res) {
  requireDb();
  const job = await ConversionJob.findByIdAndDelete(req.params.id);
  if (!job) throw new AppError("Job not found", 404);
  res.json({ message: "Job deleted" });
}
