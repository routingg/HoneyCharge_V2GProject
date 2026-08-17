/**
 * Reference only — not deployed (see README.md in this directory).
 *
 * Posts normalized calendar events to HoneyCharge's
 * /api/ai/calendar/analyze endpoint (recommended path — keeps the Gemini
 * key and prompt/schema logic server-side in one place, see
 * lib/services/ai/GeminiProvider.ts). Intended to run on a time-driven
 * trigger (§84).
 */
function syncUpcomingEvents() {
  const config = getConfig();
  if (!config.honeychargeBackendUrl) {
    console.error("HONEYCHARGE_BACKEND_URL is not set in Script Properties.");
    return;
  }

  const events = getNormalizedUpcomingEvents();
  const mobilityProfile = { historySampleCount: 0 }; // Apps Script has no trip history; HoneyCharge's server supplies its own.

  events.forEach(function (event) {
    const payload = {
      event: event,
      mobilityProfile: mobilityProfile,
      nowIso: new Date().toISOString(),
    };

    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
      headers: config.honeychargeToken
        ? { Authorization: "Bearer " + config.honeychargeToken }
        : {},
    };

    try {
      const response = UrlFetchApp.fetch(config.honeychargeBackendUrl, options);
      const status = response.getResponseCode();
      if (status !== 200) {
        console.error("HoneyCharge classify failed: " + status + " " + response.getContentText());
        return;
      }
      const analysis = JSON.parse(response.getContentText());
      console.log(
        "Event " + event.id + ": mobilityRelevant=" + analysis.mobilityRelevant +
        " probability=" + analysis.vehicleNeedProbability +
        " source=" + analysis.source,
      );
    } catch (err) {
      console.error("HoneyCharge classify error for event " + event.id + ": " + err);
    }
  });
}
