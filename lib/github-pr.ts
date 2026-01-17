/**
 * GitHub API Client - Production-grade PR data fetching
 * Handles authentication, rate limiting, retries, and pagination
 */

import { Octokit } from "@octokit/rest"
import { createAppAuth } from "@octokit/auth-app"
import { throttling } from "@octokit/plugin-throttling"
import { retry } from "@octokit/plugin-retry"

// Extend Octokit with plugins
const OctokitWithPlugins = Octokit.plugin(throttling, retry)

// Types
export interface GitHubFile {
  filename: string
  status: "added" | "removed" | "modified" | "renamed"
  additions: number
  deletions: number
  changes: number
  patch?: string
  previous_filename?: string
  blob_url: string
  raw_url: string
  contents_url: string
  sha: string | null
}

export interface GitHubPRDetails {
  number: number
  id: number
  title: string
  body: string | null
  state: "open" | "closed"
  draft: boolean
  merged: boolean
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
      private: boolean
    }
  }
  head: {
    ref: string
    sha: string
  }
  created_at: string
  updated_at: string
  closed_at: string | null
  merged_at: string | null
  files_changed: number
  additions: number
  deletions: number
  changed_files: number
  commits: number
}

export interface GitHubDiff {
  diff: string
  files: GitHubFile[]
  stats: {
    total_files: number
    total_additions: number
    total_deletions: number
    total_changes: number
  }
}

export interface GitHubFileContent {
  filename: string
  content: string
  encoding: string
  sha: string
  size: number
  language?: string
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: Date
  used: number
}

/**
 * GitHub API Client with advanced features
 */
export class GitHubAPIClient {
  private octokit: InstanceType<typeof OctokitWithPlugins>
  private installationId: number
  private rateLimitWarningThreshold = 100 // Warn when remaining < 100

  constructor(installationId: number) {
    this.installationId = installationId

    if (!process.env.NEXT_PUBLIC_GITHUB_APP_ID) {
      throw new Error("NEXT_PUBLIC_GITHUB_APP_ID is not set")
    }

    if (!process.env.GITHUB_PRIVATE_KEY) {
      throw new Error("GITHUB_PRIVATE_KEY is not set")
    }

    // Initialize Octokit with authentication and plugins
    this.octokit = new OctokitWithPlugins({
      authStrategy: createAppAuth,
      auth: {
        appId: process.env.NEXT_PUBLIC_GITHUB_APP_ID,
        privateKey: process.env.GITHUB_PRIVATE_KEY,
        installationId: installationId.toString(),
      },
      throttle: {
        onRateLimit: (retryAfter, options, octokit, retryCount) => {
          console.warn(
            `Rate limit hit for ${options.method} ${options.url}. Retry #${retryCount} after ${retryAfter}s`
          )

          // Retry twice
          if (retryCount < 2) {
            return true
          }

          return false
        },
        onSecondaryRateLimit: (retryAfter, options, octokit, retryCount) => {
          console.warn(
            `Secondary rate limit hit for ${options.method} ${options.url}. Retry #${retryCount} after ${retryAfter}s`
          )

          // Retry once for secondary rate limits
          if (retryCount < 1) {
            return true
          }

          return false
        },
      },
      retry: {
        doNotRetry: [400, 401, 403, 404, 422], // Don't retry client errors
      },
    })
  }

  /**
   * Get current rate limit status
   */
  async getRateLimit(): Promise<RateLimitInfo> {
    const { data } = await this.octokit.rateLimit.get()

    return {
      limit: data.rate.limit,
      remaining: data.rate.remaining,
      reset: new Date(data.rate.reset * 1000),
      used: data.rate.used,
    }
  }

  /**
   * Check rate limit and log warning if low
   */
  private async checkRateLimit(): Promise<void> {
    try {
      const rateLimit = await this.getRateLimit()

      if (rateLimit.remaining < this.rateLimitWarningThreshold) {
        console.warn(
          `⚠️ GitHub API rate limit low: ${rateLimit.remaining}/${rateLimit.limit} remaining. Resets at ${rateLimit.reset.toISOString()}`
        )
      }
    } catch (error) {
      console.error("Failed to check rate limit:", error)
    }
  }

