import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import { env, paths } from "../config/env.js";
import { AppError } from "../utils/errors.js";
import { getTool } from "../services/toolRegistry.js";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, paths.uploads),
  filename: (_req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`)
});

export const upload = multer({
  storage,
  limits: { fileSize: env.maxFileSizeMb * 1024 * 1024, files: 50 }
});

export function validateUpload(req, _res, next) {
  const tool = getTool(req.body.toolType);
  if (!tool) return next(new AppError("Unknown tool", 404));

  const files = req.files || [];
  if (files.length < tool.minFiles || files.length > tool.maxFiles) {
    return next(new AppError(`${tool.title} expects ${tool.minFiles}-${tool.maxFiles} file(s)`));
  }

  const badFile = files.find((file) => !tool.accepts.includes(file.mimetype));
  if (badFile) {
    return next(new AppError(`${badFile.originalname} is not a supported file type for ${tool.title}`));
  }

  next();
}
