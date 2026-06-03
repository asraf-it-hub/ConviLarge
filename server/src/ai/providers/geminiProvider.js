import { env } from "../../config/env.js";
import { AppError } from "../../utils/errors.js";
import { normalizeUsage, parseJsonLoose } from "../utils/normalizeAiResponse.js";

export async function runGemini({ system, prompt, model, inlineData, expectJson = true }) {
  if (!env.geminiApiKey) throw new AppError("Gemini is not configured on this server.", 503);

  const selectedModel = model || env.geminiDefaultModel;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${env.geminiApiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }, ...(inlineData ? [inlineData] : [])]
        }
      ],
      generationConfig: expectJson ? { responseMimeType: "application/json" } : undefined
    })
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new AppError(data?.error?.message || "Gemini request failed", response.status >= 500 ? 503 : 400);
  }

  const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text).filter(Boolean).join("\n").trim() || "";
  return {
    provider: "gemini",
    model: selectedModel,
    text,
    json: expectJson ? parseJsonLoose(text) : null,
    usage: normalizeUsage(data?.usageMetadata)
  };
}
