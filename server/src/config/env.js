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
  qpdfPath: process.env.QPDF_PATH || "qpdf",
  removeBgApiKey: process.env.REMOVEBG_API_KEY || ""
};

export const paths = {
  uploads: path.join(rootDir, "uploads"),
  temp: path.join(rootDir, "temp"),
  processed: path.join(rootDir, "processed")
};