  /**
   * Get pull request details
   */
  async getPullRequest(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<GitHubPRDetails> {
    await this.checkRateLimit()

    const { data } = await this.octokit.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    })

    return {
      number: data.number,
      id: data.id,
      title: data.title,
      body: data.body,
      state: data.state as "open" | "closed",
      draft: data.draft || false,
      merged: data.merged || false,
      html_url: data.html_url,
      diff_url: data.diff_url,
      patch_url: data.patch_url,
      user: {
        login: data.user?.login || "unknown",
        avatar_url: data.user?.avatar_url || "",
      },
      base: {
        ref: data.base.ref,
        sha: data.base.sha,
        repo: {
          id: data.base.repo.id,
          name: data.base.repo.name,
          full_name: data.base.repo.full_name,
          private: data.base.repo.private,
        },
      },
      head: {
        ref: data.head.ref,
        sha: data.head.sha,
      },
      created_at: data.created_at,
      updated_at: data.updated_at,
      closed_at: data.closed_at,
      merged_at: data.merged_at,
      files_changed: data.changed_files,
      additions: data.additions,
      deletions: data.deletions,
      changed_files: data.changed_files,
      commits: data.commits,
    }
  }

  /**
   * Get list of files changed in a PR with pagination support
   */
  async getPRFiles(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<GitHubFile[]> {
    await this.checkRateLimit()

    const files: GitHubFile[] = []
    let page = 1
    const per_page = 100 // Max allowed by GitHub

    while (true) {
      const { data } = await this.octokit.pulls.listFiles({
        owner,
        repo,
        pull_number: prNumber,
        per_page,
        page,
      })

      if (data.length === 0) break

      files.push(
        ...data.map((file) => ({
          filename: file.filename,
          status: file.status as "added" | "removed" | "modified" | "renamed",
          additions: file.additions,
          deletions: file.deletions,
          changes: file.changes,
          patch: file.patch,
          previous_filename: file.previous_filename,
          blob_url: file.blob_url,
          raw_url: file.raw_url,
          contents_url: file.contents_url,
          sha: file.sha,
        }))
      )

      // If we got less than per_page, we've reached the end
      if (data.length < per_page) break

      page++
    }

    console.log(`📄 Fetched ${files.length} files for PR #${prNumber}`)
    return files
  }

  /**
   * Get the full diff for a PR
   */
  async getPRDiff(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<GitHubDiff> {
    await this.checkRateLimit()

    // Fetch files and diff separately for better reliability
    const files = await this.getPRFiles(owner, repo, prNumber)

    // Get the actual diff content
    const { data: diffData } = await this.octokit.request(
      "GET /repos/{owner}/{repo}/pulls/{pull_number}",
      {
        owner,
        repo,
        pull_number: prNumber,
        headers: {
          accept: "application/vnd.github.v3.diff",
        },
      }
    )

    const diff = typeof diffData === "string" ? diffData : ""

    const stats = {
      total_files: files.length,
      total_additions: files.reduce((sum, f) => sum + f.additions, 0),
      total_deletions: files.reduce((sum, f) => sum + f.deletions, 0),
      total_changes: files.reduce((sum, f) => sum + f.changes, 0),
    }

    return {
      diff,
      files,
      stats,
    }
  }

  /**
   * Get file content at a specific commit
   */
  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    ref: string
  ): Promise<GitHubFileContent> {
    await this.checkRateLimit()

    const { data } = await this.octokit.repos.getContent({
      owner,
      repo,
      path,
      ref,
    })

    if (Array.isArray(data) || data.type !== "file") {
      throw new Error(`${path} is not a file`)
    }

    // Decode base64 content
    const content = Buffer.from(data.content, "base64").toString("utf-8")

    return {
      filename: data.name,
      content,
      encoding: data.encoding,
      sha: data.sha,
      size: data.size,
    }
  }

  /**
   * Get multiple file contents in parallel
   */
  async getFileContents(
    owner: string,
    repo: string,
    files: Array<{ path: string; ref: string }>
  ): Promise<GitHubFileContent[]> {
    // Batch requests to avoid overwhelming the API
    const batchSize = 10
    const results: GitHubFileContent[] = []

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize)
      const batchResults = await Promise.allSettled(
        batch.map((file) =>
          this.getFileContent(owner, repo, file.path, file.ref)
        )
      )

      for (const result of batchResults) {
        if (result.status === "fulfilled") {
          results.push(result.value)
        } else {
          console.error("Failed to fetch file content:", result.reason)
        }
      }

      // Small delay between batches to be respectful
      if (i + batchSize < files.length) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    return results
  }

  /**
   * Get commit messages for a PR
   */
  async getPRCommits(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<Array<{ sha: string; message: string; author: string; date: string }>> {
    await this.checkRateLimit()

    const commits: Array<{ sha: string; message: string; author: string; date: string }> = []
    let page = 1
    const per_page = 100

    while (true) {
      const { data } = await this.octokit.pulls.listCommits({
        owner,
        repo,
        pull_number: prNumber,
        per_page,
        page,
      })

      if (data.length === 0) break

      commits.push(
        ...data.map((commit) => ({
          sha: commit.sha,
          message: commit.commit.message,
          author: commit.commit.author?.name || "unknown",
          date: commit.commit.author?.date || "",
        }))
      )

      if (data.length < per_page) break
      page++
    }

    return commits
  }

  /**
   * Post a comment on a PR
   */
  async postPRComment(
    owner: string,
    repo: string,
    prNumber: number,
    body: string
  ): Promise<{ id: number; html_url: string }> {
    await this.checkRateLimit()

    const { data } = await this.octokit.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body,
    })

    return {
      id: data.id,
      html_url: data.html_url,
    }
  }

  /**
   * Post an inline comment on specific lines
   */
  async postPRReviewComment(
    owner: string,
    repo: string,
    prNumber: number,
    commit_id: string,
    path: string,
    body: string,
    line: number,
    side: "LEFT" | "RIGHT" = "RIGHT"
  ): Promise<{ id: number; html_url: string }> {
    await this.checkRateLimit()

    const { data } = await this.octokit.pulls.createReviewComment({
      owner,
      repo,
      pull_number: prNumber,
      commit_id,
      path,
      body,
      line,
      side,
    })

    return {
      id: data.id,
      html_url: data.html_url,
    }
  }

  /**
   * Submit a complete review with multiple comments
   */
  async submitPRReview(
    owner: string,
    repo: string,
    prNumber: number,
    commit_id: string,
    body: string,
    event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT",
    comments?: Array<{
      path: string
      line: number
      body: string
      side?: "LEFT" | "RIGHT"
    }>
  ): Promise<{ id: number; html_url: string }> {
    await this.checkRateLimit()

    const { data } = await this.octokit.pulls.createReview({
      owner,
      repo,
      pull_number: prNumber,
      commit_id,
      body,
      event,
      comments: comments?.map((c) => ({
        path: c.path,
        line: c.line,
        body: c.body,
        side: c.side || "RIGHT",
      })),
    })

    return {
      id: data.id,
      html_url: data.html_url,
    }
  }

  /**
   * Update an existing comment
   */
  async updateComment(
    owner: string,
    repo: string,
    commentId: number,
    body: string
  ): Promise<void> {
    await this.checkRateLimit()

    await this.octokit.issues.updateComment({
      owner,
      repo,
      comment_id: commentId,
      body,
    })
  }

  /**
   * Delete a comment
   */
  async deleteComment(
    owner: string,
    repo: string,
    commentId: number
  ): Promise<void> {
    await this.checkRateLimit()

    await this.octokit.issues.deleteComment({
      owner,
      repo,
      comment_id: commentId,
    })
  }
}

/**
 * Create a GitHub API client for an installation
 */
export function createGitHubClient(installationId: number): GitHubAPIClient {
  return new GitHubAPIClient(installationId)
}

/**
 * Parse owner and repo from full repository name
 */
export function parseRepoFullName(fullName: string): { owner: string; repo: string } {
  const [owner, repo] = fullName.split("/")
  if (!owner || !repo) {
    throw new Error(`Invalid repository full name: ${fullName}`)
  }
  return { owner, repo }
}

/**
 * Helper to retry an operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | undefined

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i)
        console.warn(`Retry ${i + 1}/${maxRetries} after ${delay}ms:`, error)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}
