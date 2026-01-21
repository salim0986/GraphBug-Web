/**
 * Validation Schemas for GraphBug Frontend
 * 
 * Provides Zod schemas for input validation to prevent
 * injection attacks and malformed data
 */

import { z } from 'zod'

// GitHub identifier patterns
const GITHUB_USERNAME_PATTERN = /^[a-zA-Z0-9-]+$/
const GITHUB_REPO_PATTERN = /^[a-zA-Z0-9._-]+$/
const GITHUB_SHA_PATTERN = /^[a-fA-F0-9]{7,40}$/

/**
 * GitHub repository identifier schema
 */
export const GitHubRepoSchema = z.object({
  owner: z
    .string()
    .min(1, "Owner is required")
    .max(100, "Owner name too long")
    .regex(GITHUB_USERNAME_PATTERN, "Invalid owner name format"),
  repo: z
    .string()
    .min(1, "Repository name is required")
    .max(100, "Repository name too long")
    .regex(GITHUB_REPO_PATTERN, "Invalid repository name format"),
})

/**
 * Pull request number schema
 */
export const PRNumberSchema = z.object({
  prNumber: z
    .number()
    .int("PR number must be an integer")
    .positive("PR number must be positive")
    .max(999999, "Invalid PR number"),
})

/**
 * Combined PR processing schema
 */
export const ProcessPRSchema = GitHubRepoSchema.merge(PRNumberSchema).extend({
  installationId: z
    .string()
    .regex(/^\d+$/, "Invalid installation ID")
    .max(20, "Installation ID too long"),
})

/**
 * Repository ingestion schema
 */
export const IngestRepoSchema = z.object({
  repoUrl: z
    .string()
    .url("Invalid repository URL")
    .regex(/^https:\/\/github\.com\/[\w-]+\/[\w.-]+(\.git)?$/, "Must be a valid GitHub URL")
    .max(500, "URL too long"),
  repoId: z
    .string()
    .min(1)
    .max(200, "Repository ID too long")
    .regex(/^[a-zA-Z0-9_-]+$/, "Invalid repository ID format"),
  installationId: z
    .string()
    .regex(/^\d+$/, "Invalid installation ID")
    .max(20, "Installation ID too long"),
  incremental: z.boolean().optional(),
  lastCommit: z
    .string()
    .regex(GITHUB_SHA_PATTERN, "Invalid commit SHA")
    .optional(),
})

/**
 * Webhook payload schema
 */
export const WebhookPayloadSchema = z.object({
  action: z.string(),
  installation: z.object({
    id: z.number(),
  }),
  repository: z.object({
    full_name: z.string(),
    name: z.string(),
    owner: z.object({
      login: z.string(),
    }),
  }),
  pull_request: z.object({
    number: z.number(),
    title: z.string(),
    body: z.string().nullable(),
    merged: z.boolean().optional(),
    head: z.object({
      sha: z.string(),
      ref: z.string(),
    }),
    base: z.object({
      sha: z.string(),
      ref: z.string(),
    }),
  }).optional(),
})

/**
 * File path schema with security validation
 */
export const FilePathSchema = z
  .string()
  .min(1, "File path is required")
  .max(500, "File path too long")
  .refine(
    (path) => !path.includes('\0'),
    "Invalid file path: null byte detected"
  )
  .refine(
    (path) => !path.startsWith('..') && !path.includes('/..') && !path.includes('\\..'),
    "Invalid file path: parent directory reference"
  )

/**
 * Code diff schema
 */
export const CodeDiffSchema = z.object({
  oldCode: z.string().max(100000, "Code snippet too large"),
  newCode: z.string().max(100000, "Code snippet too large"),
  filePath: FilePathSchema,
  language: z.string().max(50),
})

/**
 * Search query schema
 */
export const SearchQuerySchema = z.object({
  repoId: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-zA-Z0-9_-]+$/),
  query: z
    .string()
    .min(1, "Query is required")
    .max(1000, "Query too long"),
  limit: z.number().int().positive().max(100).optional(),
})

/**
 * Analytics date range schema
 */
export const DateRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
}).refine(
  (data) => new Date(data.startDate) <= new Date(data.endDate),
  "Start date must be before end date"
)

/**
 * Installation ID schema
 */
export const InstallationIdSchema = z
  .string()
  .regex(/^\d+$/, "Invalid installation ID")
  .max(20, "Installation ID too long")

/**
 * Repository ID schema
 */
export const RepoIdSchema = z
  .string()
  .min(1, "Repository ID is required")
  .max(200, "Repository ID too long")
  .regex(/^[a-zA-Z0-9_-]+$/, "Invalid repository ID format")

/**
 * Commit SHA schema
 */
export const CommitSHASchema = z
  .string()
  .regex(GITHUB_SHA_PATTERN, "Invalid commit SHA format")

/**
 * Helper function to safely validate and parse data
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`,
      }
    }
    return { success: false, error: 'Validation failed' }
  }
}

/**
 * Helper to safely parse with default
 */
export function validateOrDefault<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  defaultValue: T
): T {
  try {
    return schema.parse(data)
  } catch {
    return defaultValue
  }
}
