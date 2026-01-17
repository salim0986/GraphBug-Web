import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getTeamAnalytics } from "@/lib/analytics";
import { z } from "zod";
import { subMonths } from "date-fns";

/**
 * GET /api/analytics/team
 * 
 * Get team/author analytics and performance metrics
 * 
 * Query Parameters:
 * - dateFrom: ISO date string (optional, defaults to 3 months ago)
 * - dateTo: ISO date string (optional, defaults to now)
 * - groupBy: "author" | "repository" (default: "author")
 * - topN: number of top authors to return (default: 20)
 * 
 * Response:
 * {
 *   authors: Array<{
 *     author: string,
 *     prCount: number,
 *     reviewCount: number,
 *     avgIssuesFound: number,
 *     avgScore: number,
 *     severityBreakdown: { critical, high, medium, low, info },
 *     categoryBreakdown: { security, performance, bug, ... },
 *     totalCost: number
 *   }>,
 *   topContributors: Array<{ author, prCount }>,
 *   aggregates: {
 *     totalAuthors: number,
 *     totalPRs: number,
 *     totalReviews: number,
 *     totalIssues: number
 *   }
 * }
 */

const querySchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  groupBy: z.enum(["author", "repository"]).optional().default("author"),
  topN: z.coerce.number().int().positive().max(100).optional().default(20),
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

    const { dateFrom, dateTo, topN } = parseResult.data;

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

    // Fetch team analytics
    const authors = await getTeamAnalytics(dateFromObj, dateToObj);

    // Limit to topN authors
    const topAuthors = authors.slice(0, topN);

    // Calculate top contributors (by PR count)
    const topContributors = [...authors]
      .sort((a, b) => b.prCount - a.prCount)
      .slice(0, 10)
      .map((a) => ({
        author: a.author,
        prCount: a.prCount,
        avgScore: a.avgScore,
      }));

    // Calculate aggregates
    const aggregates = authors.reduce(
      (acc, author) => ({
        totalAuthors: acc.totalAuthors + 1,
        totalPRs: acc.totalPRs + author.prCount,
        totalReviews: acc.totalReviews + author.reviewCount,
        totalIssues:
          acc.totalIssues +
          author.severityBreakdown.critical +
          author.severityBreakdown.high +
          author.severityBreakdown.medium +
          author.severityBreakdown.low +
          author.severityBreakdown.info,
        totalCost: acc.totalCost + author.totalCost,
      }),
      {
        totalAuthors: 0,
        totalPRs: 0,
        totalReviews: 0,
        totalIssues: 0,
        totalCost: 0,
      }
    );

    // Calculate overall severity distribution
    const overallSeverity = authors.reduce(
      (acc, author) => ({
        critical: acc.critical + author.severityBreakdown.critical,
        high: acc.high + author.severityBreakdown.high,
        medium: acc.medium + author.severityBreakdown.medium,
        low: acc.low + author.severityBreakdown.low,
        info: acc.info + author.severityBreakdown.info,
      }),
      { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
    );

    // Calculate overall category distribution
    const overallCategories = authors.reduce(
      (acc, author) => ({
        security: acc.security + author.categoryBreakdown.security,
        performance: acc.performance + author.categoryBreakdown.performance,
        bug: acc.bug + author.categoryBreakdown.bug,
        code_quality: acc.code_quality + author.categoryBreakdown.code_quality,
        best_practice: acc.best_practice + author.categoryBreakdown.best_practice,
        documentation: acc.documentation + author.categoryBreakdown.documentation,
        testing: acc.testing + author.categoryBreakdown.testing,
        accessibility: acc.accessibility + author.categoryBreakdown.accessibility,
        maintainability: acc.maintainability + author.categoryBreakdown.maintainability,
      }),
      {
        security: 0,
        performance: 0,
        bug: 0,
        code_quality: 0,
        best_practice: 0,
        documentation: 0,
        testing: 0,
        accessibility: 0,
        maintainability: 0,
      }
    );

    return NextResponse.json({
      authors: topAuthors,
      topContributors,
      aggregates,
      overallSeverity,
      overallCategories,
      metadata: {
        dateFrom: dateFromObj.toISOString(),
        dateTo: dateToObj.toISOString(),
        totalAuthorsFound: authors.length,
        displayedAuthors: topAuthors.length,
      },
    });
  } catch (error) {
    console.error("[GET /api/analytics/team] Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
