import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCostSummary, getCostByRepository } from "@/lib/analytics";
import { z } from "zod";

/**
 * GET /api/analytics/costs
 * 
 * Get cost summary with breakdown by model and repository
 * 
 * Query Parameters:
 * - scope: "user" | "repository" | "installation" (optional)
 * - scopeId: string (required if scope is set)
 * - dateFrom: ISO date string (optional)
 * - dateTo: ISO date string (optional)
 * - topN: number of top repositories to return (default: 10)
 * 
 * Response:
 * {
 *   summary: {
 *     totalCost, reviewCount, avgCostPerReview,
 *     modelBreakdown: { flash, pro, thinking }
 *   },
 *   byRepository: Array<{ repoName, totalCost, reviewCount, avgCost }>,
 *   byModel: Array<{ model, cost, percentage }>
 * }
 */

const querySchema = z.object({
  scope: z.enum(["user", "repository", "installation"]).optional(),
  scopeId: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  topN: z.coerce.number().int().positive().max(50).optional().default(10),
}).refine(
  (data) => {
    // If scope is provided, scopeId must also be provided
    if (data.scope && !data.scopeId) {
      return false;
    }
    return true;
  },
  {
    message: "scopeId is required when scope is specified",
    path: ["scopeId"],
  }
);

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

    const { dateFrom, dateTo, scope, scopeId, topN } = parseResult.data;

    // Convert date strings to Date objects
    const dateFromObj = dateFrom ? new Date(dateFrom) : undefined;
    const dateToObj = dateTo ? new Date(dateTo) : undefined;

    // Build scope object
    const scopeObj = scope && scopeId
      ? { type: scope as "repository" | "installation", id: scopeId }
      : undefined;

    // Fetch cost summary
    const summary = await getCostSummary(dateFromObj, dateToObj, scopeObj);

    // Fetch cost breakdown by repository
    const byRepository = await getCostByRepository(dateFromObj, dateToObj, topN);

    // Calculate model breakdown as array with percentages
    const { flash, pro, thinking } = summary.modelBreakdown;
    const totalModelCost = flash + pro + thinking;

    const byModel = [
      {
        model: "Gemini 1.5 Flash",
        tier: "flash",
        cost: flash,
        percentage: totalModelCost > 0 ? (flash / totalModelCost) * 100 : 0,
      },
      {
        model: "Gemini 1.5 Pro",
        tier: "pro",
        cost: pro,
        percentage: totalModelCost > 0 ? (pro / totalModelCost) * 100 : 0,
      },
      {
        model: "Gemini 2.0 Flash Thinking",
        tier: "thinking",
        cost: thinking,
        percentage: totalModelCost > 0 ? (thinking / totalModelCost) * 100 : 0,
      },
    ].filter((m) => m.cost > 0); // Only include models that were used

    return NextResponse.json({
      summary,
      byRepository,
      byModel,
    });
  } catch (error) {
    console.error("[GET /api/analytics/costs] Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
