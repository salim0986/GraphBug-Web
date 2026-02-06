/**
 * Database Query Utilities
 * Production-grade helper functions for common database operations
 * Includes error handling, type safety, and optimized queries
 */

import { eq, and, desc, asc, gte, lte, inArray, sql, count, SQL } from "drizzle-orm"
import {
  db,
  pullRequests,
  codeReviews,
  reviewComments,
  reviewInsights,
  githubRepositories,
  githubInstallations,
} from "./schema"
import type {
  PullRequest,
  NewPullRequest,
  UpdatePullRequest,
  CodeReview,
  NewCodeReview,
  UpdateCodeReview,
  ReviewComment,
  NewReviewComment,
  UpdateReviewComment,
  PullRequestWithRepo,
  CodeReviewWithDetails,
  PRFilters,
  ReviewFilters,
  CommentFilters,
  SortOptions,
  PaginatedResponse,
} from "./types"

// Re-export types for convenience
export type { NewPullRequest, UpdatePullRequest, PullRequest, NewCodeReview, UpdateCodeReview, NewReviewComment, UpdateReviewComment }

// ============================================================================
// PULL REQUEST QUERIES
// ============================================================================

/**
 * Create a new pull request record
 */
export async function createPullRequest(data: NewPullRequest): Promise<PullRequest> {
  const [pr] = await db.insert(pullRequests).values(data).returning()
  return pr
}

/**
 * Get repository by full name (owner/repo format)
 */
export async function getRepositoryByFullName(fullName: string) {
  const [repo] = await db
    .select()
    .from(githubRepositories)
    .where(eq(githubRepositories.fullName, fullName))
    .limit(1)
  
  return repo || null
}

/**
 * Get pull request by ID
 */
export async function getPullRequestById(id: string): Promise<PullRequest | null> {
  const [pr] = await db.select().from(pullRequests).where(eq(pullRequests.id, id))
  return pr || null
}

/**
 * Get pull request with repository and installation details
 */
export async function getPullRequestWithRepo(id: string): Promise<PullRequestWithRepo | null> {
  const result = await db
    .select()
    .from(pullRequests)
    .leftJoin(githubRepositories, eq(pullRequests.repositoryId, githubRepositories.id))
    .leftJoin(githubInstallations, eq(githubRepositories.installationId, githubInstallations.id))
    .where(eq(pullRequests.id, id))
    .limit(1)

  if (!result[0] || !result[0].github_repository || !result[0].github_installation) {
    return null
  }

  return {
    ...result[0].pull_request,
    repository: {
      ...result[0].github_repository,
      installation: result[0].github_installation,
    },
  }
}

/**
 * Find pull request by repository and PR number
 */
export async function findPullRequestByNumber(
  repositoryId: string,
  prNumber: number
): Promise<PullRequest | null> {
  const [pr] = await db
    .select()
    .from(pullRequests)
    .where(and(
      eq(pullRequests.repositoryId, repositoryId),
      eq(pullRequests.prNumber, prNumber)
    ))
  return pr || null
}

/**
 * Get pull request by GitHub ID (pr_id field)
 */
export async function getPullRequestByGitHubId(githubId: number): Promise<PullRequest | null> {
  const [pr] = await db
    .select()
    .from(pullRequests)
    .where(eq(pullRequests.prId, githubId))
  return pr || null
}

/**
 * Update pull request
 */
export async function updatePullRequest(
  id: string,
  data: UpdatePullRequest
): Promise<PullRequest> {
  const [updated] = await db
    .update(pullRequests)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(pullRequests.id, id))
    .returning()
  return updated
}

/**
 * List pull requests with filters and pagination
 */
