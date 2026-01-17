/**
 * PR Processing API Endpoint
 * Handles PR data fetching and storage for code review pipeline
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { GitHubAPIClient } from "@/lib/github-pr"
import { buildPRContext, prepareForAIReview } from "@/lib/pr-context"
import {
  createPullRequest,
  updatePullRequest,
  getPullRequestByGitHubId,
  getRepositoryByFullName,
  type NewPullRequest,
} from "@/db/queries"
import { auth } from "@/auth"

const ProcessPRSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  prNumber: z.number().int().positive(),
  installationId: z.number().int().positive(),
  action: z.enum(["opened", "synchronize", "reopened"]).optional(),
})

export type ProcessPRRequest = z.infer<typeof ProcessPRSchema>

/**
 * POST /api/pr/process
 * Process a pull request: fetch data, build context, store in DB
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication (skip for internal webhook calls)
    const isInternalCall = req.headers.get('x-internal-call') === 'true'
    let userId: string | null = null
    
    if (!isInternalCall) {
      const session = await auth()
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        )
      }
      userId = session.user.id
    }

    // Parse request body
    const body = await req.json()
    const validation = ProcessPRSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: validation.error.format(),
        },
        { status: 400 }
      )
    }

    const { owner, repo, prNumber, installationId, action } = validation.data

    console.log(`🔄 Processing PR #${prNumber} from ${owner}/${repo}`)

    // Initialize GitHub client
    const client = new GitHubAPIClient(installationId)

    // Check rate limit before proceeding
    const rateLimit = await client.getRateLimit()
    if (rateLimit.remaining < 100) {
      const resetTime = typeof rateLimit.reset === 'number' 
        ? new Date(rateLimit.reset * 1000).toISOString()
        : rateLimit.reset.toISOString()
      
      return NextResponse.json(
        {
          error: "Rate limit approaching",
          details: `Only ${rateLimit.remaining} requests remaining. Resets at ${resetTime}`,
        },
        { status: 429 }
      )
    }

    // Build PR context
    console.log("🔨 Building PR context...")
    const context = await buildPRContext(client, owner, repo, prNumber, {
      includeFileContents: true,
      includeCommits: true,
      contextLines: 10,
      maxFilesToFetch: 50,
    })

    // Check if PR already exists in database
    const existingPR = await getPullRequestByGitHubId(context.pr.id)

    let pullRequestId: string

    if (existingPR) {
      console.log(`📝 Updating existing PR record (ID: ${existingPR.id})`)
      
      // Update PR
      const updatedPR = await updatePullRequest(existingPR.id, {
        title: context.pr.title,
        description: context.pr.body || null,
        status: mapGitHubStateToPRStatus(context.pr.state, context.pr.draft),
        headBranch: context.pr.head.ref,
        baseBranch: context.pr.base.ref,
        headCommitSha: context.pr.head.sha,
        filesChanged: context.stats.totalFiles,
        additions: context.stats.totalAdditions,
        deletions: context.stats.totalDeletions,
        totalChanges: context.stats.totalChanges,
        htmlUrl: context.pr.html_url,
        updatedAt: new Date(),
      })

      if (!updatedPR) {
        throw new Error("Failed to update PR record")
      }

      pullRequestId = updatedPR.id
    } else {
      console.log("✨ Creating new PR record")
      
      // Get repository ID (for now using placeholder, will be properly handled in Phase 8)
      const repoId = await getOrCreateRepository(owner, repo, userId)
      
      // Create new PR
      const newPR: NewPullRequest = {
        repositoryId: repoId,
        prId: context.pr.id,
        prNumber: context.pr.number,
        title: context.pr.title,
        description: context.pr.body || null,
        status: mapGitHubStateToPRStatus(context.pr.state, context.pr.draft),
        author: context.pr.user.login,
        authorAvatarUrl: context.pr.user.avatar_url || null,
        headBranch: context.pr.head.ref,
        baseBranch: context.pr.base.ref,
        headCommitSha: context.pr.head.sha,
        filesChanged: context.stats.totalFiles,
        additions: context.stats.totalAdditions,
        deletions: context.stats.totalDeletions,
        totalChanges: context.stats.totalChanges,
        htmlUrl: context.pr.html_url,
      }

      const createdPR = await createPullRequest(newPR)
      pullRequestId = createdPR.id
    }

    // Prepare context for AI review
    const aiContext = prepareForAIReview(context)

    console.log(`✅ PR #${prNumber} processed successfully (DB ID: ${pullRequestId})`)

    return NextResponse.json({
      success: true,
      pullRequestId,
      prNumber,
      status: existingPR ? "updated" : "created",
      context: aiContext,
      stats: {
        files: context.stats.totalFiles,
        changes: context.stats.totalChanges,
        additions: context.stats.totalAdditions,
        deletions: context.stats.totalDeletions,
      },
      complexity: context.complexity.overall,
      metadata: context.metadata,
      rateLimit: {
        remaining: rateLimit.remaining,
        limit: rateLimit.limit,
        reset: typeof rateLimit.reset === 'number'
          ? new Date(rateLimit.reset * 1000).toISOString()
          : rateLimit.reset.toISOString(),
      },
    })
  } catch (error) {
    console.error("❌ Error processing PR:", error)

    return NextResponse.json(
      {
        error: "Failed to process PR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/pr/process?owner=x&repo=y&prNumber=z&installationId=w
 * Get PR processing status and context
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url)
    const owner = searchParams.get("owner")
    const repo = searchParams.get("repo")
    const prNumber = searchParams.get("prNumber")
    const installationId = searchParams.get("installationId")

    if (!owner || !repo || !prNumber || !installationId) {
      return NextResponse.json(
        {
          error: "Missing required parameters",
          required: ["owner", "repo", "prNumber", "installationId"],
        },
        { status: 400 }
      )
    }

    const prNum = parseInt(prNumber, 10)
    const instId = parseInt(installationId, 10)

    if (isNaN(prNum) || isNaN(instId)) {
      return NextResponse.json(
        { error: "Invalid prNumber or installationId" },
        { status: 400 }
      )
    }

    // Initialize GitHub client
    const client = new GitHubAPIClient(instId)

    // Fetch PR from GitHub
    const pr = await client.getPullRequest(owner, repo, prNum)

    // Check if PR exists in database
    const dbPR = await getPullRequestByGitHubId(pr.id)

    if (!dbPR) {
      return NextResponse.json({
        exists: false,
        githubData: {
          number: pr.number,
          title: pr.title,
          state: pr.state,
          draft: pr.draft,
        },
      })
    }

    return NextResponse.json({
      exists: true,
      pullRequest: dbPR,
      githubData: {
        number: pr.number,
        title: pr.title,
        state: pr.state,
        draft: pr.draft,
      },
    })
  } catch (error) {
    console.error("❌ Error fetching PR:", error)

    return NextResponse.json(
      {
        error: "Failed to fetch PR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * Map GitHub PR state to database PR status
 */
function mapGitHubStateToPRStatus(
  state: string,
  draft: boolean
): "open" | "closed" | "merged" | "draft" {
  if (draft) return "draft"
  if (state === "closed") return "closed"
  if (state === "open") return "open"
  return "open"
}

/**
 * Get or create repository record
 */
async function getOrCreateRepository(
  owner: string,
  name: string,
  userId: string | null
): Promise<string> {
  const fullName = `${owner}/${name}`
  
  // Try to find existing repository
  const repo = await getRepositoryByFullName(fullName)
  
  if (repo) {
    console.log(`✅ Found repository: ${fullName} (ID: ${repo.id})`)
    return repo.id
  }
  
  // Repository not found
  console.error(`❌ Repository not found: ${fullName}`)
  console.error(`   Make sure the repository is installed via GitHub App at /dashboard`)
  throw new Error(`Repository ${fullName} not found. Please install the GitHub App on this repository first.`)
}
