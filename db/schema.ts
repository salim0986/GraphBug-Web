import {
  boolean,
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
  bigint,
  real,
  index,
  pgEnum,
  json,
} from "drizzle-orm/pg-core"
import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import type { AdapterAccountType } from "next-auth/adapters"
 
// Note: server-only should be imported in auth.ts and API routes, not here
// to allow drizzle-kit to work properly

const connectionString = process.env.DATABASE_URL!
const pool = postgres(connectionString, { max: 1 })

// ============================================================================
// ENUMS - Define all enum types for type safety
// ============================================================================

export const prStatusEnum = pgEnum("pr_status", [
  "open",
  "closed",
  "merged",
  "draft"
])

export const reviewStatusEnum = pgEnum("review_status", [
  "pending",
  "in_progress",
  "completed",
  "failed",
  "cancelled"
])

export const reviewSeverityEnum = pgEnum("review_severity", [
  "critical",
  "high",
  "medium",
  "low",
  "info"
])

export const reviewCategoryEnum = pgEnum("review_category", [
  "security",
  "performance",
  "bug",
  "code_quality",
  "best_practice",
  "documentation",
  "testing",
  "accessibility",
  "maintainability"
])

export const modelTierEnum = pgEnum("model_tier", [
  "flash",      // Gemini 1.5 Flash - cheap, fast
  "pro",        // Gemini 1.5 Pro - balanced
  "thinking"    // Gemini 2.0 Flash Thinking - advanced reasoning
])

// ============================================================================
// AUTH TABLES - NextAuth.js required tables
// ============================================================================

// Stores user profile information
export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  
})
 
// Links users to their OAuth providers
export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    {
      compoundKey: primaryKey({
        columns: [account.provider, account.providerAccountId],
      }),
    },
  ]
)
 
// Tracks active sessions
export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})
 
// For magic link emails (Resend provider)
export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => [
    {
      compositePk: primaryKey({
        columns: [verificationToken.identifier, verificationToken.token],
      }),
    },
  ]
)
 
export const authenticators = pgTable(
  "authenticator",
  {
    credentialID: text("credentialID").notNull().unique(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: boolean("credentialBackedUp").notNull(),
    transports: text("transports"),
  },
  (authenticator) => [
    {
      compositePK: primaryKey({
        columns: [authenticator.userId, authenticator.credentialID],
      }),
    },
  ]
)

// Track GitHub App installations
export const githubInstallations = pgTable("github_installation", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .references(() => users.id, { onDelete: "cascade" }),
  installationId: integer("installationId").notNull().unique(), // GitHub's installation ID
  accountLogin: text("accountLogin").notNull(), // GitHub username or org name
  accountType: text("accountType").notNull(), // "User" or "Organization"
  targetType: text("targetType").notNull(), // What they installed on
  permissions: text("permissions"), // JSON string of permissions
  repositorySelection: text("repositorySelection"), // "all" or "selected"
  suspended: boolean("suspended").default(false),
  installedAt: timestamp("installedAt", { mode: "date" }).notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull(),
})

// Track individual repositories (if user selects specific repos)
export const githubRepositories = pgTable("github_repository", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  installationId: text("installationId")
    .notNull()
    .references(() => githubInstallations.id, { onDelete: "cascade" }),
  repoId: bigint("repoId", { mode: "number" }).notNull(), // GitHub's repo ID
  name: text("name").notNull(), // repo name
  fullName: text("fullName").notNull(), // owner/repo
  private: boolean("private").notNull(),
  addedAt: timestamp("addedAt", { mode: "date" }).notNull(),
  // Ingestion tracking
  ingestionStatus: text("ingestionStatus").default("pending"), // pending, processing, completed, failed
  ingestionStartedAt: timestamp("ingestionStartedAt", { mode: "date" }),
  ingestionCompletedAt: timestamp("ingestionCompletedAt", { mode: "date" }),
  ingestionError: text("ingestionError"),
  lastSyncedAt: timestamp("lastSyncedAt", { mode: "date" }),
}, (table) => [
  {
    // Prevent duplicate repos in the same installation
    uniqueRepoPerInstallation: { columns: [table.installationId, table.repoId] },
  },
])

// ============================================================================
// CODE REVIEW TABLES
// ============================================================================

/**
 * Pull Requests - Track all PRs for code review
 * Links PRs to repositories and tracks their lifecycle
 */
