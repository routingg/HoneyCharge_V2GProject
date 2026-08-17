/**
 * Reference only — not deployed (see README.md in this directory).
 *
 * NOT the recommended path. Shown only to document that Apps Script
 * *could* call the Gemini REST API directly. Doing so duplicates the
 * API key and the classification prompt/schema that already live in
 * lib/services/ai/{GeminiProvider,prompts,schemas}.ts — prefer
 * honeycharge.gs, which keeps that logic in exactly one place (§7).
 *
 * If ever used, this must apply the exact same rules as GeminiProvider:
 * structured JSON output only (§8), independent validation of the
 * response, and a deterministic fallback on any failure (§9) — none of
 * which is implemented here since this file is not meant to run.
 */
function classifyEventDirectlyWithGemini(normalizedEvent) {
  const config = getConfig();
  if (!config.geminiApiKey) {
    throw new Error("GEMINI_API_KEY not set — and this path should not be used anyway; see file header.");
  }

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    config.geminiModel + ":generateContent?key=" + config.geminiApiKey;

  const prompt =
    "Classify whether this calendar event requires the driver's own vehicle. " +
    "Event: " + JSON.stringify(normalizedEvent) + ". " +
    "Respond with JSON: {mobilityRelevant, vehicleNeedProbability, confidence, reasons}.";

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0 },
    }),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(url, options);
  // A real implementation MUST validate this response the same way
  // lib/services/ai/schemas.ts::validateCalendarMobilityAnalysis does,
  // and fall back deterministically on any failure — omitted here since
  // this file is documentation, not executable production code.
  return JSON.parse(response.getContentText());
}
