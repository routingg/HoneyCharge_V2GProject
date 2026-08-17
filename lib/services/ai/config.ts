/**
 * Centralized Gemini configuration (§7). Nothing else in the codebase
 * should read `process.env.GEMINI_*` directly — go through this module so
 * the model name and enabled flag stay in one place.
 *
 * NOTE: the default model id below must be verified against the current
 * Gemini API before relying on live calls in production — model
 * availability changes over time and this was not verified against a
 * live API call in this environment (no network access to the Gemini API
 * during implementation). Override via `GEMINI_MODEL` regardless.
 */
export const geminiConfig = {
  enabled: process.env.GEMINI_ENABLED === "true" && Boolean(process.env.GEMINI_API_KEY),
  model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  apiKey: process.env.GEMINI_API_KEY,
  timeoutMs: Number(process.env.GEMINI_TIMEOUT_MS) || 8000,
};

export function isGeminiConfigured(): boolean {
  return geminiConfig.enabled;
}
