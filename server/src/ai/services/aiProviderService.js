import { env } from "../../config/env.js";
import { AppError } from "../../utils/errors.js";
import { runGemini } from "../providers/geminiProvider.js";
import { runOpenAi } from "../providers/openaiProvider.js";
import { runOpenRouter } from "../providers/openRouterProvider.js";

function providerOrder(requestedProvider) {
  const primary = requestedProvider || env.aiDefaultProvider;
  return [...new Set([primary, env.aiFallbackProvider].filter(Boolean))];
}

export async function runAiProvider(payload) {
  const errors = [];

  for (const provider of providerOrder(payload.provider)) {
    try {
      if (provider === "openrouter") return await runOpenRouter(payload);
      if (provider === "openai") return await runOpenAi(payload);
      if (provider === "gemini") return await runGemini(payload);
    } catch (error) {
      errors.push(error.message);
      if (payload.provider) throw error;
    }
  }

  throw new AppError(errors[0] || "No AI provider is available.", 503);
}
