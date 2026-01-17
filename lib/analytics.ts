import { db } from "@/db/schema";
import { 
  codeReviews, 
  reviewComments, 
  pullRequests, 
  githubRepositories,
  reviewInsights 
} from "@/db/schema";
import { eq, and, gte, lte, desc, asc, sql, count, avg, sum, inArray } from "drizzle-orm";
import { startOfDay, startOfWeek, startOfMonth, subDays, subWeeks, subMonths, format } from "date-fns";

/**
 * Analytics Query Layer
 * 
 * Centralized database queries for all analytics endpoints.
 * Handles review history, cost tracking, team analytics, and repository insights.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ReviewFilters {
  page?: number;
  limit?: number;
  repositoryId?: string;
  author?: string;
  status?: "pending" | "in_progress" | "completed" | "failed" | "cancelled";
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: "createdAt" | "completedAt" | "totalCost";
  sortOrder?: "asc" | "desc";
}

export interface ReviewHistoryItem {
  id: string;
  prNumber: number;
  prTitle: string;
  prHtmlUrl: string;
  repositoryName: string;
  repositoryFullName: string;
  author: string;
  authorAvatarUrl: string | null;
  status: string;
  summary: {
    overallScore: number;
    issuesFound: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  } | null;
  totalCost: number | null;
  executionTimeMs: number | null;
  createdAt: Date;
  completedAt: Date | null;
}

export interface ReviewHistoryResponse {
  reviews: ReviewHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  aggregates: {
    totalReviews: number;
    totalCost: number;
    avgIssues: number;
    avgScore: number;
  };
}

export interface ReviewDetailResponse {
  review: {
    id: string;
    prNumber: number;
    prTitle: string;
    prDescription: string | null;
    repositoryName: string;
    repositoryFullName: string;
    author: string;
    authorAvatarUrl: string | null;
    status: string;
    summary: any;
    keyChanges: any;
    recommendations: any;
    positives: any;
    modelsUsed: any;
    totalCost: number;
    totalTokensInput: number;
    totalTokensOutput: number;
    executionTimeMs: number | null;
    createdAt: Date;
    startedAt: Date | null;
    completedAt: Date | null;
  };
  comments: Array<{
    id: string;
    filePath: string;
    startLine: number | null;
    endLine: number | null;
    severity: string;
    category: string;
    title: string;
    message: string;
    suggestion: string | null;
    codeSnippet: string | null;
    confidence: number | null;
    isResolved: boolean;
    createdAt: Date;
  }>;
  prDetails: {
    htmlUrl: string;
    diffUrl: string | null;
    patchUrl: string | null;
    baseBranch: string;
    headBranch: string;
    filesChanged: number;
    additions: number;
    deletions: number;
    status: string;
    isDraft: boolean;
  };
}

export interface CostSummary {
  totalCost: number;
  reviewCount: number;
  avgCostPerReview: number;
  modelBreakdown: {
    flash: number;
    pro: number;
    thinking: number;
  };
}

export interface CostByRepository {
  repoName: string;
  repoFullName: string;
  totalCost: number;
  reviewCount: number;
  avgCost: number;
}

export interface CostTrendDataPoint {
  period: string; // ISO date or period identifier
  totalCost: number;
  reviewCount: number;
  avgCostPerReview: number;
  modelBreakdown: {
    flash: number;
    pro: number;
    thinking: number;
  };
}

export interface TeamAuthorStats {
  author: string;
  prCount: number;
  reviewCount: number;
  avgIssuesFound: number;
  avgScore: number;
  severityBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  categoryBreakdown: {
    security: number;
    performance: number;
    bug: number;
    code_quality: number;
    best_practice: number;
    documentation: number;
    testing: number;
    accessibility: number;
    maintainability: number;
  };
  totalCost: number;
}

export interface RepositoryInsights {
  repository: {
    id: string;
    name: string;
    fullName: string;
  };
  overview: {
    totalReviews: number;
    totalPRs: number;
    avgIssuesPerPR: number;
    avgScorePerPR: number;
    totalCost: number;
  };
  hotFiles: Array<{
    filePath: string;
    reviewCount: number;
    issueCount: number;
    avgSeverity: number;
    lastReviewedAt: Date;
  }>;
  reviewTrends: CostTrendDataPoint[];
  issuePatterns: {
    byCategory: Array<{ category: string; count: number; percentage: number }>;
    bySeverity: Array<{ severity: string; count: number; percentage: number }>;
    commonIssues: Array<{ title: string; count: number }>;
  };
}

// ============================================================================
// REVIEW HISTORY QUERIES
// ============================================================================

/**
 * Get paginated review history with filters
 */
