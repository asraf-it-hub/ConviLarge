import { env } from "../../config/env.js";
import { AppError } from "../../utils/errors.js";
import { normalizeUsage, parseJsonLoose } from "../utils/normalizeAiResponse.js";

function userContent({ prompt, imageUrl }) {
  if (!imageUrl) return prompt;
  return [
    { type: "text", text: prompt },
    { type: "image_url", image_url: { url: imageUrl } }
  ];
}

export async function runOpenRouter({ system, prompt, model, imageUrl, expectJson = true }) {
  if (!env.openRouterApiKey) throw new AppError("OpenRouter is not configured on this server.", 503);

  const selectedModel = model || env.openRouterDefaultModel;
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.openRouterApiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": env.clientUrl,
      "X-Title": "ConviLarge"
    },
    body: JSON.stringify({
      model: selectedModel,
      max_tokens: env.openRouterMaxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent({ prompt, imageUrl }) }
      ],
      response_format: expectJson ? { type: "json_object" } : undefined
    })
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new AppError(data?.error?.message || "OpenRouter request failed", response.status >= 500 ? 503 : 400);
  }

  const text = data?.choices?.[0]?.message?.content || "";
  return {
    provider: "openrouter",
    model: selectedModel,
    text,
    json: expectJson ? parseJsonLoose(text) : null,
    usage: normalizeUsage(data?.usage)
  };
}