export const pullRequests = pgTable("pull_request", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  
  // GitHub identifiers
  prNumber: integer("pr_number").notNull(),
  prId: bigint("pr_id", { mode: "number" }).notNull(), // GitHub's PR ID
  
  // Repository reference
  repositoryId: text("repository_id")
    .notNull()
    .references(() => githubRepositories.id, { onDelete: "cascade" }),
  
  // PR metadata
  title: text("title").notNull(),
  description: text("description"),
  author: text("author").notNull(), // GitHub username
  authorAvatarUrl: text("author_avatar_url"),
  
  // URLs and references
  htmlUrl: text("html_url").notNull(),
  diffUrl: text("diff_url"),
  patchUrl: text("patch_url"),
  
  // Branch information
  baseBranch: text("base_branch").notNull(),
  headBranch: text("head_branch").notNull(),
  baseCommitSha: text("base_commit_sha"),
  headCommitSha: text("head_commit_sha").notNull(),
  
  // PR status
  status: prStatusEnum("status").notNull().default("open"),
  isDraft: boolean("is_draft").default(false),
  
  // Statistics
  filesChanged: integer("files_changed").default(0),
  additions: integer("additions").default(0),
  deletions: integer("deletions").default(0),
  totalChanges: integer("total_changes").default(0),
  
  // Review tracking
  reviewStatus: reviewStatusEnum("review_status").notNull().default("pending"),
  reviewRequestedAt: timestamp("review_requested_at", { mode: "date" }),
  reviewStartedAt: timestamp("review_started_at", { mode: "date" }),
  reviewCompletedAt: timestamp("review_completed_at", { mode: "date" }),
  
  // Timestamps
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  closedAt: timestamp("closed_at", { mode: "date" }),
  mergedAt: timestamp("merged_at", { mode: "date" }),
}, (table) => [
  // Indexes for efficient querying
  index("pr_repository_idx").on(table.repositoryId),
  index("pr_status_idx").on(table.status),
  index("pr_review_status_idx").on(table.reviewStatus),
  index("pr_created_at_idx").on(table.createdAt),
  index("pr_author_idx").on(table.author),
  // Unique constraint: one PR number per repository
  index("pr_repo_number_unique_idx").on(table.repositoryId, table.prNumber),
])

/**
 * Code Reviews - Store AI-generated review results
 * Links to PRs and tracks the review execution and results
 */
export const codeReviews = pgTable("code_review", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  
  // PR reference
  pullRequestId: text("pull_request_id")
    .notNull()
    .references(() => pullRequests.id, { onDelete: "cascade" }),
  
  // Review metadata
  reviewVersion: integer("review_version").notNull().default(1), // Allow re-reviews
  triggerType: text("trigger_type").notNull().default("automatic"), // automatic, manual, scheduled
  
  // Review status
  status: reviewStatusEnum("status").notNull().default("pending"),
  
  // Review results - stored as JSON for flexibility
  summary: json("summary").$type<{
    overallScore: number
    filesChanged: number
    issuesFound: number
    critical: number
    high: number
    medium: number
    low: number
    info: number
  }>(),
  
  keyChanges: json("key_changes").$type<string[]>(),
  recommendations: json("recommendations").$type<string[]>(),
  positives: json("positives").$type<string[]>(),
  
  // AI model usage tracking
  primaryModel: modelTierEnum("primary_model"), // Main model used
  modelsUsed: json("models_used").$type<{
    model: string
    tier: string
    tokensInput: number
    tokensOutput: number
    cost: number
    taskType: string
  }[]>(),
  
  // Cost and performance metrics
  totalTokensInput: integer("total_tokens_input").default(0),
  totalTokensOutput: integer("total_tokens_output").default(0),
  totalCost: real("total_cost").default(0), // in USD
  executionTimeMs: integer("execution_time_ms"), // milliseconds
  
  // Workflow tracking
  workflowState: json("workflow_state"), // LangGraph state for debugging
  errorMessage: text("error_message"),
  errorStack: text("error_stack"),
  
  // GitHub comment tracking
  summaryCommentId: integer("summary_comment_id"), // GitHub comment ID
  summaryCommentUrl: text("summary_comment_url"),
  inlineCommentsPosted: integer("inline_comments_posted").default(0),
  
  // Timestamps
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  startedAt: timestamp("started_at", { mode: "date" }),
  completedAt: timestamp("completed_at", { mode: "date" }),
}, (table) => [
  index("review_pr_idx").on(table.pullRequestId),
  index("review_status_idx").on(table.status),
  index("review_created_at_idx").on(table.createdAt),
  index("review_cost_idx").on(table.totalCost),
])

/**
 * Review Comments - Individual code review comments
 * Linked to reviews and specific file locations
 */
