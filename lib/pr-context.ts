/**
 * PR Context Builder - Build comprehensive context for code review
 * Combines PR data, diffs, file contents, and commit information
 */

import type {
  GitHubAPIClient,
  GitHubPRDetails,
  GitHubDiff,
  GitHubFileContent,
} from "./github-pr"
import {
  parseDiff,
  extractChangedLines,
  filterReviewableFiles,
  getContextRange,
  calculateDiffStats,
  calculateDiffComplexity,
  extractAffectedFunctions,
  type ParsedDiff,
  type FileChange,
  type DiffStats,
} from "./diff-parser"

export interface PRContext {
  pr: GitHubPRDetails
  diff: GitHubDiff
  parsedDiffs: ParsedDiff[]
  fileChanges: FileChange[]
  fileContents: Map<string, GitHubFileContent>
  commits: Array<{
    sha: string
    message: string
    author: string
    date: string
  }>
  stats: DiffStats
  complexity: {
    overall: number
    perFile: Record<string, number>
  }
  metadata: {
    languages: string[]
    affectedAreas: string[]
    isLargeChange: boolean
    hasSensitiveFiles: boolean
    requiresDeepReview: boolean
  }
}

export interface ContextBuildOptions {
  includeFileContents?: boolean
  includeCommits?: boolean
  contextLines?: number
  maxFilesToFetch?: number
  skipBinaryFiles?: boolean
  skipGeneratedFiles?: boolean
}

const DEFAULT_OPTIONS: Required<ContextBuildOptions> = {
  includeFileContents: true,
  includeCommits: true,
  contextLines: 10,
  maxFilesToFetch: 50,
  skipBinaryFiles: true,
  skipGeneratedFiles: true,
}

/**
 * Build comprehensive PR context for code review
 */
export async function buildPRContext(
  client: GitHubAPIClient,
  owner: string,
  repo: string,
  prNumber: number,
  options: ContextBuildOptions = {}
): Promise<PRContext> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  console.log(`🔨 Building context for PR #${prNumber}`)

  // 1. Fetch PR details
  console.log("📋 Fetching PR details...")
  const pr = await client.getPullRequest(owner, repo, prNumber)

  // 2. Fetch diff
  console.log("📄 Fetching PR diff...")
  const diff = await client.getPRDiff(owner, repo, prNumber)

  // 3. Parse diff
  console.log("🔍 Parsing diff...")
  const allParsedDiffs = parseDiff(diff.diff)
  
  // Filter reviewable files
  const parsedDiffs = opts.skipGeneratedFiles
    ? filterReviewableFiles(allParsedDiffs)
    : allParsedDiffs.filter((d) => !d.isBinary || !opts.skipBinaryFiles)

  // 4. Extract file changes
  const fileChanges = parsedDiffs.map((d) => {
    const change = extractChangedLines(d)
    change.affectedFunctions = extractAffectedFunctions(d)
    return change
  })

  // 5. Fetch commits if requested
  let commits: Array<{ sha: string; message: string; author: string; date: string }> = []
  if (opts.includeCommits) {
    console.log("📝 Fetching commit history...")
    commits = await client.getPRCommits(owner, repo, prNumber)
  }

  // 6. Fetch file contents if requested
  const fileContents = new Map<string, GitHubFileContent>()
  if (opts.includeFileContents) {
    console.log("📦 Fetching file contents...")
    const filesToFetch = parsedDiffs
      .filter((d) => d.status !== "removed")
      .slice(0, opts.maxFilesToFetch)
      .map((d) => ({
        path: d.filename,
        ref: pr.head.sha,
      }))

    const contents = await client.getFileContents(owner, repo, filesToFetch)
    for (const content of contents) {
      fileContents.set(content.filename, content)
    }
  }

  // 7. Calculate stats
  const stats = calculateDiffStats(parsedDiffs)

  // 8. Calculate complexity
  const complexity = {
    overall: 0,
    perFile: {} as Record<string, number>,
  }

  for (const diff of parsedDiffs) {
    const score = calculateDiffComplexity(diff)
    complexity.perFile[diff.filename] = score
    complexity.overall += score
  }

  complexity.overall = complexity.overall / Math.max(parsedDiffs.length, 1)

  // 9. Extract metadata
  const metadata = extractMetadata(pr, parsedDiffs, stats, complexity.overall)

  console.log(`✅ Context built: ${parsedDiffs.length} files, ${stats.totalChanges} changes`)

  return {
    pr,
    diff,
    parsedDiffs,
    fileChanges,
    fileContents,
    commits,
    stats,
    complexity,
    metadata,
  }
}

