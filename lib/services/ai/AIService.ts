import { GeminiProvider } from "./GeminiProvider";
import type { AIService } from "./types";

let singleton: AIService | null = null;

/**
 * Single entry point the rest of the app should use to reach the AI layer
 * (§6: "UI components must NEVER call Gemini directly. Business logic
 * must NEVER import Gemini SDK objects directly."). `GeminiProvider`
 * already degrades to the deterministic fallback internally when Gemini
 * is disabled/unavailable, so callers never need to branch on
 * `GEMINI_ENABLED` themselves.
 */
export function getAIService(): AIService {
  if (!singleton) singleton = new GeminiProvider();
  return singleton;
}
