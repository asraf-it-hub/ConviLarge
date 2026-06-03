import { env } from "../../config/env.js";
import fs from "fs";
import { fileSnapshot, removeFile } from "../../utils/fs.js";
import { AppError } from "../../utils/errors.js";
import { getAiTool, listAiTools } from "../config/aiTools.js";
import { extractDocumentText } from "../extractors/documentExtractor.js";
import { geminiInlineData, imageDataUrl } from "../extractors/fileParts.js";
import { buildPrompt } from "../prompts/aiPrompts.js";
import { createBackgroundRemovalArtifact, createEnhanceArtifact, createQuizArtifacts, createTranslationArtifact, createUpscaleArtifact } from "./aiArtifactService.js";
import { runAiProvider } from "./aiProviderService.js";
import { createAiTaskRecord, deleteAiTaskRecord, getAiTaskRecord, listAiTaskHistory, updateAiTaskRecord } from "./aiTaskStore.js";
import { getAiUsageSummary, recordAiUsage } from "./aiUsageService.js";

function publicAiTask(task) {
  return {
    id: task?.id || task?._id?.toString?.(),
    toolType: task?.toolType,
    status: task?.status,
    provider: task?.provider,
    model: task?.model,
    inputSummary: task?.inputSummary,
    output: task?.output,
    error: task?.error,
    usage: task?.usage,
    createdAt: task?.createdAt,
    expiresAt: task?.expiresAt,
    meta: task?.meta,
    downloadUrl: task?.meta?.outputFile ? `/ai/tasks/${task?.id || task?._id?.toString?.()}/download` : null
  };
}

function parseOptions(rawOptions) {
  if (!rawOptions) return {};
  if (typeof rawOptions === "object") return rawOptions;
  try {
    return JSON.parse(rawOptions);
  } catch {
    return {};
  }
}

async function buildAiPayload({ toolType, files, options, provider }) {
  const file = files[0];

  if (toolType === "ai-tool-recommendation") {
    const fileMeta = file
      ? {
          name: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        }
      : null;
    const prompt = buildPrompt({ toolType, fileMeta, options });
    return { ...prompt, fileMeta, provider, expectJson: true };
  }

  if (toolType === "ai-ocr") {
    const prompt = buildPrompt({ toolType, options });
    if (provider === "gemini" || (!provider && env.aiDefaultProvider === "gemini")) {
      return { ...prompt, provider, inlineData: await geminiInlineData(file), expectJson: true };
    }
    return { ...prompt, provider, imageUrl: await imageDataUrl(file), expectJson: true };
  }

  const extracted = await extractDocumentText(file, { pageRange: toolType === "ai-document-translator" ? options.pageRange : null });
  const prompt = buildPrompt({
    toolType,
    text: extracted.text,
    question: options.question,
    options
  });

  return {
    ...prompt,
    provider,
    expectJson: toolType !== "chat-with-pdf",
    extracted
  };
}

async function runLocalAiArtifact({ toolType, files, options }) {
  if (toolType === "ai-background-remover") {
    return {
      output: {
        summary: files.length > 1 ? "Backgrounds removed and packaged for download." : "Background removed. Download the transparent PNG or selected background version.",
        previewType: "image"
      },
      outputFile: await createBackgroundRemovalArtifact(files, options)
    };
  }

  if (toolType === "ai-image-upscaler") {
    const scale = Number(options.scale || 2);
    return {
      output: {
        summary: `Image${files.length > 1 ? "s" : ""} upscaled at ${scale}x with detail-preserving sharpening.`,
        previewType: "image",
        scale
      },
      outputFile: await createUpscaleArtifact(files, options)
    };
  }

  if (toolType === "ai-image-enhancer") {
    return {
      output: {
        summary: "Image enhancement complete with the selected quality corrections.",
        previewType: "image",
        enhancements: options
      },
      outputFile: await createEnhanceArtifact(files, options)
    };
  }

  return null;
}