/**
 * Extract metadata about the PR
 */
function extractMetadata(
  pr: GitHubPRDetails,
  parsedDiffs: ParsedDiff[],
  stats: DiffStats,
  overallComplexity: number
): PRContext["metadata"] {
  // Get unique languages
  const languages = Array.from(
    new Set(
      parsedDiffs
        .map((d) => {
          const ext = d.filename.split(".").pop()?.toLowerCase()
          return ext || "unknown"
        })
        .filter(Boolean)
    )
  )

  // Determine affected areas based on filenames
  const affectedAreas = new Set<string>()
  for (const diff of parsedDiffs) {
    const path = diff.filename.toLowerCase()

    if (path.includes("api") || path.includes("endpoint")) {
      affectedAreas.add("API")
    }
    if (path.includes("auth") || path.includes("login")) {
      affectedAreas.add("Authentication")
    }
    if (path.includes("db") || path.includes("database") || path.includes("migration")) {
      affectedAreas.add("Database")
    }
    if (path.includes("ui") || path.includes("component") || path.includes("page")) {
      affectedAreas.add("UI")
    }
    if (path.includes("test") || path.includes("spec")) {
      affectedAreas.add("Tests")
    }
    if (path.includes("config") || path.includes(".env")) {
      affectedAreas.add("Configuration")
    }
    if (path.includes("security") || path.includes("crypto")) {
      affectedAreas.add("Security")
    }
    if (path.includes("doc") || path.includes("readme")) {
      affectedAreas.add("Documentation")
    }
  }

  // Check for large changes
  const isLargeChange = stats.totalFiles > 10 || stats.totalChanges > 500

  // Check for sensitive files
  const sensitivePatterns = [
    /auth/i,
    /security/i,
    /crypto/i,
    /password/i,
    /secret/i,
    /token/i,
    /key/i,
    /\.env/i,
    /config/i,
  ]

  const hasSensitiveFiles = parsedDiffs.some((d) =>
    sensitivePatterns.some((p) => p.test(d.filename))
  )

  // Determine if deep review is required
  const requiresDeepReview =
    isLargeChange ||
    hasSensitiveFiles ||
    overallComplexity > 70 ||
    affectedAreas.has("Security") ||
    affectedAreas.has("Authentication") ||
    affectedAreas.has("Database")

  return {
    languages,
    affectedAreas: Array.from(affectedAreas),
    isLargeChange,
    hasSensitiveFiles,
    requiresDeepReview,
  }
}

/**
 * Get focused context for specific files
 * Useful for targeted review of specific changes
 */
export async function getFocusedContext(
  client: GitHubAPIClient,
  owner: string,
  repo: string,
  ref: string,
  filenames: string[]
): Promise<Map<string, GitHubFileContent>> {
  const fileContents = new Map<string, GitHubFileContent>()

  const filesToFetch = filenames.map((path) => ({ path, ref }))
  const contents = await client.getFileContents(owner, repo, filesToFetch)

  for (const content of contents) {
    fileContents.set(content.filename, content)
  }

  return fileContents
}

/**
 * Build context for specific changed lines with surrounding code
 */
export interface LineContext {
  filename: string
  startLine: number
  endLine: number
  content: string
  language?: string
}

export async function getLineContexts(
  client: GitHubAPIClient,
  owner: string,
  repo: string,
  ref: string,
  fileChanges: FileChange[],
  contextSize: number = 10
): Promise<LineContext[]> {
  const contexts: LineContext[] = []

  for (const change of fileChanges) {
    const ranges = getContextRange(change.changedLines, contextSize)

    try {
      const fileContent = await client.getFileContent(
        owner,
        repo,
        change.filename,
        ref
      )

      const lines = fileContent.content.split("\n")

      for (const range of ranges) {
        const contextLines = lines.slice(
          Math.max(0, range.start - 1),
          Math.min(lines.length, range.end)
        )

        contexts.push({
          filename: change.filename,
          startLine: range.start,
          endLine: Math.min(range.end, lines.length),
          content: contextLines.join("\n"),
          language: change.language,
        })
      }
    } catch (error) {
      console.error(`Failed to fetch context for ${change.filename}:`, error)
    }
  }

  return contexts
}

/**
 * Generate a summary of the PR for quick overview
 */