export const reviewComments = pgTable("review_comment", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  
  // Review reference
  reviewId: text("review_id")
    .notNull()
    .references(() => codeReviews.id, { onDelete: "cascade" }),
  
  // File and line information
  filePath: text("file_path").notNull(),
  startLine: integer("start_line"),
  endLine: integer("end_line"),
  side: text("side").default("RIGHT"), // LEFT (base) or RIGHT (head) for diff view
  
  // Comment content
  severity: reviewSeverityEnum("severity").notNull(),
  category: reviewCategoryEnum("category").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  suggestion: text("suggestion"), // Suggested fix
  codeSnippet: text("code_snippet"), // Relevant code context
  
  // GitHub integration
  githubCommentId: integer("github_comment_id"), // GitHub comment ID if posted
  githubCommentUrl: text("github_comment_url"),
  isPosted: boolean("is_posted").default(false),
  postAttempts: integer("post_attempts").default(0),
  postError: text("post_error"),
  
  // User interaction
  isResolved: boolean("is_resolved").default(false),
  resolvedAt: timestamp("resolved_at", { mode: "date" }),
  resolvedBy: text("resolved_by"), // GitHub username
  
  // AI metadata
  confidence: real("confidence"), // 0-1 confidence score
  modelUsed: text("model_used"),
  reasoning: text("reasoning"), // Why this issue was flagged
  
  // Timestamps
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
}, (table) => [
  index("comment_review_idx").on(table.reviewId),
  index("comment_severity_idx").on(table.severity),
  index("comment_category_idx").on(table.category),
  index("comment_file_idx").on(table.filePath),
  index("comment_resolved_idx").on(table.isResolved),
  index("comment_posted_idx").on(table.isPosted),
])

/**
 * Review Insights - Aggregated analytics and metrics
 * Time-series data for dashboard analytics
 */
export const reviewInsights = pgTable("review_insight", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  
  // Scope - can be per user, repo, or organization
  scope: text("scope").notNull(), // "user", "repository", "installation"
  scopeId: text("scope_id").notNull(), // ID of user/repo/installation
  
  // Time period
  periodType: text("period_type").notNull(), // "daily", "weekly", "monthly"
  periodStart: timestamp("period_start", { mode: "date" }).notNull(),
  periodEnd: timestamp("period_end", { mode: "date" }).notNull(),
  
  // Review volume metrics
  totalReviews: integer("total_reviews").default(0),
  completedReviews: integer("completed_reviews").default(0),
  failedReviews: integer("failed_reviews").default(0),
  
  // PR metrics
  totalPRs: integer("total_prs").default(0),
  reviewedPRs: integer("reviewed_prs").default(0),
  mergedPRs: integer("merged_prs").default(0),
  
  // Issue detection metrics
  totalIssues: integer("total_issues").default(0),
  criticalIssues: integer("critical_issues").default(0),
  highIssues: integer("high_issues").default(0),
  mediumIssues: integer("medium_issues").default(0),
  lowIssues: integer("low_issues").default(0),
  
  // Issue categories breakdown
  securityIssues: integer("security_issues").default(0),
  performanceIssues: integer("performance_issues").default(0),
  bugIssues: integer("bug_issues").default(0),
  qualityIssues: integer("quality_issues").default(0),
  
  // Resolution metrics
  resolvedIssues: integer("resolved_issues").default(0),
  resolutionRate: real("resolution_rate").default(0), // Percentage
  
  // Performance metrics
  avgReviewTimeMs: integer("avg_review_time_ms"),
  avgIssuesPerPR: real("avg_issues_per_pr"),
  avgScorePerPR: real("avg_score_per_pr"),
  
  // Cost metrics
  totalCost: real("total_cost").default(0),
  avgCostPerReview: real("avg_cost_per_review"),
  
  // Model usage distribution
  modelUsageStats: json("model_usage_stats").$type<{
    flash: number
    pro: number
    thinking: number
  }>(),
  
  // Timestamps
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
}, (table) => [
  index("insight_scope_idx").on(table.scope, table.scopeId),
  index("insight_period_idx").on(table.periodType, table.periodStart),
  index("insight_created_at_idx").on(table.createdAt),
  // Unique constraint: one insight per scope/period
  index("insight_unique_idx").on(table.scope, table.scopeId, table.periodType, table.periodStart),
])

export const db = drizzle(pool, {
  schema: {
    users,
    accounts,
    sessions,
    verificationTokens,
    authenticators,
    githubInstallations,
    githubRepositories,
    pullRequests,
    codeReviews,
    reviewComments,
    reviewInsights,
  },
})