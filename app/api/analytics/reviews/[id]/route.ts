import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getReviewDetails } from "@/lib/analytics";

/**
 * GET /api/analytics/reviews/[id]
 * 
 * Get full details for a specific code review
 * 
 * Parameters:
 * - id: Review UUID
 * 
 * Response:
 * {
 *   review: {
 *     id, prNumber, prTitle, repository, author, status,
 *     summary, keyChanges, recommendations, positives,
 *     modelsUsed, totalCost, executionTime, timestamps
 *   },
 *   comments: Array<{
 *     id, filePath, lines, severity, category, title, message, suggestion
 *   }>,
 *   prDetails: {
 *     htmlUrl, branches, stats
 *   }
 * }
 */

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

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

    // Get review ID from route params
    const params = await context.params;
    const reviewId = params.id;

    // Validate UUID format (basic check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(reviewId)) {
      return NextResponse.json(
        { error: "Invalid review ID format" },
        { status: 400 }
      );
    }

    // Fetch review details
    const result = await getReviewDetails(reviewId);

    if (!result) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error(`[GET /api/analytics/reviews/${(await context.params).id}] Error:`, error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