export function generatePRSummary(context: PRContext): string {
  const { pr, stats, metadata } = context

  const parts: string[] = []

  parts.push(`# PR #${pr.number}: ${pr.title}`)
  parts.push("")
  parts.push(`**Author:** ${pr.user.login}`)
  parts.push(`**Status:** ${pr.state}${pr.draft ? " (Draft)" : ""}`)
  parts.push("")
  parts.push("## Changes")
  parts.push(
    `- ${stats.totalFiles} files changed (+${stats.totalAdditions}/-${stats.totalDeletions})`
  )

  if (metadata.affectedAreas.length > 0) {
    parts.push(`- Affected areas: ${metadata.affectedAreas.join(", ")}`)
  }

  if (metadata.languages.length > 0) {
    parts.push(`- Languages: ${metadata.languages.join(", ")}`)
  }

  if (metadata.isLargeChange) {
    parts.push("- ⚠️ Large change detected")
  }

  if (metadata.hasSensitiveFiles) {
    parts.push("- 🔒 Sensitive files modified")
  }

  if (metadata.requiresDeepReview) {
    parts.push("- 🔍 Requires deep review")
  }

  if (pr.body) {
    parts.push("")
    parts.push("## Description")
    parts.push(pr.body)
  }

  if (context.commits.length > 0) {
    parts.push("")
    parts.push("## Commits")
    for (const commit of context.commits.slice(0, 5)) {
      parts.push(`- ${commit.message.split("\n")[0]} (${commit.author})`)
    }
    if (context.commits.length > 5) {
      parts.push(`- ... and ${context.commits.length - 5} more commits`)
    }
  }

  return parts.join("\n")
}

/**
 * Prepare context for AI review
 * Formats the context in a way that's optimal for LLM consumption
 */
export function prepareForAIReview(context: PRContext): {
  title: string
  description: string | null
  base_ref: string
  head_ref: string
  files: Array<{
    filename: string
    status: string
    additions: number
    deletions: number
    patch?: string
    language?: string
  }>
  metadata: Record<string, any>
} {
  // Helper function to reconstruct patch from parsed diff
  const getPatchForFile = (filename: string): string | undefined => {
    const parsedDiff = context.parsedDiffs.find(d => d.filename === filename)
    if (!parsedDiff || parsedDiff.hunks.length === 0) {
      return undefined
    }

    // Reconstruct unified diff format from hunks
    const patchLines: string[] = []
    for (const hunk of parsedDiff.hunks) {
      patchLines.push(hunk.header)
      for (const line of hunk.lines) {
        if (line.type === 'add') {
          patchLines.push(`+${line.content}`)
        } else if (line.type === 'delete') {
          patchLines.push(`-${line.content}`)
        } else if (line.type === 'context') {
          patchLines.push(` ${line.content}`)
        }
      }
    }
    return patchLines.join('\n')
  }

  // Helper function to determine language from filename
  const getLanguageFromFilename = (filename: string): string | undefined => {
    const ext = filename.split('.').pop()?.toLowerCase()
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'rb': 'ruby',
      'java': 'java',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'c': 'c',
      'cpp': 'cpp',
      'cc': 'cpp',
      'h': 'c',
      'hpp': 'cpp',
      'cs': 'csharp',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
      'sh': 'bash',
      'bash': 'bash',
      'yaml': 'yaml',
      'yml': 'yaml',
      'json': 'json',
      'xml': 'xml',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sql': 'sql',
      'md': 'markdown',
      'txt': 'text',
    }
    return ext ? languageMap[ext] : undefined
  }

  return {
    title: context.pr.title,
    description: context.pr.body || null,
    base_ref: context.pr.base.ref,
    head_ref: context.pr.head.ref,
    files: context.fileChanges.map((change) => ({
      filename: change.filename,
      status: change.status,
      additions: change.additions,
      deletions: change.deletions,
      patch: getPatchForFile(change.filename),
      language: change.language || getLanguageFromFilename(change.filename),
    })),
    metadata: {
      totalFiles: context.stats.totalFiles,
      totalChanges: context.stats.totalChanges,
      totalAdditions: context.stats.totalAdditions,
      totalDeletions: context.stats.totalDeletions,
      complexity: context.complexity.overall,
      affectedAreas: context.metadata.affectedAreas,
      requiresDeepReview: context.metadata.requiresDeepReview,
      languages: context.metadata.languages,
      isLargeChange: context.metadata.isLargeChange,
      hasSensitiveFiles: context.metadata.hasSensitiveFiles,
    },
  }
}
