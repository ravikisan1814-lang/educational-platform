/** Configuration or availability error for an AI provider (missing API key, bad setup). */
export class AIProviderConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIProviderConfigError";
  }
}

/** Upstream provider failure (HTTP error, rate limit, invalid model, …). */
export class AIProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIProviderError";
  }
}
