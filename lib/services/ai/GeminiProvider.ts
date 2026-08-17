import { GoogleGenAI } from "@google/genai";
import { geminiConfig } from "./config";
import {
  fallbackCalendarMobilityAnalysis,
  fallbackMobilityContextAnalysis,
  fallbackScheduleExplanation,
  logAiFallback,
} from "./fallback";
import {
  buildCalendarMobilityPrompt,
  buildMobilityContextPrompt,
  buildScheduleExplanationPrompt,
  PROMPT_VERSIONS,
} from "./prompts";
import {
  calendarMobilityAnalysisSchema,
  mobilityContextAnalysisSchema,
  scheduleExplanationSchema,
  validateCalendarMobilityAnalysis,
  validateMobilityContextAnalysis,
  validateScheduleExplanation,
} from "./schemas";
import type {
  AIService,
  AiFallbackLogEntry,
  CalendarEventContext,
  MobilityContext,
  MobilityContextAnalysis,
  ScheduleExplanation,
  ScheduleExplanationInput,
} from "./types";
import type { CalendarMobilityAnalysis } from "../../domain/calendar/types";

type FallbackReason = AiFallbackLogEntry["reason"];

class GeminiTimeoutError extends Error {}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new GeminiTimeoutError(`Gemini call exceeded ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

function classifyError(error: unknown): FallbackReason {
  if (error instanceof GeminiTimeoutError) return "TIMEOUT";
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (message.includes("429") || message.includes("rate limit") || message.includes("quota")) {
    return "RATE_LIMIT";
  }
  if (message.includes("500") || message.includes("503") || message.includes("server error")) {
    return "SERVER_ERROR";
  }
  if (message.includes("fetch failed") || message.includes("network") || message.includes("enotfound")) {
    return "NETWORK_ERROR";
  }
  return "UNKNOWN_ERROR";
}

/**
 * §9, §12: Gemini-backed AIService implementation. Every method:
 *  1. Bails out immediately (no network call) if Gemini is disabled/unconfigured.
 *  2. Requests structured JSON output constrained by a schema (§8).
 *  3. Independently re-validates the parsed JSON (§8) — a 200 response is
 *     not trusted on its own.
 *  4. Falls back to a deterministic heuristic and logs an AI_FALLBACK
 *     event on any failure mode (§9), never throwing out to the caller.
 */
export class GeminiProvider implements AIService {
  private readonly client: GoogleGenAI | null;

  constructor() {
    this.client =
      geminiConfig.enabled && geminiConfig.apiKey
        ? new GoogleGenAI({ apiKey: geminiConfig.apiKey })
        : null;
  }

  private logFallback(reason: FallbackReason, detail?: string): void {
    logAiFallback({ type: "AI_FALLBACK", provider: "gemini", reason, fallback: "HISTORICAL_PATTERN", detail });
  }

  private async callStructured(
    prompt: string,
    responseJsonSchema: unknown,
  ): Promise<{ ok: true; data: unknown } | { ok: false; reason: FallbackReason; detail: string }> {
    if (!this.client) {
      return { ok: false, reason: geminiConfig.apiKey ? "DISABLED" : "MISSING_KEY", detail: "Gemini not configured" };
    }
    try {
      const response = await withTimeout(
        this.client.models.generateContent({
          model: geminiConfig.model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseJsonSchema,
            temperature: 0,
          },
        }),
        geminiConfig.timeoutMs,
      );
      const text = response.text;
      if (!text) return { ok: false, reason: "INVALID_JSON", detail: "empty response" };
      try {
        return { ok: true, data: JSON.parse(text) };
      } catch {
        return { ok: false, reason: "INVALID_JSON", detail: "response was not valid JSON" };
      }
    } catch (error) {
      return { ok: false, reason: classifyError(error), detail: error instanceof Error ? error.message : String(error) };
    }
  }

  async classifyCalendarEvent(
    input: CalendarEventContext,
  ): Promise<CalendarMobilityAnalysis & { source: "gemini" | "fallback" }> {
    const result = await this.callStructured(
      buildCalendarMobilityPrompt(input),
      calendarMobilityAnalysisSchema,
    );
    if (!result.ok) {
      this.logFallback(result.reason, `${PROMPT_VERSIONS.calendarMobility}: ${result.detail}`);
      return fallbackCalendarMobilityAnalysis(input);
    }
    const validated = validateCalendarMobilityAnalysis(result.data);
    if (!validated.valid || !validated.value) {
      this.logFallback("INVALID_SCHEMA", `${PROMPT_VERSIONS.calendarMobility}: ${validated.errors.join("; ")}`);
      return fallbackCalendarMobilityAnalysis(input);
    }
    return { ...validated.value, source: "gemini" };
  }

  async analyzeMobilityContext(input: MobilityContext): Promise<MobilityContextAnalysis> {
    const result = await this.callStructured(
      buildMobilityContextPrompt(input),
      mobilityContextAnalysisSchema,
    );
    if (!result.ok) {
      this.logFallback(result.reason, `${PROMPT_VERSIONS.mobilityContext}: ${result.detail}`);
      return fallbackMobilityContextAnalysis(input);
    }
    const validated = validateMobilityContextAnalysis(result.data);
    if (!validated.valid || !validated.value) {
      this.logFallback("INVALID_SCHEMA", `${PROMPT_VERSIONS.mobilityContext}: ${validated.errors.join("; ")}`);
      return fallbackMobilityContextAnalysis(input);
    }
    return { ...validated.value, source: "gemini" };
  }

  async explainSchedule(input: ScheduleExplanationInput): Promise<ScheduleExplanation> {
    const result = await this.callStructured(
      buildScheduleExplanationPrompt(input),
      scheduleExplanationSchema,
    );
    if (!result.ok) {
      this.logFallback(result.reason, `${PROMPT_VERSIONS.scheduleExplanation}: ${result.detail}`);
      return fallbackScheduleExplanation(input);
    }
    const validated = validateScheduleExplanation(result.data);
    if (!validated.valid || !validated.value) {
      this.logFallback("INVALID_SCHEMA", `${PROMPT_VERSIONS.scheduleExplanation}: ${validated.errors.join("; ")}`);
      return fallbackScheduleExplanation(input);
    }
    return { ...validated.value, source: "gemini" };
  }
}
