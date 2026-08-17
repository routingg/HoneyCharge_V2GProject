import { NextResponse } from "next/server";
import { getAIService } from "@/lib/services/ai/AIService";
import type { NormalizedCalendarEvent } from "@/lib/domain/calendar/types";
import type { MobilityProfile } from "@/lib/domain/mobility/types";

interface AnalyzeRequestBody {
  event: NormalizedCalendarEvent;
  mobilityProfile: MobilityProfile;
  nowIso: string;
}

function isValidBody(body: unknown): body is AnalyzeRequestBody {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  const event = b.event as Record<string, unknown> | undefined;
  return (
    typeof event === "object" &&
    event !== null &&
    typeof event.id === "string" &&
    typeof event.start === "string" &&
    typeof event.end === "string" &&
    typeof b.nowIso === "string"
  );
}

/**
 * §6, §63: server-only boundary to Gemini. The client never sees the API
 * key or imports the Gemini SDK — it only ever POSTs a normalized,
 * data-minimized calendar event here (§10).
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
      { error: "expected { event: {id,start,end,allDay?,location?}, mobilityProfile, nowIso }" },
      { status: 400 },
    );
  }

  const result = await getAIService().classifyCalendarEvent({
    event: body.event,
    mobilityProfile: body.mobilityProfile ?? { historySampleCount: 0 },
    nowIso: body.nowIso,
  });

  return NextResponse.json(result, {
    headers: { "cache-control": "no-store" },
  });
}
