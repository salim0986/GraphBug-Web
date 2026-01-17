import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getReviewHistory } from "@/lib/analytics";
import { z } from "zod";

/**
 * GET /api/analytics/reviews
 * 
 * Get paginated list of code reviews with filters
 * 
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - repositoryId: string (optional)
 * - author: string (optional)
 * - status: "pending" | "in_progress" | "completed" | "failed" | "cancelled" (optional)
 * - dateFrom: ISO date string (optional)
 * - dateTo: ISO date string (optional)
 * - sortBy: "createdAt" | "completedAt" | "totalCost" (default: "createdAt")
 * - sortOrder: "asc" | "desc" (default: "desc")
 * 
 * Response:
 * {
 *   reviews: Array<ReviewHistoryItem>,
 *   pagination: { page, limit, total, totalPages },
 *   aggregates: { totalReviews, totalCost, avgIssues, avgScore }
 * }
 */

// Query parameter validation schema
const querySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  repositoryId: z.string().uuid().optional(),
  author: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed", "failed", "cancelled"]).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sortBy: z.enum(["createdAt", "completedAt", "totalCost"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
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

    const filters = parseResult.data;

    // Convert date strings to Date objects
    const dateFilters = {
      ...filters,
      dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
    };

    // Fetch review history
    const result = await getReviewHistory(dateFilters);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/analytics/reviews] Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