export async function listPullRequests(
  filters: PRFilters = {},
  sort: SortOptions = { field: "createdAt", order: "desc" },
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<PullRequest>> {
  const conditions = []

  if (filters.status) {
    conditions.push(
      Array.isArray(filters.status)
        ? inArray(pullRequests.status, filters.status)
        : eq(pullRequests.status, filters.status)
    )
  }

  if (filters.reviewStatus) {
    conditions.push(
      Array.isArray(filters.reviewStatus)
        ? inArray(pullRequests.reviewStatus, filters.reviewStatus)
        : eq(pullRequests.reviewStatus, filters.reviewStatus)
    )
  }

  if (filters.repositoryId) {
    conditions.push(eq(pullRequests.repositoryId, filters.repositoryId))
  }

  if (filters.author) {
    conditions.push(eq(pullRequests.author, filters.author))
  }

  if (filters.dateFrom) {
    conditions.push(gte(pullRequests.createdAt, filters.dateFrom))
  }

  if (filters.dateTo) {
    conditions.push(lte(pullRequests.createdAt, filters.dateTo))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  // Get total count
  const [{ value: totalItems }] = await db
    .select({ value: count() })
    .from(pullRequests)
    .where(whereClause)

  // Get paginated data
  const offset = (page - 1) * pageSize
  
  // Determine sort column
  let orderBy: SQL<unknown>
  if (sort.field === 'createdAt') {
    orderBy = sort.order === 'desc' ? desc(pullRequests.createdAt) : asc(pullRequests.createdAt)
  } else if (sort.field === 'updatedAt') {
    orderBy = sort.order === 'desc' ? desc(pullRequests.updatedAt) : asc(pullRequests.updatedAt)
  } else if (sort.field === 'prNumber') {
    orderBy = sort.order === 'desc' ? desc(pullRequests.prNumber) : asc(pullRequests.prNumber)
  } else {
    orderBy = desc(pullRequests.createdAt) // Default
  }

  const data = await db
    .select()
    .from(pullRequests)
    .where(whereClause)
    .orderBy(orderBy)
    .limit(pageSize)
    .offset(offset)

  const totalPages = Math.ceil(totalItems / pageSize)

  return {
    data,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  }
}

// ============================================================================
// CODE REVIEW QUERIES
// ============================================================================

/**
 * Create a new code review
 */
export async function createCodeReview(data: NewCodeReview): Promise<CodeReview> {
  const [review] = await db.insert(codeReviews).values(data).returning()
  return review
}

/**
 * Get code review by ID
 */
export async function getCodeReviewById(id: string): Promise<CodeReview | null> {
  const [review] = await db.select().from(codeReviews).where(eq(codeReviews.id, id))
  return review || null
}

/**
 * Get code review with all details (PR and comments)
 */
export async function getCodeReviewWithDetails(id: string): Promise<CodeReviewWithDetails | null> {
  const review = await getCodeReviewById(id)
  if (!review) return null

  const pr = await getPullRequestWithRepo(review.pullRequestId)
  if (!pr) return null

  const comments = await db
    .select()
    .from(reviewComments)
    .where(eq(reviewComments.reviewId, id))
    .orderBy(asc(reviewComments.filePath), asc(reviewComments.startLine))

  return {
    ...review,
    pullRequest: pr,
    comments,
  }
}

/**
 * Get latest review for a pull request
 */
export async function getLatestReviewForPR(pullRequestId: string): Promise<CodeReview | null> {
  const [review] = await db
    .select()
    .from(codeReviews)
    .where(eq(codeReviews.pullRequestId, pullRequestId))
    .orderBy(desc(codeReviews.reviewVersion))
    .limit(1)
  return review || null
}

/**
 * Update code review
 */
export async function updateCodeReview(
  id: string,
  data: UpdateCodeReview
): Promise<CodeReview> {
  const [updated] = await db
    .update(codeReviews)
    .set(data)
    .where(eq(codeReviews.id, id))
    .returning()
  return updated
}

/**
 * List code reviews with filters
 */
export async function listCodeReviews(
  filters: ReviewFilters = {},
  sort: SortOptions = { field: "createdAt", order: "desc" },
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<CodeReview>> {
  const conditions = []

  if (filters.status) {
    conditions.push(
      Array.isArray(filters.status)
        ? inArray(codeReviews.status, filters.status)
        : eq(codeReviews.status, filters.status)
    )
  }

  if (filters.pullRequestId) {
    conditions.push(eq(codeReviews.pullRequestId, filters.pullRequestId))
  }

  if (filters.minCost !== undefined) {
    conditions.push(gte(codeReviews.totalCost, filters.minCost))
  }

  if (filters.maxCost !== undefined) {
    conditions.push(lte(codeReviews.totalCost, filters.maxCost))
  }

  if (filters.dateFrom) {
    conditions.push(gte(codeReviews.createdAt, filters.dateFrom))
  }

  if (filters.dateTo) {
    conditions.push(lte(codeReviews.createdAt, filters.dateTo))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [{ value: totalItems }] = await db
    .select({ value: count() })
    .from(codeReviews)
    .where(whereClause)

  const offset = (page - 1) * pageSize
  
  // Determine sort column
  let orderBy: SQL<unknown>
  if (sort.field === 'createdAt') {
    orderBy = sort.order === 'desc' ? desc(codeReviews.createdAt) : asc(codeReviews.createdAt)
  } else if (sort.field === 'totalCost') {
    orderBy = sort.order === 'desc' ? desc(codeReviews.totalCost) : asc(codeReviews.totalCost)
  } else if (sort.field === 'executionTimeMs') {
    orderBy = sort.order === 'desc' ? desc(codeReviews.executionTimeMs) : asc(codeReviews.executionTimeMs)
  } else {
    orderBy = desc(codeReviews.createdAt) // Default
  }

  const data = await db
    .select()
    .from(codeReviews)
    .where(whereClause)
    .orderBy(orderBy)
    .limit(pageSize)
    .offset(offset)

  const totalPages = Math.ceil(totalItems / pageSize)

  return {
    data,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  }
}

// ============================================================================
// REVIEW COMMENT QUERIES
// ============================================================================

/**
 * Create a new review comment
 */
export async function createReviewComment(data: NewReviewComment): Promise<ReviewComment> {
  const [comment] = await db.insert(reviewComments).values(data).returning()
  return comment
}

/**
 * Create multiple review comments in batch
 */
export async function createReviewCommentsBatch(
  data: NewReviewComment[]
): Promise<ReviewComment[]> {
  if (data.length === 0) return []
  return await db.insert(reviewComments).values(data).returning()
}

/**
 * Get review comment by ID
 */
export async function getReviewCommentById(id: string): Promise<ReviewComment | null> {
  const [comment] = await db
    .select()
    .from(reviewComments)
    .where(eq(reviewComments.id, id))
  return comment || null
}

/**
 * Update review comment
 */
export async function updateReviewComment(
  id: string,
  data: UpdateReviewComment
): Promise<ReviewComment> {
  const [updated] = await db
    .update(reviewComments)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(reviewComments.id, id))
    .returning()
  return updated
}

/**
 * List review comments with filters
 */
export async function listReviewComments(
  filters: CommentFilters = {},
  sort: SortOptions = { field: "createdAt", order: "asc" }
): Promise<ReviewComment[]> {
  const conditions = []

  if (filters.reviewId) {
    conditions.push(eq(reviewComments.reviewId, filters.reviewId))
  }

  if (filters.severity) {
    conditions.push(
      Array.isArray(filters.severity)
        ? inArray(reviewComments.severity, filters.severity)
        : eq(reviewComments.severity, filters.severity)
    )
  }

  if (filters.category) {
    conditions.push(
      Array.isArray(filters.category)
        ? inArray(reviewComments.category, filters.category)
        : eq(reviewComments.category, filters.category)
    )
  }

  if (filters.isResolved !== undefined) {
    conditions.push(eq(reviewComments.isResolved, filters.isResolved))
  }

  if (filters.isPosted !== undefined) {
    conditions.push(eq(reviewComments.isPosted, filters.isPosted))
  }

  if (filters.filePath) {
    conditions.push(eq(reviewComments.filePath, filters.filePath))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  // Determine sort column
  let orderBy: SQL<unknown>
  if (sort.field === 'createdAt') {
    orderBy = sort.order === 'desc' ? desc(reviewComments.createdAt) : asc(reviewComments.createdAt)
  } else if (sort.field === 'severity') {
    orderBy = sort.order === 'desc' ? desc(reviewComments.severity) : asc(reviewComments.severity)
  } else if (sort.field === 'filePath') {
    orderBy = sort.order === 'desc' ? desc(reviewComments.filePath) : asc(reviewComments.filePath)
  } else {
    orderBy = asc(reviewComments.createdAt) // Default
  }

  return await db
    .select()
    .from(reviewComments)
    .where(whereClause)
    .orderBy(orderBy)
}

/**
 * Mark comment as resolved
 */
export async function resolveComment(
  id: string,
  resolvedBy: string
): Promise<ReviewComment> {
  return await updateReviewComment(id, {
    isResolved: true,
    resolvedAt: new Date(),
    resolvedBy,
  })
}

/**
 * Mark comment as posted to GitHub
 */
export async function markCommentAsPosted(
  id: string,
  githubCommentId: number,
  githubCommentUrl: string
): Promise<ReviewComment> {
  return await updateReviewComment(id, {
    isPosted: true,
    githubCommentId,
    githubCommentUrl,
  })
}

// ============================================================================
// ANALYTICS & INSIGHTS QUERIES
// ============================================================================

/**
 * Get review statistics for a repository
 */
export async function getRepositoryStats(repositoryId: string) {
  const prs = await db
    .select()
    .from(pullRequests)
    .where(eq(pullRequests.repositoryId, repositoryId))

  const prIds = prs.map(pr => pr.id)

  if (prIds.length === 0) {
    return {
      totalPRs: 0,
      reviewedPRs: 0,
      pendingReviews: 0,
      totalIssues: 0,
      criticalIssues: 0,
      avgScore: 0,
      totalCost: 0,
    }
  }

  const reviews = await db
    .select()
    .from(codeReviews)
    .where(inArray(codeReviews.pullRequestId, prIds))

  const comments = await db
    .select()
    .from(reviewComments)
    .where(inArray(reviewComments.reviewId, reviews.map(r => r.id)))

  return {
    totalPRs: prs.length,
    reviewedPRs: prs.filter(pr => pr.reviewStatus === "completed").length,
    pendingReviews: prs.filter(pr => pr.reviewStatus === "pending").length,
    totalIssues: comments.length,
    criticalIssues: comments.filter(c => c.severity === "critical").length,
    avgScore: reviews.reduce((sum, r) => sum + (r.summary?.overallScore || 0), 0) / reviews.length || 0,
    totalCost: reviews.reduce((sum, r) => sum + (r.totalCost || 0), 0),
  }
}

/**
 * Get review statistics for a time period
 */
export async function getReviewStatsForPeriod(startDate: Date, endDate: Date) {
  const reviews = await db
    .select()
    .from(codeReviews)
    .where(and(
      gte(codeReviews.createdAt, startDate),
      lte(codeReviews.createdAt, endDate)
    ))

  const completed = reviews.filter(r => r.status === "completed")
  
  return {
    totalReviews: reviews.length,
    completedReviews: completed.length,
    failedReviews: reviews.filter(r => r.status === "failed").length,
    avgExecutionTime: completed.reduce((sum, r) => sum + (r.executionTimeMs || 0), 0) / completed.length || 0,
    totalCost: completed.reduce((sum, r) => sum + (r.totalCost || 0), 0),
    avgCost: completed.reduce((sum, r) => sum + (r.totalCost || 0), 0) / completed.length || 0,
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a PR already has a pending or in-progress review
 */
export async function hasPendingReview(pullRequestId: string): Promise<boolean> {
  const [review] = await db
    .select()
    .from(codeReviews)
    .where(and(
      eq(codeReviews.pullRequestId, pullRequestId),
      inArray(codeReviews.status, ["pending", "in_progress"])
    ))
    .limit(1)
  
  return !!review
}

/**
 * Get total unresolved critical issues for a repository
 */
export async function getCriticalIssuesCount(repositoryId: string): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(reviewComments)
    .leftJoin(codeReviews, eq(reviewComments.reviewId, codeReviews.id))
    .leftJoin(pullRequests, eq(codeReviews.pullRequestId, pullRequests.id))
    .where(and(
      eq(pullRequests.repositoryId, repositoryId),
      eq(reviewComments.severity, "critical"),
      eq(reviewComments.isResolved, false)
    ))

  return result[0]?.count || 0
}

/**
 * Clean up old review data (for maintenance)
 */
export async function cleanupOldReviews(daysToKeep: number = 90): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

  const result = await db
    .delete(codeReviews)
    .where(and(
      lte(codeReviews.createdAt, cutoffDate),
      eq(codeReviews.status, "completed")
    ))
    .returning({ id: codeReviews.id })

  return result.length
}
