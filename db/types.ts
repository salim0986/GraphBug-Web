/**
 * Database Types - Type-safe helpers for database operations
 * Generated from Drizzle schema for production-grade type safety
 */

import type { InferSelectModel, InferInsertModel } from "drizzle-orm"
import {
  pullRequests,
  codeReviews,
  reviewComments,
  reviewInsights,
  githubRepositories,
  githubInstallations,
  users,
} from "./schema"

// ============================================================================
// SELECT TYPES - For reading from database
// ============================================================================

export type User = InferSelectModel<typeof users>
export type GitHubInstallation = InferSelectModel<typeof githubInstallations>
export type GitHubRepository = InferSelectModel<typeof githubRepositories>
export type PullRequest = InferSelectModel<typeof pullRequests>
export type CodeReview = InferSelectModel<typeof codeReviews>
export type ReviewComment = InferSelectModel<typeof reviewComments>
export type ReviewInsight = InferSelectModel<typeof reviewInsights>

// ============================================================================
// INSERT TYPES - For creating new records
// ============================================================================

export type NewPullRequest = InferInsertModel<typeof pullRequests>
export type NewCodeReview = InferInsertModel<typeof codeReviews>
export type NewReviewComment = InferInsertModel<typeof reviewComments>
export type NewReviewInsight = InferInsertModel<typeof reviewInsights>

// ============================================================================
// UPDATE TYPES - Partial types for updates
// ============================================================================

export type UpdatePullRequest = Partial<NewPullRequest>
export type UpdateCodeReview = Partial<NewCodeReview>
export type UpdateReviewComment = Partial<NewReviewComment>
export type UpdateReviewInsight = Partial<NewReviewInsight>

// ============================================================================
// ENUM TYPES - String literal types from database enums
// ============================================================================

export type PRStatus = "open" | "closed" | "merged" | "draft"
export type ReviewStatus = "pending" | "in_progress" | "completed" | "failed" | "cancelled"
export type ReviewSeverity = "critical" | "high" | "medium" | "low" | "info"
export type ReviewCategory = 
  | "security"
  | "performance"
  | "bug"
  | "code_quality"
  | "best_practice"
  | "documentation"
  | "testing"
  | "accessibility"
  | "maintainability"
export type ModelTier = "flash" | "pro" | "thinking"

// ============================================================================
// COMPLEX TYPES - Nested JSON structures
// ============================================================================

export type ReviewSummary = {
  overallScore: number
  filesChanged: number
  issuesFound: number
  critical: number
  high: number
  medium: number
  low: number
  info: number
}

export type ModelUsage = {
  model: string
  tier: string
  tokensInput: number
  tokensOutput: number
  cost: number
  taskType: string
}

export type ModelUsageStats = {
  flash: number
  pro: number
  thinking: number
}

// ============================================================================
// JOINED TYPES - Common query result types
// ============================================================================

/**
 * Pull Request with associated repository and installation
 */
export type PullRequestWithRepo = PullRequest & {
  repository: GitHubRepository & {
    installation: GitHubInstallation
  }
}

/**
 * Code Review with associated PR and all comments
 */
export type CodeReviewWithDetails = CodeReview & {
  pullRequest: PullRequestWithRepo
  comments: ReviewComment[]
}

/**
 * Review Comment with associated review and PR
 */
export type ReviewCommentWithContext = ReviewComment & {
  review: CodeReview & {
    pullRequest: PullRequest
  }
}

// ============================================================================
// API RESPONSE TYPES - For API endpoints
// ============================================================================

/**
 * Paginated response wrapper
 */
