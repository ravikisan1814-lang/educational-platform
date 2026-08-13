import type { AIGenerateRequest, AIGenerateResponse, AIProvider, AIProviderName } from "./types";
import { AIProviderConfigError, AIProviderError } from "./errors";
import { geminiProvider } from "./providers/gemini";
import { groqProvider } from "./providers/groq";
import { togetherProvider } from "./providers/together";
import { huggingfaceProvider } from "./providers/huggingface";

export * from "./types";
export * from "./errors";

/** Registry of available providers. Add new providers here to expose them. */
export const AI_PROVIDERS: Record<AIProviderName, AIProvider> = {
  gemini: geminiProvider,
  groq: groqProvider,
  together: togetherProvider,
  huggingface: huggingfaceProvider,
};

export const AI_PROVIDER_NAMES = Object.keys(AI_PROVIDERS) as AIProviderName[];

/**
 * Free-tier failover priority: Gemini -> Groq -> Together AI -> Hugging Face.
 * If a provider is not configured or fails (rate limit / 5xx / timeout), the
 * next provider in this order is tried automatically.
 */
export const AI_PROVIDER_ORDER: AIProviderName[] = [
  "gemini",
  "groq",
  "together",
  "huggingface",
];

/**
 * System prompt that restricts the AI to ONLY answer questions relating to
 * this educational platform (syllabus, notes, content, study material, access
 * tiers, NEB/CDC curriculum, etc.). Prepended to every request.
 */
export const PLATFORM_SYSTEM_PROMPT =
  'You are the EduPlatform assistant for an educational platform covering NEB (National Examination Board) Class 11 & 12 and CDC (Curriculum Development Centre) curriculum. You may ONLY answer questions relating to this educational platform: its syllabus, notes, content, study material, access tiers, subjects (Biology, Chemistry, English, Mathematics, Nepali, Physics, Computer Science), and how to use the platform. For any out-of-scope query, reply exactly with: "I can only help with questions about this educational platform. Please ask about syllabus, notes, or study material."';

/**
 * Entry point for the AI abstraction. All providers hang off this.
 *
 * Automatic failover: tries providers in AI_PROVIDER_ORDER (Gemini -> Groq ->
 * Together AI -> Hugging Face). If a provider is not configured (missing API
 * key) or fails (rate limit / 5xx / timeout), the next provider is tried.
 * The platform system prompt is prepended to every request.
 */
export async function generateAI(request: AIGenerateRequest): Promise<AIGenerateResponse> {
  const requested = request.provider ?? process.env.AI_DEFAULT_PROVIDER;
  const startIndex = requested
    ? AI_PROVIDER_ORDER.indexOf(requested as AIProviderName)
    : 0;

  // If a specific provider is requested, start there, then fall back through
  // the remaining providers in priority order.
  const ordered: AIProviderName[] =
    startIndex >= 0
      ? [...AI_PROVIDER_ORDER.slice(startIndex), ...AI_PROVIDER_ORDER.slice(0, startIndex)]
      : AI_PROVIDER_ORDER;

  // Prepend the platform system prompt (dedupe if the caller already sent one).
  const hasSystem = request.messages.some((m) => m.role === "system");
  const messages = hasSystem
    ? request.messages
    : [{ role: "system" as const, content: PLATFORM_SYSTEM_PROMPT }, ...request.messages];

  let lastError: unknown = null;
  for (const name of ordered) {
    const provider = AI_PROVIDERS[name];
    if (!provider) continue;
    try {
      return await provider.generate({ ...request, messages });
    } catch (err) {
      lastError = err;
      // Continue to the next provider on config/rate-limit/5xx/timeout errors.
    }
  }

  if (lastError instanceof AIProviderConfigError) throw lastError;
  if (lastError instanceof AIProviderError) throw lastError;
  throw new AIProviderError("All AI providers failed to generate a response.");
}