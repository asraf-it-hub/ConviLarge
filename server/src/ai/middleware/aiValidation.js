import path from "path";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/errors.js";
import { getAiTool } from "../config/aiTools.js";

export function validateAiUpload(req, _res, next) {
  if (!env.aiEnabled) return next(new AppError("AI tools are currently disabled.", 503));

  const tool = getAiTool(req.body.toolType);
  if (!tool) return next(new AppError("Unknown AI tool", 404));

  const files = req.files || [];
  if (files.length < tool.minFiles || files.length > tool.maxFiles) {
    return next(new AppError(`${tool.title} expects ${tool.minFiles}-${tool.maxFiles} file(s)`));
  }

  const maxBytes = env.aiMaxFileSizeMb * 1024 * 1024;
  const tooLarge = files.find((file) => file.size > maxBytes);
  if (tooLarge) {
    return next(new AppError(`AI files must be ${env.aiMaxFileSizeMb} MB or smaller.`));
  }

  const badFile = files.find((file) => {
    const extension = path.extname(file.originalname).toLowerCase();
    return !tool.accepts.includes(file.mimetype) && !tool.extensions?.includes(extension);
  });
  if (badFile) {
    return next(new AppError(`${badFile.originalname} is not supported by ${tool.title}`));
  }

  next();
}
