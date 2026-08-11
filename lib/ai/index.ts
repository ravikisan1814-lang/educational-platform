import type { AIGenerateRequest, AIGenerateResponse, AIProvider, AIProviderName } from "./types";
import { AIProviderError } from "./errors";
import { geminiProvider } from "./providers/gemini";
import { groqProvider } from "./providers/groq";

export * from "./types";
export * from "./errors";

/** Registry of available providers. Add new providers here to expose them. */
export const AI_PROVIDERS: Record<AIProviderName, AIProvider> = {
  gemini: geminiProvider,
  groq: groqProvider,
};

export const AI_PROVIDER_NAMES = Object.keys(AI_PROVIDERS) as AIProviderName[];

function resolveProvider(request: AIGenerateRequest): AIProvider {
  const requested = request.provider ?? process.env.AI_DEFAULT_PROVIDER;
  const name = (requested ?? "gemini") as AIProviderName;
  const provider = AI_PROVIDERS[name];
  if (!provider) {
    throw new AIProviderError(
      `Unknown provider "${String(requested)}". Available: ${AI_PROVIDER_NAMES.join(", ")}.`
    );
  }
  return provider;
}

/** Entry point for the AI abstraction. All providers hang off this. */
export async function generateAI(request: AIGenerateRequest): Promise<AIGenerateResponse> {
  const provider = resolveProvider(request);
  return provider.generate(request);
}
