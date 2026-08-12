import type { AIGenerateRequest, AIGenerateResponse, AIProvider, AIChatMessage } from "../types";
import { AIProviderConfigError, AIProviderError } from "../errors";

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const REQUEST_TIMEOUT_MS = 60_000;

interface GeminiGenerateResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    completionTokenCount?: number;
    totalTokenCount?: number;
  };
  error?: { message?: string };
}

function toGeminiMessages(messages: AIChatMessage[]) {
  const systemMessages = messages.filter((m) => m.role === "system");
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
  return { systemMessages, contents };
}

export const geminiProvider: AIProvider = {
  name: "gemini",
  defaultModel: "gemini-2.5-pro",

  async generate(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new AIProviderConfigError("GEMINI_API_KEY is not configured.");
    }

    const model = request.model ?? this.defaultModel;
    const { systemMessages, contents } = toGeminiMessages(request.messages);

    const body: Record<string, unknown> = { contents };
    if (systemMessages.length > 0) {
      body.systemInstruction = {
        parts: systemMessages.map((m) => ({ text: m.content })),
      };
    }
    const generationConfig: Record<string, unknown> = {};
    if (request.temperature !== undefined) generationConfig.temperature = request.temperature;
    if (request.maxTokens !== undefined) generationConfig.maxOutputTokens = request.maxTokens;
    if (Object.keys(generationConfig).length > 0) {
      body.generationConfig = generationConfig;
    }

    const res = await fetch(`${GEMINI_ENDPOINT}/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!res.ok) {
      const detail = (await res.text()).slice(0, 500);
      throw new AIProviderError(`Gemini API error (${res.status}): ${detail}`);
    }

    const data = (await res.json()) as GeminiGenerateResponse;
    if (data.error?.message) {
      throw new AIProviderError(`Gemini API error: ${data.error.message}`);
    }

    const content =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";

    return {
      provider: "gemini",
      model,
      content,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
        completionTokens: data.usageMetadata?.completionTokenCount ?? 0,
        totalTokens: data.usageMetadata?.totalTokenCount ?? 0,
      },
    };
  },
};
