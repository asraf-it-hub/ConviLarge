export function extractOpenAiText(data) {
  if (typeof data?.output_text === "string") return data.output_text;
  const chunks = [];
  for (const item of data?.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) chunks.push(content.text);
    }
  }
  return chunks.join("\n").trim();
}

export function parseJsonLoose(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

export function normalizeUsage(usage = {}) {
  const inputTokens = usage.input_tokens || usage.promptTokenCount || usage.prompt_tokens || 0;
  const outputTokens = usage.output_tokens || usage.candidatesTokenCount || usage.completion_tokens || 0;
  const totalTokens = usage.total_tokens || usage.totalTokenCount || inputTokens + outputTokens;
  return { inputTokens, outputTokens, totalTokens, estimatedCostUsd: 0 };
}