function fallbackOutput(toolType, aiResult) {
  if (aiResult.json) return aiResult.json;
  if (toolType === "chat-with-pdf") return { answer: aiResult.text };
  return { text: aiResult.text };
}

export async function runAiTask({ toolType, files = [], options: rawOptions, provider, user, sessionId }) {
  const tool = getAiTool(toolType);
  if (!tool) throw new AppError("Unknown AI tool", 404);

  const options = parseOptions(rawOptions);
  const inputFiles = files.map((file) => fileSnapshot(file.path, file.originalname, file.mimetype, file.size));
  const task = await createAiTaskRecord({
    toolType,
    status: "processing",
    inputFiles,
    provider: provider || env.aiDefaultProvider,
    model: null,
    user: user?._id || user?.id || null,
    sessionId: sessionId || null
  });

  try {
    const localArtifact = await runLocalAiArtifact({ toolType, files, options });
    if (localArtifact) {
      const completed = await updateAiTaskRecord(task.id, {
        status: "completed",
        provider: "convilarge-ai",
        model: "local-image-pipeline",
        inputSummary: inputFiles.map((file) => file.originalName).join(", "),
        output: {
          ...localArtifact.output,
          downloadName: localArtifact.outputFile.originalName
        },
        usage: {},
        meta: {
          outputMode: tool.outputMode,
          outputFile: localArtifact.outputFile
        }
      });
      return publicAiTask(completed);
    }

    const payload = await buildAiPayload({ toolType, files, options, provider });
    const result = await runAiProvider(payload);
    const output = fallbackOutput(toolType, result);
    const usage = result.usage || {};
    let outputFile = null;

    if (toolType === "ai-document-translator") {
      outputFile = await createTranslationArtifact({ output, sourceFile: files[0] });
    }
    if (toolType === "ai-pdf-quiz-generator") {
      outputFile = await createQuizArtifacts({ output });
    }

    await recordAiUsage({
      user,
      sessionId,
      toolType,
      provider: result.provider,
      model: result.model,
      usage
    });

    const completed = await updateAiTaskRecord(task.id, {
      status: "completed",
      provider: result.provider,
      model: result.model,
      inputSummary: payload.extracted?.text ? payload.extracted.text.slice(0, 400) : options.request || inputFiles[0]?.originalName || null,
      output: outputFile ? { ...output, downloadName: outputFile.originalName } : output,
      usage,
      meta: {
        outputMode: tool.outputMode,
        pageCount: payload.extracted?.pageCount || null,
        textHash: payload.extracted?.textHash || null,
        outputFile
      }
    });

    return publicAiTask(completed);
  } catch (error) {
    await updateAiTaskRecord(task.id, { status: "failed", error: error.message });
    throw error;
  } finally {
    await Promise.all(files.map((file) => removeFile(file.path)));
  }
}

export async function getAiTask(id, user, sessionId) {
  const task = await getAiTaskRecord(id, user?._id || user?.id || null, sessionId);
  return task ? publicAiTask(task) : null;
}

export async function deleteAiTask(id, user, sessionId) {
  const task = await deleteAiTaskRecord(id, user?._id || user?.id || null, sessionId);
  await removeFile(task?.meta?.outputFile?.path);
  return Boolean(task);
}

export async function getAiTaskDownload(id, user, sessionId) {
  const task = await getAiTaskRecord(id, user?._id || user?.id || null, sessionId);
  const outputFile = task?.meta?.outputFile;
  if (!task || !outputFile?.path || !fs.existsSync(outputFile.path)) return null;
  return {
    filePath: outputFile.path,
    filename: outputFile.originalName || "convilarge-ai-output",
    mimetype: outputFile.mimetype || "application/octet-stream"
  };
}

export async function getAiHistory(user, sessionId) {
  const tasks = await listAiTaskHistory(user?._id || user?.id || null, sessionId);
  return tasks.map(publicAiTask);
}

export async function getAiStats(user, sessionId) {
  return getAiUsageSummary(user?._id || user?.id || null, sessionId);
}

export { listAiTools, publicAiTask };
