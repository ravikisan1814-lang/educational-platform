import type { AIGenerateRequest, AIGenerateResponse, AIProvider } from "../types";
import { AIProviderConfigError, AIProviderError } from "../errors";
import { getRotatingKeys, nextRotatingKey } from "../key-rotation";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 60_000;
const OPENROUTER_DEFAULT_MODEL = "meta-llama/llama-3.3-70b-instruct:free";

interface OpenRouterGenerateResponse {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: { message?: string };
}

/**
 * OpenRouter provider (OpenAI-compatible chat completions API).
 *
 * Free-tier fallback provider. Supports multi-key rotation via
 * OPENROUTER_API_KEY, OPENROUTER_API_KEY_2, ... OPENROUTER_API_KEY_10 so the
 * platform can spread quota across multiple free-tier accounts.
 */
export const openrouterProvider: AIProvider = {
  name: "openrouter",
  defaultModel: OPENROUTER_DEFAULT_MODEL,

  async generate(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    const keys = getRotatingKeys("OPENROUTER_API_KEY");
    const apiKey = nextRotatingKey(keys);
    if (!apiKey) {
      throw new AIProviderConfigError("OPENROUTER_API_KEY is not configured.");
    }

    const model = request.model ?? OPENROUTER_DEFAULT_MODEL;

    const body: Record<string, unknown> = {
      model,
      messages: request.messages,
    };
    if (request.temperature !== undefined) body.temperature = request.temperature;
    if (request.maxTokens !== undefined) body.max_tokens = request.maxTokens;

    const res = await fetch(OPENROUTER_ENDPOINT, {
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
      throw new AIProviderError(`OpenRouter API error (${res.status}): ${detail}`);
    }

    const data = (await res.json()) as OpenRouterGenerateResponse;
    if (data.error?.message) {
      throw new AIProviderError(`OpenRouter API error: ${data.error.message}`);
    }

    return {
      provider: "openrouter",
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