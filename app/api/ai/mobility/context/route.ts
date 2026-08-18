import { NextResponse } from "next/server";
import { getAIService } from "@/lib/services/ai/AIService";
import type { MobilityContext } from "@/lib/services/ai/types";

function isValidBody(body: unknown): body is MobilityContext {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.nowIso === "string" &&
    typeof b.mobilityProfile === "object" &&
    b.mobilityProfile !== null &&
    Array.isArray(b.upcomingEvents)
  );
}

/**
 * §11, §63: server-only boundary to Gemini for the mobile "AI Mobility
 * Insight" card. Only the locally-derived statistical mobility profile and
 * data-minimized calendar events are sent — never raw trip history.
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
      { error: "expected { nowIso, mobilityProfile, upcomingEvents }" },
      { status: 400 },
    );
  }

  const result = await getAIService().analyzeMobilityContext(body);

  return NextResponse.json(result, {
    headers: { "cache-control": "no-store" },
  });
}
