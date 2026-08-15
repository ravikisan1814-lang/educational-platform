import type { AIGenerateRequest, AIGenerateResponse, AIProvider } from "../types";
import { AIProviderConfigError, AIProviderError } from "../errors";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 60_000;

interface OpenRouterResponse {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: { message?: string };
}

export const openrouterProvider: AIProvider = {
  name: "openrouter",
  defaultModel: "meta-llama/llama-3.3-70b-instruct:free",

  async generate(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new AIProviderConfigError("OPENROUTER_API_KEY is not configured.");
    }

    const model = request.model ?? this.defaultModel;
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
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "https://ravikisan.platform",
        "X-Title": "Ravikisan Platform",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!res.ok) {
      const detail = (await res.text()).slice(0, 500);
      throw new AIProviderError(`OpenRouter API error (${res.status}): ${detail}`);
    }

    const data = (await res.json()) as OpenRouterResponse;
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
