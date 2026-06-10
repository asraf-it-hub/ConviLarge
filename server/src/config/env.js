import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const rootDir = path.resolve(__dirname, "../../");

export const env = {
  port: Number(process.env.PORT || 5000),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  adminEmail: (process.env.ADMIN_EMAIL || "").toLowerCase().trim(),
  mongodbUri: process.env.MONGODB_URI || "",
  redisUrl: process.env.REDIS_URL || "",
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB || 250),
  fileTtlHours: Number(process.env.FILE_TTL_HOURS || 24),
  transferMaxFiles: Number(process.env.TRANSFER_MAX_FILES || 50),
  transferMaxFileSizeMb: Number(process.env.TRANSFER_MAX_FILE_MB || process.env.MAX_FILE_SIZE_MB || 250),
  qpdfPath: process.env.QPDF_PATH || "qpdf",
  aiEnabled: process.env.AI_ENABLED !== "false",
  aiDefaultProvider: process.env.AI_DEFAULT_PROVIDER || "openrouter",
  aiFallbackProvider: process.env.AI_FALLBACK_PROVIDER || "gemini",
  aiFreeDailyTasks: Number(process.env.AI_FREE_DAILY_TASKS || 3),
  aiAuthDailyTasks: Number(process.env.AI_AUTH_DAILY_TASKS || 30),
  aiMaxFileSizeMb: Number(process.env.AI_MAX_FILE_MB || 25),
  aiMaxTextChars: Number(process.env.AI_MAX_TEXT_CHARS || 120000),
  aiStoreHistory: process.env.AI_STORE_HISTORY !== "false",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiDefaultModel: process.env.OPENAI_DEFAULT_MODEL || "gpt-5.4-mini",
  openaiReasoningModel: process.env.OPENAI_REASONING_MODEL || "gpt-5.4",
  openRouterApiKey: process.env.OPENROUTER_API_KEY || "",
  openRouterDefaultModel: process.env.OPENROUTER_DEFAULT_MODEL || "google/gemini-2.5-flash",
  openRouterMaxTokens: Number(process.env.OPENROUTER_MAX_TOKENS || 2000),
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiDefaultModel: process.env.GEMINI_DEFAULT_MODEL || "gemini-2.5-flash",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  githubClientId: process.env.GITHUB_CLIENT_ID || "",
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET || ""
};

export const paths = {
  uploads: path.join(rootDir, "uploads"),
  temp: path.join(rootDir, "temp"),
  processed: path.join(rootDir, "processed"),
  transfers: path.join(rootDir, "transfers")
};
