import type { AIGenerateRequest, AIGenerateResponse, AIProvider } from "../types";
import { AIProviderConfigError, AIProviderError } from "../errors";

const HF_ENDPOINT = "https://router.huggingface.co/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 60_000;
const HUGGINGFACE_DEFAULT_MODEL = "meta-llama/Llama-3.3-70B-Instruct";

interface HuggingFaceGenerateResponse {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: { message?: string };
}

/**
 * Hugging Face Inference API provider (OpenAI-compatible router endpoint).
 * Free-tier fallback provider — used when Gemini/Groq/Together are unavailable.
 */
export const huggingfaceProvider: AIProvider = {
  name: "huggingface",
  defaultModel: HUGGINGFACE_DEFAULT_MODEL,

  async generate(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      throw new AIProviderConfigError("HUGGINGFACE_API_KEY is not configured.");
    }

    const model = request.model ?? HUGGINGFACE_DEFAULT_MODEL;

    const body: Record<string, unknown> = {
      model,
      messages: request.messages,
    };
    if (request.temperature !== undefined) body.temperature = request.temperature;
    if (request.maxTokens !== undefined) body.max_tokens = request.maxTokens;

    const res = await fetch(HF_ENDPOINT, {
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
      throw new AIProviderError(`Hugging Face API error (${res.status}): ${detail}`);
    }

    const data = (await res.json()) as HuggingFaceGenerateResponse;
    if (data.error?.message) {
      throw new AIProviderError(`Hugging Face API error: ${data.error.message}`);
    }

    return {
      provider: "huggingface",
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