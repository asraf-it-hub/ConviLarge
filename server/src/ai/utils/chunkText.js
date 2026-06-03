export function clampText(text = "", maxChars = 120000) {
  if (!text || text.length <= maxChars) return text || "";
  const head = Math.floor(maxChars * 0.7);
  const tail = maxChars - head;
  return `${text.slice(0, head)}\n\n[...middle content omitted to fit AI limits...]\n\n${text.slice(-tail)}`;
}

export function compactWhitespace(text = "") {
  return text.replace(/\r/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