export type PaginatedResponse<T> = {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

/**
 * API success response
 */
export type SuccessResponse<T = void> = {
  success: true
  data: T
  message?: string
}

/**
 * API error response
 */
export type ErrorResponse = {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

/**
 * Generic API response
 */
export type ApiResponse<T = void> = SuccessResponse<T> | ErrorResponse

// ============================================================================
// QUERY FILTER TYPES - For filtering and sorting
// ============================================================================

export type PRFilters = {
  status?: PRStatus | PRStatus[]
  reviewStatus?: ReviewStatus | ReviewStatus[]
  repositoryId?: string
  author?: string
  dateFrom?: Date
  dateTo?: Date
}

export type ReviewFilters = {
  status?: ReviewStatus | ReviewStatus[]
  pullRequestId?: string
  repositoryId?: string
  minCost?: number
  maxCost?: number
  dateFrom?: Date
  dateTo?: Date
}

export type CommentFilters = {
  reviewId?: string
  severity?: ReviewSeverity | ReviewSeverity[]
  category?: ReviewCategory | ReviewCategory[]
  isResolved?: boolean
  isPosted?: boolean
  filePath?: string
}

export type SortOrder = "asc" | "desc"

export type SortOptions = {
  field: string
  order: SortOrder
}

// ============================================================================
// DASHBOARD TYPES - For analytics and insights
// ============================================================================

export type DashboardStats = {
  totalPRs: number
  reviewedPRs: number
  pendingReviews: number
  avgReviewTime: number
  totalIssuesFound: number
  criticalIssues: number
  totalCost: number
  topCategories: Array<{
    category: ReviewCategory
    count: number
  }>
}

export type RepoAnalytics = {
  repositoryId: string
  repositoryName: string
  totalPRs: number
  avgScore: number
  totalIssues: number
  mostCommonIssues: Array<{
    category: ReviewCategory
    count: number
  }>
  costStats: {
    total: number
    average: number
  }
}

export type TimeSeriesData = {
  date: Date
  value: number
}

export type ReviewTrends = {
  reviewVolume: TimeSeriesData[]
  issueDetection: TimeSeriesData[]
  costTrend: TimeSeriesData[]
  resolutionRate: TimeSeriesData[]
}

// ============================================================================
// WEBHOOK PAYLOAD TYPES - For GitHub webhook handling
// ============================================================================

export type GitHubPRPayload = {
  action: "opened" | "synchronize" | "closed" | "reopened" | "edited"
  number: number
  pull_request: {
    id: number
    number: number
    title: string
    body: string | null
    html_url: string
    diff_url: string
    patch_url: string
    user: {
      login: string
      avatar_url: string
    }
    base: {
      ref: string
      sha: string
      repo: {
        id: number
        name: string
        full_name: string
      }
    }
    head: {
      ref: string
      sha: string
    }
    draft: boolean
    state: "open" | "closed"
    merged: boolean
    merged_at: string | null
    created_at: string
    updated_at: string
    closed_at: string | null
  }
  repository: {
    id: number
    name: string
    full_name: string
  }
  installation: {
    id: number
  }
}

// ============================================================================
// REVIEW REQUEST TYPES - For triggering reviews
// ============================================================================

export type ReviewRequest = {
  pullRequestId: string
  triggerType: "automatic" | "manual" | "scheduled"
  options?: {
    fullReview?: boolean
    focusAreas?: ReviewCategory[]
    maxCost?: number
    modelPreference?: ModelTier
  }
}

export type ReviewResult = {
  reviewId: string
  status: ReviewStatus
  summary: ReviewSummary
  commentsPosted: number
  cost: number
  executionTime: number
}

// ============================================================================
// VALIDATION TYPES - For input validation
// ============================================================================

export type ValidationError = {
  field: string
  message: string
  value?: unknown
}

export type ValidationResult<T> = 
  | { valid: true; data: T }
  | { valid: false; errors: ValidationError[] }

// ============================================================================
// TYPE GUARDS - Runtime type checking
// ============================================================================

export function isPRStatus(value: unknown): value is PRStatus {
  return typeof value === "string" && ["open", "closed", "merged", "draft"].includes(value)
}

export function isReviewStatus(value: unknown): value is ReviewStatus {
  return typeof value === "string" && 
    ["pending", "in_progress", "completed", "failed", "cancelled"].includes(value)
}

export function isReviewSeverity(value: unknown): value is ReviewSeverity {
  return typeof value === "string" && 
    ["critical", "high", "medium", "low", "info"].includes(value)
}

export function isReviewCategory(value: unknown): value is ReviewCategory {
  const categories: ReviewCategory[] = [
    "security", "performance", "bug", "code_quality", "best_practice",
    "documentation", "testing", "accessibility", "maintainability"
  ]
  return typeof value === "string" && categories.includes(value as ReviewCategory)
}

export function isModelTier(value: unknown): value is ModelTier {
  return typeof value === "string" && ["flash", "pro", "thinking"].includes(value)
}
