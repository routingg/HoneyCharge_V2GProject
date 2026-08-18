import { NextResponse } from "next/server";
import { getAIService } from "@/lib/services/ai/AIService";
import type { ScheduleExplanationInput } from "@/lib/services/ai/types";

function isValidBody(body: unknown): body is ScheduleExplanationInput {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.currentSoc === "number" &&
    typeof b.guaranteedSoc === "number" &&
    typeof b.tripRequirementSoc === "number" &&
    typeof b.userReserveSoc === "number" &&
    typeof b.departureTimeIso === "string" &&
    typeof b.historicalConfidence === "number" &&
    (b.calendarRelevance === "none" ||
      b.calendarRelevance === "low" ||
      b.calendarRelevance === "medium" ||
      b.calendarRelevance === "high") &&
    (b.action === "CHARGE" || b.action === "IDLE" || b.action === "DISCHARGE")
  );
}

/**
 * §9, §11, §63: server-only boundary to Gemini for the mobile "Why this
 * plan?" card. The client sends only the already-computed facts (never raw
 * calendar/trip data) and Gemini is only allowed to phrase them, not
 * invent numbers (enforced by buildScheduleExplanationPrompt + schema
 * validation in GeminiProvider).
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  if (!isValidBody(body)) {
    return NextResponse.json(
      {
        error:
          "expected { currentSoc, guaranteedSoc, tripRequirementSoc, userReserveSoc, departureTimeIso, historicalConfidence, calendarRelevance, action }",
      },
      { status: 400 },
    );
  }

  const result = await getAIService().explainSchedule(body);

  return NextResponse.json(result, {
    headers: { "cache-control": "no-store" },
  });
}
