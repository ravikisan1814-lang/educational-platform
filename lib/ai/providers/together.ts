import type { AIGenerateRequest, AIGenerateResponse, AIProvider } from "../types";
import { AIProviderConfigError, AIProviderError } from "../errors";

const TOGETHER_ENDPOINT = "https://api.together.xyz/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 60_000;
const TOGETHER_DEFAULT_MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo";

interface TogetherGenerateResponse {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: { message?: string };
}

/**
 * Together AI provider (OpenAI-compatible chat completions API).
 * Free-tier fallback provider — used when Gemini/Groq are unavailable.
 */
export const togetherProvider: AIProvider = {
  name: "together",
  defaultModel: TOGETHER_DEFAULT_MODEL,

  async generate(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    const apiKey = process.env.TOGETHER_API_KEY;
    if (!apiKey) {
      throw new AIProviderConfigError("TOGETHER_API_KEY is not configured.");
    }

    const model = request.model ?? TOGETHER_DEFAULT_MODEL;

    const body: Record<string, unknown> = {
      model,
      messages: request.messages,
    };
    if (request.temperature !== undefined) body.temperature = request.temperature;
    if (request.maxTokens !== undefined) body.max_tokens = request.maxTokens;

    const res = await fetch(TOGETHER_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!res.ok) {
      const detail = (await res.text()).slice(0, 500);
      throw new AIProviderError(`Together AI API error (${res.status}): ${detail}`);
    }

    const data = (await res.json()) as TogetherGenerateResponse;
    if (data.error?.message) {
      throw new AIProviderError(`Together AI API error: ${data.error.message}`);
    }

    return {
      provider: "together",
      model,
      content: data.choices?.[0]?.message?.content ?? "",
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      },
    };
  },
};