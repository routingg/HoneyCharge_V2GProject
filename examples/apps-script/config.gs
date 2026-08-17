/**
 * Reference only — not deployed (see README.md in this directory).
 *
 * Centralizes Script Properties access so no other file ever calls
 * PropertiesService directly. Mirrors lib/services/ai/config.ts's rule:
 * one place owns configuration, secrets are never hardcoded.
 */
function getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    honeychargeBackendUrl: props.getProperty("HONEYCHARGE_BACKEND_URL"),
    honeychargeToken: props.getProperty("HONEYCHARGE_APPS_SCRIPT_TOKEN"),
    geminiApiKey: props.getProperty("GEMINI_API_KEY"),
    geminiModel: props.getProperty("GEMINI_MODEL") || "gemini-2.5-flash",
    calendarLookaheadHours: Number(props.getProperty("CALENDAR_LOOKAHEAD_HOURS")) || 36,
    locationSharingEnabled: props.getProperty("LOCATION_SHARING_ENABLED") === "true",
  };
}
