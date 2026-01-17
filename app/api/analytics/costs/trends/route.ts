import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCostTrends } from "@/lib/analytics";
import { z } from "zod";
import { subDays, subWeeks, subMonths } from "date-fns";

/**
 * GET /api/analytics/costs/trends
 * 
 * Get cost trends over time for charting
 * 
 * Query Parameters:
 * - granularity: "daily" | "weekly" | "monthly" (default: "daily")
 * - dateFrom: ISO date string (optional, defaults to 30 days ago)
 * - dateTo: ISO date string (optional, defaults to now)
 * 
 * Response:
 * {
 *   dataPoints: Array<{
 *     period: string,
 *     totalCost: number,
 *     reviewCount: number,
 *     avgCostPerReview: number,
 *     modelBreakdown: { flash, pro, thinking }
 *   }>,
 *   totals: { cost, reviews }
 * }
 */

const querySchema = z.object({
  granularity: z.enum(["daily", "weekly", "monthly"]).optional().default("daily"),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
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

    const { granularity, dateFrom, dateTo } = parseResult.data;

    // Set default date range based on granularity
    const now = new Date();
    const defaultDateFrom = {
      daily: subDays(now, 30),
      weekly: subWeeks(now, 12),
      monthly: subMonths(now, 6),
    }[granularity];

    const dateFromObj = dateFrom ? new Date(dateFrom) : defaultDateFrom;
    const dateToObj = dateTo ? new Date(dateTo) : now;

    // Validate date range
    if (dateFromObj >= dateToObj) {
      return NextResponse.json(
        { error: "dateFrom must be before dateTo" },
        { status: 400 }
      );
    }

    // Fetch cost trends
    const dataPoints = await getCostTrends(dateFromObj, dateToObj, granularity);

    // Calculate totals
    const totals = dataPoints.reduce(
      (acc, point) => ({
        cost: acc.cost + point.totalCost,
        reviews: acc.reviews + point.reviewCount,
      }),
      { cost: 0, reviews: 0 }
    );

    return NextResponse.json({
      dataPoints,
      totals,
      metadata: {
        granularity,
        dateFrom: dateFromObj.toISOString(),
        dateTo: dateToObj.toISOString(),
        dataPointCount: dataPoints.length,
      },
    });
  } catch (error) {
    console.error("[GET /api/analytics/costs/trends] Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
