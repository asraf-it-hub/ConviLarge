import { env } from "../../config/env.js";
import { AppError } from "../../utils/errors.js";
import { extractOpenAiText, normalizeUsage, parseJsonLoose } from "../utils/normalizeAiResponse.js";

function contentParts({ prompt, imageUrl }) {
  const parts = [{ type: "input_text", text: prompt }];
  if (imageUrl) parts.push({ type: "input_image", image_url: imageUrl });
  return parts;
}

export async function runOpenAi({ system, prompt, model, imageUrl, expectJson = true }) {
  if (!env.openaiApiKey) throw new AppError("OpenAI is not configured on this server.", 503);

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.openaiApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: model || env.openaiDefaultModel,
      input: [
        { role: "system", content: system },
        { role: "user", content: contentParts({ prompt, imageUrl }) }
      ],
      text: expectJson
        ? {
            format: { type: "json_object" }
          }
        : undefined
    })
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new AppError(data?.error?.message || "OpenAI request failed", response.status >= 500 ? 503 : 400);
  }

  const text = extractOpenAiText(data);
  return {
    provider: "openai",
    model: model || env.openaiDefaultModel,
    text,
    json: expectJson ? parseJsonLoose(text) : null,
    usage: normalizeUsage(data.usage)
  };
}
