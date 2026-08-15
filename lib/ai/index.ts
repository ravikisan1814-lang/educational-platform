import type { AIGenerateRequest, AIGenerateResponse, AIProvider, AIProviderName } from "./types";
import { AIProviderError } from "./errors";
import { geminiProvider } from "./providers/gemini";
import { groqProvider } from "./providers/groq";
import { mistralProvider } from "./providers/mistral";
import { openrouterProvider } from "./providers/openrouter";
import { fireworksProvider } from "./providers/fireworks";

export * from "./types";
export * from "./errors";

/** Registry of available providers. Add new providers here to expose them. */
export const AI_PROVIDERS: Record<AIProviderName, AIProvider> = {
  gemini: geminiProvider,
  groq: groqProvider,
  mistral: mistralProvider,
  openrouter: openrouterProvider,
  fireworks: fireworksProvider,
};

export const AI_PROVIDER_NAMES = Object.keys(AI_PROVIDERS) as AIProviderName[];

function resolveProvider(request: AIGenerateRequest): AIProvider {
  const requested = request.provider ?? process.env.AI_DEFAULT_PROVIDER;
  const name = (requested ?? "mistral") as AIProviderName;
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

/** Prefer keys the owner supplied; then free-tier backups. */
const FAILOVER_ORDER: AIProviderName[] = [
  "mistral",
  "openrouter",
  "fireworks",
  "gemini",
  "groq",
];

/**
 * Try providers in priority order until one succeeds. Used by the platform
 * chat widget so a missing/rate-limited key does not block the whole feature.
 */
export async function generateAIWithFailover(
  request: Omit<AIGenerateRequest, "provider">
): Promise<AIGenerateResponse> {
  const errors: string[] = [];

  for (const name of FAILOVER_ORDER) {
    const provider = AI_PROVIDERS[name];
    if (!provider) continue;
    try {
      return await provider.generate({ ...request, provider: name });
    } catch (err) {
      errors.push(`${name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  throw new AIProviderError(
    errors.length > 0
      ? `All AI providers failed. ${errors.join(" | ")}`
      : "No AI providers configured."
  );
}
