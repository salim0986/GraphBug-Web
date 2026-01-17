import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCostProjections } from "@/lib/analytics";
import { z } from "zod";

/**
 * GET /api/analytics/costs/projections
 * 
 * Get cost projections for current period based on historical trends
 * 
 * Query Parameters:
 * - period: "week" | "month" (default: "month")
 * 
 * Response:
 * {
 *   currentPeriod: { cost, reviews },
 *   projection: { cost, reviews },
 *   trend: "increasing" | "stable" | "decreasing",
 *   confidence: number
 * }
 */

const querySchema = z.object({
  period: z.enum(["week", "month"]).optional().default("month"),
});

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parseResult = querySchema.safeParse(searchParams);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { period } = parseResult.data;

    // Fetch cost projections
    const result = await getCostProjections(period);

    // Add confidence calculation (simple heuristic)
    // Higher confidence if we have more data (more reviews in current period)
    const confidence = Math.min(
      0.9,
      0.5 + (result.currentPeriod.reviews / 20) * 0.4
    );

    return NextResponse.json({
      ...result,
      confidence,
      metadata: {
        period,
        message: getProjectionMessage(result.trend, period, result.projection.cost),
      },
    });
  } catch (error) {
    console.error("[GET /api/analytics/costs/projections] Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Generate human-readable projection message
 */
function getProjectionMessage(
  trend: "increasing" | "stable" | "decreasing",
  period: "week" | "month",
  projectedCost: number
): string {
  const periodLabel = period === "week" ? "this week" : "this month";
  const costFormatted = `$${projectedCost.toFixed(2)}`;

  const trendMessages = {
    increasing: `Costs are trending upward. Expected to spend ${costFormatted} ${periodLabel}.`,
    stable: `Costs are stable. Expected to spend ${costFormatted} ${periodLabel}.`,
    decreasing: `Costs are trending downward. Expected to spend ${costFormatted} ${periodLabel}.`,
  };

  return trendMessages[trend];
}
