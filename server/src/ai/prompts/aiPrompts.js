const jsonRule = "Return only valid JSON. Do not wrap the response in markdown.";

export function buildPrompt({ toolType, text, question, fileMeta, options = {} }) {
  if (toolType === "ai-pdf-summarizer") {
    return {
      system: `You summarize documents for a file utility website. ${jsonRule}`,
      prompt: `Summarize this PDF in a practical way for a busy reader.

Length preference: ${options.length || "balanced"}

Return this JSON shape:
{
  "summary": "one concise paragraph",
  "keyPoints": ["point"],
  "actionItems": ["action"],
  "risksOrWarnings": ["warning"],
  "suggestedNextTools": ["ConviLarge tool name"]
}

Document text:
${text}`
    };
  }

  if (toolType === "ai-resume-analyzer") {
    return {
      system: `You are an expert resume reviewer and ATS evaluator. Provide constructive feedback, specific rewrites, and an accurate resume rating out of 100. ${jsonRule}`,
      prompt: `Analyze this resume for clarity, impact, technical strength, ATS optimization, and role alignment.

Target role or note from user: ${options.targetRole || "Not provided"}

CRITICAL SCORING RULE:
"score" MUST be an integer strictly between 0 and 100 (percentage out of 100). Do NOT return a score from 1 to 10.
- 85-100: Strong resume with clear impact, strong skills, and good project/work proof.
- 70-84: Solid candidate needing minor formatting or metric additions.
- Below 70: Needs structural work or missing key sections.

Return this JSON shape:
{
  "score": 85,
  "headline": "short assessment summary",
  "strengths": ["strength"],
  "gaps": ["gap"],
  "improvements": ["specific rewrite or metric improvement"],
  "keywords": ["key skill/keyword found"],
  "atsNotes": ["ATS compliance note"],
  "suggestedSummary": "improved professional summary"
}

Resume text:
${text}`
    };
  }

  if (toolType === "ai-ocr") {
    return {
      system: `You extract text from images and screenshots. Preserve useful line breaks. ${jsonRule}`,
      prompt: `Extract all readable text from this image. Return this JSON shape:
{
  "text": "recognized text",
  "language": "detected language or unknown",
  "confidence": "low|medium|high",
  "notes": ["brief note"]
}`
    };
  }

  if (toolType === "ai-tool-recommendation") {
    return {
      system: `You recommend the best ConviLarge tool. ${jsonRule}`,
      prompt: `Recommend the best ConviLarge tool for this user need.

User request: ${options.request || "Not provided"}
File metadata: ${JSON.stringify(fileMeta || null)}

Available categories: Convert, Merge, Compress, Split, Security, Image, PDF, AI Tools.
Return this JSON shape:
{
  "recommendedToolId": "tool id or null",
  "recommendedToolName": "tool name",
  "reason": "short reason",
  "alternatives": [{"toolId": "id", "toolName": "name", "reason": "short"}],
  "needsUpload": true
}`
    };
  }

  if (toolType === "chat-with-pdf") {
    return {
      system: "You answer questions about the provided PDF. If the answer is not in the document, say so clearly.",
      prompt: `PDF context:
${text}

User question:
${question || "Give me a concise overview of this document."}`
    };
  }

  if (toolType === "ai-document-translator") {
    return {
      system: `You translate documents for a professional file utility. Preserve headings, lists, tables in markdown table form, section order, numbers, and names where appropriate. ${jsonRule}`,
      prompt: `Translate this document.

Target language: ${options.targetLanguage || "English"}
Selected pages or range: ${options.pageRange || "Entire document"}

Return this JSON shape:
{
  "sourceLanguage": "detected source language",
  "targetLanguage": "target language",
  "translatedTitle": "short title",
  "translatedText": "complete translated document with headings, lists, and tables preserved as much as possible",
  "previewOriginal": "short source preview",
  "previewTranslated": "short translated preview",
  "notes": ["formatting or translation note"]
}

Document text:
${text}`
    };
  }

  if (toolType === "ai-pdf-quiz-generator") {
    return {
      system: `You create study quizzes from PDFs. Questions must be grounded in the provided document. ${jsonRule}`,
      prompt: `Generate a quiz from this PDF.

Difficulty: ${options.difficulty || "medium"}
Number of questions: ${options.questionCount || 10}
Question types to include: MCQ, True/False, Fill in the Blanks, Short Answer.

Return this JSON shape:
{
  "title": "quiz title",
  "difficulty": "easy|medium|hard",
  "questions": [
    {
      "id": 1,
      "type": "mcq|true_false|fill_blank|short_answer",
      "question": "question text",
      "options": ["A", "B", "C", "D"],
      "answer": "correct answer",
      "explanation": "brief explanation"
    }
  ],
  "answerKey": [{"id": 1, "answer": "answer", "explanation": "why"}],
  "studyTips": ["tip"]
}

PDF text:
${text}`
    };
  }

  return {
    system: `You help users understand files. ${jsonRule}`,
    prompt: text || options.request || "Analyze this file."
  };
}
