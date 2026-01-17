import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getRepositoryInsights } from "@/lib/analytics";
import { z } from "zod";
import { subMonths } from "date-fns";

/**
 * GET /api/analytics/repositories/[id]/insights
 * 
 * Get comprehensive insights for a specific repository
 * 
 * Query Parameters:
 * - dateFrom: ISO date string (optional, defaults to 3 months ago)
 * - dateTo: ISO date string (optional, defaults to now)
 * 
 * Response:
 * {
 *   repository: { id, name, fullName },
 *   overview: {
 *     totalReviews, totalPRs, avgIssuesPerPR, avgScorePerPR, totalCost
 *   },
 *   hotFiles: Array<{
 *     filePath, reviewCount, issueCount, avgSeverity, lastReviewedAt
 *   }>,
 *   reviewTrends: Array<{
 *     period, totalCost, reviewCount, avgCostPerReview, modelBreakdown
 *   }>,
 *   issuePatterns: {
 *     byCategory: Array<{ category, count, percentage }>,
 *     bySeverity: Array<{ severity, count, percentage }>,
 *     commonIssues: Array<{ title, count }>
 *   }
 * }
 */

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

const querySchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get repository ID from route params
    const params = await context.params;
    const repositoryId = params.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(repositoryId)) {
      return NextResponse.json(
        { error: "Invalid repository ID format" },
        { status: 400 }
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

    const { dateFrom, dateTo } = parseResult.data;

    // Set default date range (last 3 months)
    const now = new Date();
    const dateFromObj = dateFrom ? new Date(dateFrom) : subMonths(now, 3);
    const dateToObj = dateTo ? new Date(dateTo) : now;

    // Validate date range
    if (dateFromObj >= dateToObj) {
      return NextResponse.json(
        { error: "dateFrom must be before dateTo" },
        { status: 400 }
      );
    }

    // Fetch repository insights
    const insights = await getRepositoryInsights(repositoryId, dateFromObj, dateToObj);

    if (!insights) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...insights,
      metadata: {
        dateFrom: dateFromObj.toISOString(),
        dateTo: dateToObj.toISOString(),
      },
    });
  } catch (error) {
    console.error(`[GET /api/analytics/repositories/${(await context.params).id}/insights] Error:`, error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
