import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import { env, paths } from "../config/env.js";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, paths.transfers),
  filename: (_req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`)
});

export const transferUpload = multer({
  storage,
  limits: {
    fileSize: env.transferMaxFileSizeMb * 1024 * 1024,
    files: env.transferMaxFiles
  }
});