export async function getReviewHistory(filters: ReviewFilters): Promise<ReviewHistoryResponse> {
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 20, 100); // Max 100 per page
  const offset = (page - 1) * limit;

  // Build WHERE conditions
  const conditions = [];
  
  if (filters.repositoryId) {
    conditions.push(eq(githubRepositories.id, filters.repositoryId));
  }
  
  if (filters.author) {
    conditions.push(eq(pullRequests.author, filters.author));
  }
  
  if (filters.status) {
    conditions.push(eq(codeReviews.status, filters.status));
  }
  
  if (filters.dateFrom) {
    conditions.push(gte(codeReviews.createdAt, filters.dateFrom));
  }
  
  if (filters.dateTo) {
    conditions.push(lte(codeReviews.createdAt, filters.dateTo));
  }

  // Build ORDER BY
  const sortBy = filters.sortBy || "createdAt";
  const sortColumn = sortBy === "createdAt" 
    ? codeReviews.createdAt
    : sortBy === "completedAt"
    ? codeReviews.completedAt
    : codeReviews.totalCost;
  
  const sortDirection = filters.sortOrder === "asc" ? asc : desc;

  // Fetch reviews with JOINs
  const reviews = await db
    .select({
      id: codeReviews.id,
      prNumber: pullRequests.prNumber,
      prTitle: pullRequests.title,
      prHtmlUrl: pullRequests.htmlUrl,
      repositoryName: githubRepositories.name,
      repositoryFullName: githubRepositories.fullName,
      author: pullRequests.author,
      authorAvatarUrl: pullRequests.authorAvatarUrl,
      status: codeReviews.status,
      summary: codeReviews.summary,
      totalCost: codeReviews.totalCost,
      executionTimeMs: codeReviews.executionTimeMs,
      createdAt: codeReviews.createdAt,
      completedAt: codeReviews.completedAt,
    })
    .from(codeReviews)
    .innerJoin(pullRequests, eq(codeReviews.pullRequestId, pullRequests.id))
    .innerJoin(githubRepositories, eq(pullRequests.repositoryId, githubRepositories.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(sortDirection(sortColumn))
    .limit(limit)
    .offset(offset);

  // Get total count for pagination
  const [{ total }] = await db
    .select({ total: count() })
    .from(codeReviews)
    .innerJoin(pullRequests, eq(codeReviews.pullRequestId, pullRequests.id))
    .innerJoin(githubRepositories, eq(pullRequests.repositoryId, githubRepositories.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  // Calculate aggregates
  const [aggregates] = await db
    .select({
      totalReviews: count(),
      totalCost: sum(codeReviews.totalCost),
      avgIssues: avg(sql`COALESCE((${codeReviews.summary}->>'issuesFound')::int, 0)`),
      avgScore: avg(sql`COALESCE((${codeReviews.summary}->>'overallScore')::float, 0)`),
    })
    .from(codeReviews)
    .innerJoin(pullRequests, eq(codeReviews.pullRequestId, pullRequests.id))
    .innerJoin(githubRepositories, eq(pullRequests.repositoryId, githubRepositories.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return {
    reviews: reviews as ReviewHistoryItem[],
    pagination: {
      page,
      limit,
      total: Number(total),
      totalPages: Math.ceil(Number(total) / limit),
    },
    aggregates: {
      totalReviews: Number(aggregates.totalReviews) || 0,
      totalCost: Number(aggregates.totalCost) || 0,
      avgIssues: Number(aggregates.avgIssues) || 0,
      avgScore: Number(aggregates.avgScore) || 0,
    },
  };
}

/**
 * Get full review details with all comments
 */
export async function getReviewDetails(reviewId: string): Promise<ReviewDetailResponse | null> {
  // Fetch review with PR and repository details
  const [review] = await db
    .select({
      id: codeReviews.id,
      prNumber: pullRequests.prNumber,
      prTitle: pullRequests.title,
      prDescription: pullRequests.description,
      repositoryName: githubRepositories.name,
      repositoryFullName: githubRepositories.fullName,
      author: pullRequests.author,
      authorAvatarUrl: pullRequests.authorAvatarUrl,
      status: codeReviews.status,
      summary: codeReviews.summary,
      keyChanges: codeReviews.keyChanges,
      recommendations: codeReviews.recommendations,
      positives: codeReviews.positives,
      modelsUsed: codeReviews.modelsUsed,
      totalCost: codeReviews.totalCost,
      totalTokensInput: codeReviews.totalTokensInput,
      totalTokensOutput: codeReviews.totalTokensOutput,
      executionTimeMs: codeReviews.executionTimeMs,
      createdAt: codeReviews.createdAt,
      startedAt: codeReviews.startedAt,
      completedAt: codeReviews.completedAt,
      // PR details
      prHtmlUrl: pullRequests.htmlUrl,
      prDiffUrl: pullRequests.diffUrl,
      prPatchUrl: pullRequests.patchUrl,
      prBaseBranch: pullRequests.baseBranch,
      prHeadBranch: pullRequests.headBranch,
      prFilesChanged: pullRequests.filesChanged,
      prAdditions: pullRequests.additions,
      prDeletions: pullRequests.deletions,
      prStatus: pullRequests.status,
      prIsDraft: pullRequests.isDraft,
    })
    .from(codeReviews)
    .innerJoin(pullRequests, eq(codeReviews.pullRequestId, pullRequests.id))
    .innerJoin(githubRepositories, eq(pullRequests.repositoryId, githubRepositories.id))
    .where(eq(codeReviews.id, reviewId));

  if (!review) {
    return null;
  }

  // Fetch all comments for this review
  const comments = await db
    .select({
      id: reviewComments.id,
      filePath: reviewComments.filePath,
      startLine: reviewComments.startLine,
      endLine: reviewComments.endLine,
      severity: reviewComments.severity,
      category: reviewComments.category,
      title: reviewComments.title,
      message: reviewComments.message,
      suggestion: reviewComments.suggestion,
      codeSnippet: reviewComments.codeSnippet,
      confidence: reviewComments.confidence,
      isResolved: reviewComments.isResolved,
      createdAt: reviewComments.createdAt,
    })
    .from(reviewComments)
    .where(eq(reviewComments.reviewId, reviewId))
    .orderBy(desc(reviewComments.severity), asc(reviewComments.filePath));

  return {
    review: {
      id: review.id,
      prNumber: review.prNumber,
      prTitle: review.prTitle,
      prDescription: review.prDescription,
      repositoryName: review.repositoryName,
      repositoryFullName: review.repositoryFullName,
      author: review.author,
      authorAvatarUrl: review.authorAvatarUrl,
      status: review.status,
      summary: review.summary,
      keyChanges: review.keyChanges,
      recommendations: review.recommendations,
      positives: review.positives,
      modelsUsed: review.modelsUsed,
      totalCost: review.totalCost || 0,
      totalTokensInput: review.totalTokensInput || 0,
      totalTokensOutput: review.totalTokensOutput || 0,
      executionTimeMs: review.executionTimeMs,
      createdAt: review.createdAt,
      startedAt: review.startedAt,
      completedAt: review.completedAt,
    },
    comments: comments.map((c) => ({
      ...c,
      isResolved: c.isResolved || false,
    })),
    prDetails: {
      htmlUrl: review.prHtmlUrl,
      diffUrl: review.prDiffUrl,
      patchUrl: review.prPatchUrl,
      baseBranch: review.prBaseBranch,
      headBranch: review.prHeadBranch,
      filesChanged: review.prFilesChanged || 0,
      additions: review.prAdditions || 0,
      deletions: review.prDeletions || 0,
      status: review.prStatus,
      isDraft: review.prIsDraft || false,
    },
  };
}

// ============================================================================
// COST ANALYTICS QUERIES
// ============================================================================

/**
 * Get cost summary for a time range and scope
 */
export async function getCostSummary(
  dateFrom?: Date,
  dateTo?: Date,
  scope?: { type: "repository" | "installation"; id: string }
): Promise<CostSummary> {
  const conditions = [];
  
  if (dateFrom) {
    conditions.push(gte(codeReviews.completedAt, dateFrom));
  }
  
  if (dateTo) {
    conditions.push(lte(codeReviews.completedAt, dateTo));
  }
  
  if (scope?.type === "repository") {
    conditions.push(eq(githubRepositories.id, scope.id));
  }

  const [result] = await db
    .select({
      totalCost: sum(codeReviews.totalCost),
      reviewCount: count(),
      flashCost: sum(
        sql`COALESCE((
          SELECT SUM((model->>'cost')::float)
          FROM json_array_elements(${codeReviews.modelsUsed}) AS model
          WHERE model->>'tier' = 'flash'
        ), 0)`
      ),
      proCost: sum(
        sql`COALESCE((
          SELECT SUM((model->>'cost')::float)
          FROM json_array_elements(${codeReviews.modelsUsed}) AS model
          WHERE model->>'tier' = 'pro'
        ), 0)`
      ),
      thinkingCost: sum(
        sql`COALESCE((
          SELECT SUM((model->>'cost')::float)
          FROM json_array_elements(${codeReviews.modelsUsed}) AS model
          WHERE model->>'tier' = 'thinking'
        ), 0)`
      ),
    })
    .from(codeReviews)
    .innerJoin(pullRequests, eq(codeReviews.pullRequestId, pullRequests.id))
    .innerJoin(githubRepositories, eq(pullRequests.repositoryId, githubRepositories.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const totalCost = Number(result.totalCost) || 0;
  const reviewCount = Number(result.reviewCount) || 0;

  return {
    totalCost,
    reviewCount,
    avgCostPerReview: reviewCount > 0 ? totalCost / reviewCount : 0,
    modelBreakdown: {
      flash: Number(result.flashCost) || 0,
      pro: Number(result.proCost) || 0,
      thinking: Number(result.thinkingCost) || 0,
    },
  };
}

/**
 * Get cost breakdown by repository
 */
export async function getCostByRepository(
  dateFrom?: Date,
  dateTo?: Date,
  limit: number = 10
): Promise<CostByRepository[]> {
  const conditions = [];
  
  if (dateFrom) {
    conditions.push(gte(codeReviews.completedAt, dateFrom));
  }
  
  if (dateTo) {
    conditions.push(lte(codeReviews.completedAt, dateTo));
  }

  const results = await db
    .select({
      repoName: githubRepositories.name,
      repoFullName: githubRepositories.fullName,
      totalCost: sum(codeReviews.totalCost),
      reviewCount: count(),
    })
    .from(codeReviews)
    .innerJoin(pullRequests, eq(codeReviews.pullRequestId, pullRequests.id))
    .innerJoin(githubRepositories, eq(pullRequests.repositoryId, githubRepositories.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(githubRepositories.id, githubRepositories.name, githubRepositories.fullName)
    .orderBy(desc(sum(codeReviews.totalCost)))
    .limit(limit);

  return results.map((r) => ({
    repoName: r.repoName,
    repoFullName: r.repoFullName,
    totalCost: Number(r.totalCost) || 0,
    reviewCount: Number(r.reviewCount) || 0,
    avgCost: Number(r.reviewCount) > 0 ? Number(r.totalCost) / Number(r.reviewCount) : 0,
  }));
}

/**
 * Get cost trends over time
 */
export async function getCostTrends(
  dateFrom: Date,
  dateTo: Date,
  granularity: "daily" | "weekly" | "monthly"
): Promise<CostTrendDataPoint[]> {
  // Determine date truncation based on granularity
  const dateTrunc = {
    daily: "day",
    weekly: "week",
    monthly: "month",
  }[granularity];

  const results = await db
    .select({
      period: sql<string>`date_trunc(${dateTrunc}, ${codeReviews.completedAt})`,
      totalCost: sum(codeReviews.totalCost),
      reviewCount: count(),
      flashCost: sum(
        sql`COALESCE((
          SELECT SUM((model->>'cost')::float)
          FROM json_array_elements(${codeReviews.modelsUsed}) AS model
          WHERE model->>'tier' = 'flash'
        ), 0)`
      ),
      proCost: sum(
        sql`COALESCE((
          SELECT SUM((model->>'cost')::float)
          FROM json_array_elements(${codeReviews.modelsUsed}) AS model
          WHERE model->>'tier' = 'pro'
        ), 0)`
      ),
      thinkingCost: sum(
        sql`COALESCE((
          SELECT SUM((model->>'cost')::float)
          FROM json_array_elements(${codeReviews.modelsUsed}) AS model
          WHERE model->>'tier' = 'thinking'
        ), 0)`
      ),
    })
    .from(codeReviews)
    .where(and(
      gte(codeReviews.completedAt, dateFrom),
      lte(codeReviews.completedAt, dateTo)
    ))
    .groupBy(sql`date_trunc(${dateTrunc}, ${codeReviews.completedAt})`)
    .orderBy(asc(sql`date_trunc(${dateTrunc}, ${codeReviews.completedAt})`));

  return results.map((r) => {
    const totalCost = Number(r.totalCost) || 0;
    const reviewCount = Number(r.reviewCount) || 0;
    
    return {
      period: r.period,
      totalCost,
      reviewCount,
      avgCostPerReview: reviewCount > 0 ? totalCost / reviewCount : 0,
      modelBreakdown: {
        flash: Number(r.flashCost) || 0,
        pro: Number(r.proCost) || 0,
        thinking: Number(r.thinkingCost) || 0,
      },
    };
  });
}

/**
 * Get cost projections based on historical trends
 */
export async function getCostProjections(
  period: "week" | "month"
): Promise<{
  currentPeriod: { cost: number; reviews: number };
  projection: { cost: number; reviews: number };
  trend: "increasing" | "stable" | "decreasing";
}> {
  // Calculate start of current period
  const now = new Date();
  const periodStart = period === "week" ? startOfWeek(now) : startOfMonth(now);
  
  // Calculate start of previous period (for comparison)
  const prevPeriodStart = period === "week" 
    ? startOfWeek(subWeeks(now, 1))
    : startOfMonth(subMonths(now, 1));

  // Get current period data
  const [currentData] = await db
    .select({
      totalCost: sum(codeReviews.totalCost),
      reviewCount: count(),
    })
    .from(codeReviews)
    .where(gte(codeReviews.completedAt, periodStart));

  // Get previous period data
  const [prevData] = await db
    .select({
      totalCost: sum(codeReviews.totalCost),
      reviewCount: count(),
    })
    .from(codeReviews)
    .where(and(
      gte(codeReviews.completedAt, prevPeriodStart),
      lte(codeReviews.completedAt, periodStart)
    ));

  const currentCost = Number(currentData.totalCost) || 0;
  const currentReviews = Number(currentData.reviewCount) || 0;
  const prevCost = Number(prevData.totalCost) || 0;
  const prevReviews = Number(prevData.reviewCount) || 0;

  // Simple linear projection: assume same rate for rest of period
  const daysElapsed = Math.floor((now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
  const totalDays = period === "week" ? 7 : 30;
  const remainingDays = totalDays - daysElapsed;
  
  const dailyRate = daysElapsed > 0 ? currentCost / daysElapsed : 0;
  const projectedCost = currentCost + (dailyRate * remainingDays);
  
  const dailyReviewRate = daysElapsed > 0 ? currentReviews / daysElapsed : 0;
  const projectedReviews = Math.round(currentReviews + (dailyReviewRate * remainingDays));

  // Determine trend
  let trend: "increasing" | "stable" | "decreasing" = "stable";
  if (prevCost > 0) {
    const change = (projectedCost - prevCost) / prevCost;
    if (change > 0.1) trend = "increasing";
    else if (change < -0.1) trend = "decreasing";
  }

  return {
    currentPeriod: {
      cost: currentCost,
      reviews: currentReviews,
    },
    projection: {
      cost: projectedCost,
      reviews: projectedReviews,
    },
    trend,
  };
}

// ============================================================================
// TEAM ANALYTICS QUERIES
// ============================================================================

/**
 * Get team/author statistics
 */
export async function getTeamAnalytics(
  dateFrom?: Date,
  dateTo?: Date
): Promise<TeamAuthorStats[]> {
  const conditions = [];
  
  if (dateFrom) {
    conditions.push(gte(codeReviews.completedAt, dateFrom));
  }
  
  if (dateTo) {
    conditions.push(lte(codeReviews.completedAt, dateTo));
  }

  // Get base stats per author
  const authorStats = await db
    .select({
      author: pullRequests.author,
      prCount: count(sql`DISTINCT ${pullRequests.id}`),
      reviewCount: count(codeReviews.id),
      avgIssuesFound: avg(sql`COALESCE((${codeReviews.summary}->>'issuesFound')::int, 0)`),
      avgScore: avg(sql`COALESCE((${codeReviews.summary}->>'overallScore')::float, 0)`),
      totalCost: sum(codeReviews.totalCost),
      totalCritical: sum(sql`COALESCE((${codeReviews.summary}->>'critical')::int, 0)`),
      totalHigh: sum(sql`COALESCE((${codeReviews.summary}->>'high')::int, 0)`),
      totalMedium: sum(sql`COALESCE((${codeReviews.summary}->>'medium')::int, 0)`),
      totalLow: sum(sql`COALESCE((${codeReviews.summary}->>'low')::int, 0)`),
      totalInfo: sum(sql`COALESCE((${codeReviews.summary}->>'info')::int, 0)`),
    })
    .from(pullRequests)
    .innerJoin(codeReviews, eq(pullRequests.id, codeReviews.pullRequestId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(pullRequests.author)
    .orderBy(desc(count(pullRequests.id)));

  // For each author, get category breakdown
  // (This is expensive, but necessary for detailed stats)
  const results: TeamAuthorStats[] = [];

  for (const author of authorStats) {
    // Get category counts for this author
    const [categoryStats] = await db
      .select({
        security: sum(sql`CASE WHEN ${reviewComments.category} = 'security' THEN 1 ELSE 0 END`),
        performance: sum(sql`CASE WHEN ${reviewComments.category} = 'performance' THEN 1 ELSE 0 END`),
        bug: sum(sql`CASE WHEN ${reviewComments.category} = 'bug' THEN 1 ELSE 0 END`),
        code_quality: sum(sql`CASE WHEN ${reviewComments.category} = 'code_quality' THEN 1 ELSE 0 END`),
        best_practice: sum(sql`CASE WHEN ${reviewComments.category} = 'best_practice' THEN 1 ELSE 0 END`),
        documentation: sum(sql`CASE WHEN ${reviewComments.category} = 'documentation' THEN 1 ELSE 0 END`),
        testing: sum(sql`CASE WHEN ${reviewComments.category} = 'testing' THEN 1 ELSE 0 END`),
        accessibility: sum(sql`CASE WHEN ${reviewComments.category} = 'accessibility' THEN 1 ELSE 0 END`),
        maintainability: sum(sql`CASE WHEN ${reviewComments.category} = 'maintainability' THEN 1 ELSE 0 END`),
      })
      .from(reviewComments)
      .innerJoin(codeReviews, eq(reviewComments.reviewId, codeReviews.id))
      .innerJoin(pullRequests, eq(codeReviews.pullRequestId, pullRequests.id))
      .where(
        and(
          eq(pullRequests.author, author.author),
          ...(conditions.length > 0 ? conditions : [])
        )
      );

    results.push({
      author: author.author,
      prCount: Number(author.prCount) || 0,
      reviewCount: Number(author.reviewCount) || 0,
      avgIssuesFound: Number(author.avgIssuesFound) || 0,
      avgScore: Number(author.avgScore) || 0,
      severityBreakdown: {
        critical: Number(author.totalCritical) || 0,
        high: Number(author.totalHigh) || 0,
        medium: Number(author.totalMedium) || 0,
        low: Number(author.totalLow) || 0,
        info: Number(author.totalInfo) || 0,
      },
      categoryBreakdown: {
        security: Number(categoryStats?.security) || 0,
        performance: Number(categoryStats?.performance) || 0,
        bug: Number(categoryStats?.bug) || 0,
        code_quality: Number(categoryStats?.code_quality) || 0,
        best_practice: Number(categoryStats?.best_practice) || 0,
        documentation: Number(categoryStats?.documentation) || 0,
        testing: Number(categoryStats?.testing) || 0,
        accessibility: Number(categoryStats?.accessibility) || 0,
        maintainability: Number(categoryStats?.maintainability) || 0,
      },
      totalCost: Number(author.totalCost) || 0,
    });
  }

  return results;
}

// ============================================================================
// REPOSITORY INSIGHTS QUERIES
// ============================================================================

/**
 * Get comprehensive insights for a repository
 */
export async function getRepositoryInsights(
  repositoryId: string,
  dateFrom?: Date,
  dateTo?: Date
): Promise<RepositoryInsights | null> {
  // Get repository info
  const [repo] = await db
    .select({
      id: githubRepositories.id,
      name: githubRepositories.name,
      fullName: githubRepositories.fullName,
    })
    .from(githubRepositories)
    .where(eq(githubRepositories.id, repositoryId));

  if (!repo) {
    return null;
  }

  const conditions = [eq(pullRequests.repositoryId, repositoryId)];
  
  if (dateFrom) {
    conditions.push(gte(codeReviews.completedAt, dateFrom));
  }
  
  if (dateTo) {
    conditions.push(lte(codeReviews.completedAt, dateTo));
  }

  // Get overview stats
  const [overview] = await db
    .select({
      totalReviews: count(codeReviews.id),
      totalPRs: count(sql`DISTINCT ${pullRequests.id}`),
      avgIssuesPerPR: avg(sql`COALESCE((${codeReviews.summary}->>'issuesFound')::int, 0)`),
      avgScorePerPR: avg(sql`COALESCE((${codeReviews.summary}->>'overallScore')::float, 0)`),
      totalCost: sum(codeReviews.totalCost),
    })
    .from(codeReviews)
    .innerJoin(pullRequests, eq(codeReviews.pullRequestId, pullRequests.id))
    .where(and(...conditions));

  // Get hot files (most reviewed)
  const hotFiles = await db
    .select({
      filePath: reviewComments.filePath,
      reviewCount: count(sql`DISTINCT ${reviewComments.reviewId}`),
      issueCount: count(reviewComments.id),
      avgSeverity: avg(sql`
        CASE ${reviewComments.severity}
          WHEN 'critical' THEN 5
          WHEN 'high' THEN 4
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 2
          WHEN 'info' THEN 1
          ELSE 0
        END
      `),
      lastReviewedAt: sql<Date>`MAX(${codeReviews.completedAt})`,
    })
    .from(reviewComments)
    .innerJoin(codeReviews, eq(reviewComments.reviewId, codeReviews.id))
    .innerJoin(pullRequests, eq(codeReviews.pullRequestId, pullRequests.id))
    .where(and(...conditions))
    .groupBy(reviewComments.filePath)
    .orderBy(desc(count(reviewComments.id)))
    .limit(20);

  // Get review trends (reuse cost trends logic)
  const reviewTrends = await getCostTrends(
    dateFrom || subMonths(new Date(), 3),
    dateTo || new Date(),
    "weekly"
  );

  // Get issue patterns by category
  const categoryPatterns = await db
    .select({
      category: reviewComments.category,
      count: count(),
    })
    .from(reviewComments)
    .innerJoin(codeReviews, eq(reviewComments.reviewId, codeReviews.id))
    .innerJoin(pullRequests, eq(codeReviews.pullRequestId, pullRequests.id))
    .where(and(...conditions))
    .groupBy(reviewComments.category)
    .orderBy(desc(count()));

  const totalIssues = categoryPatterns.reduce((sum, p) => sum + Number(p.count), 0);

  // Get issue patterns by severity
  const severityPatterns = await db
    .select({
      severity: reviewComments.severity,
      count: count(),
    })
    .from(reviewComments)
    .innerJoin(codeReviews, eq(reviewComments.reviewId, codeReviews.id))
    .innerJoin(pullRequests, eq(codeReviews.pullRequestId, pullRequests.id))
    .where(and(...conditions))
    .groupBy(reviewComments.severity)
    .orderBy(desc(count()));

  // Get common issues (most frequent titles)
  const commonIssues = await db
    .select({
      title: reviewComments.title,
      count: count(),
    })
    .from(reviewComments)
    .innerJoin(codeReviews, eq(reviewComments.reviewId, codeReviews.id))
    .innerJoin(pullRequests, eq(codeReviews.pullRequestId, pullRequests.id))
    .where(and(...conditions))
    .groupBy(reviewComments.title)
    .orderBy(desc(count()))
    .limit(10);

  return {
    repository: repo,
    overview: {
      totalReviews: Number(overview.totalReviews) || 0,
      totalPRs: Number(overview.totalPRs) || 0,
      avgIssuesPerPR: Number(overview.avgIssuesPerPR) || 0,
      avgScorePerPR: Number(overview.avgScorePerPR) || 0,
      totalCost: Number(overview.totalCost) || 0,
    },
    hotFiles: hotFiles.map((f) => ({
      filePath: f.filePath,
      reviewCount: Number(f.reviewCount) || 0,
      issueCount: Number(f.issueCount) || 0,
      avgSeverity: Number(f.avgSeverity) || 0,
      lastReviewedAt: f.lastReviewedAt,
    })),
    reviewTrends,
    issuePatterns: {
      byCategory: categoryPatterns.map((p) => ({
        category: p.category,
        count: Number(p.count) || 0,
        percentage: totalIssues > 0 ? (Number(p.count) / totalIssues) * 100 : 0,
      })),
      bySeverity: severityPatterns.map((p) => ({
        severity: p.severity,
        count: Number(p.count) || 0,
        percentage: totalIssues > 0 ? (Number(p.count) / totalIssues) * 100 : 0,
      })),
      commonIssues: commonIssues.map((i) => ({
        title: i.title,
        count: Number(i.count) || 0,
      })),
    },
  };
}
