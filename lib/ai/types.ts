export type AIChatRole = "system" | "user" | "assistant";

export interface AIChatMessage {
  role: AIChatRole;
  content: string;
}

export type AIProviderName = "gemini" | "groq" | "mistral" | "openrouter" | "fireworks";

export interface AIGenerateRequest {
  /** Provider key; falls back to AI_DEFAULT_PROVIDER env var. */
  provider?: AIProviderName;
  /** Provider-specific model override; provider default when omitted. */
  model?: string;
  messages: AIChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface AIGenerateResponse {
  provider: AIProviderName;
  model: string;
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * A single LLM provider behind the abstraction. Implementations must not
 * throw raw upstream errors — wrap them in AIProviderError.
 */
export interface AIProvider {
  readonly name: AIProviderName;
  readonly defaultModel: string;
  generate(request: AIGenerateRequest): Promise<AIGenerateResponse>;
}
