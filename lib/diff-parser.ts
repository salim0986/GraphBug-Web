/**
 * Diff Parser - Parse and analyze GitHub PR diffs
 * Handles diff parsing, hunk extraction, and change analysis
 */

export interface DiffHunk {
  oldStart: number
  oldLines: number
  newStart: number
  newLines: number
  header: string
  lines: DiffLine[]
}

export interface DiffLine {
  type: "add" | "delete" | "context" | "no-newline"
  content: string
  oldLineNumber?: number
  newLineNumber?: number
}

export interface ParsedDiff {
  filename: string
  status: "added" | "removed" | "modified" | "renamed"
  oldFilename?: string
  additions: number
  deletions: number
  changes: number
  hunks: DiffHunk[]
  language?: string
  isBinary: boolean
}

export interface FileChange {
  filename: string
  status: "added" | "removed" | "modified" | "renamed"
  additions: number
  deletions: number
  changedLines: Array<{
    lineNumber: number
    type: "add" | "delete"
    content: string
  }>
  affectedFunctions?: string[]
  language?: string
}

/**
 * Parse unified diff format
 */
export function parseDiff(diffText: string): ParsedDiff[] {
  const files: ParsedDiff[] = []
  const lines = diffText.split("\n")
  
  let currentFile: ParsedDiff | null = null
  let currentHunk: DiffHunk | null = null
  let oldLineNum = 0
  let newLineNum = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // New file header
    if (line.startsWith("diff --git")) {
      if (currentFile && currentHunk) {
        currentFile.hunks.push(currentHunk)
      }
      if (currentFile) {
        files.push(currentFile)
      }

      // Extract filename from diff --git a/file b/file
      const match = line.match(/diff --git a\/(.+?) b\/(.+)/)
      if (match) {
        const oldPath = match[1]
        const newPath = match[2]
        
        currentFile = {
          filename: newPath,
          status: "modified",
          additions: 0,
          deletions: 0,
          changes: 0,
          hunks: [],
          isBinary: false,
        }

        if (oldPath !== newPath) {
          currentFile.status = "renamed"
          currentFile.oldFilename = oldPath
        }
      }
      currentHunk = null
      continue
    }

    if (!currentFile) continue

    // File status indicators
    if (line.startsWith("new file")) {
      currentFile.status = "added"
    } else if (line.startsWith("deleted file")) {
      currentFile.status = "removed"
    } else if (line.startsWith("rename from")) {
      currentFile.status = "renamed"
    } else if (line.startsWith("Binary files")) {
      currentFile.isBinary = true
    }

    // Hunk header: @@ -oldStart,oldLines +newStart,newLines @@
    if (line.startsWith("@@")) {
      if (currentHunk) {
        currentFile.hunks.push(currentHunk)
      }

      const hunkMatch = line.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@(.*)/)
      if (hunkMatch) {
        oldLineNum = parseInt(hunkMatch[1])
        const oldLines = hunkMatch[2] ? parseInt(hunkMatch[2]) : 1
        newLineNum = parseInt(hunkMatch[3])
        const newLines = hunkMatch[4] ? parseInt(hunkMatch[4]) : 1
        const header = hunkMatch[5].trim()

        currentHunk = {
          oldStart: oldLineNum,
          oldLines,
          newStart: newLineNum,
          newLines,
          header,
          lines: [],
        }
      }
      continue
    }

    // Hunk content
    if (currentHunk) {
      const diffLine: DiffLine = {
        type: "context",
        content: line.substring(1), // Remove the leading character
      }

      if (line.startsWith("+")) {
        diffLine.type = "add"
        diffLine.newLineNumber = newLineNum++
        currentFile.additions++
      } else if (line.startsWith("-")) {
        diffLine.type = "delete"
        diffLine.oldLineNumber = oldLineNum++
        currentFile.deletions++
      } else if (line.startsWith(" ")) {
        diffLine.type = "context"
        diffLine.oldLineNumber = oldLineNum++
        diffLine.newLineNumber = newLineNum++
      } else if (line.startsWith("\\ No newline")) {
        diffLine.type = "no-newline"
        diffLine.content = line
      } else {
        // Handle other line types
        continue
      }

      currentHunk.lines.push(diffLine)
    }
  }

  // Push last hunk and file
  if (currentFile && currentHunk) {
    currentFile.hunks.push(currentHunk)
  }
  if (currentFile) {
    currentFile.changes = currentFile.additions + currentFile.deletions
    files.push(currentFile)
  }

  return files
}

/**
 * Extract only the changed lines from a diff
 */
export function extractChangedLines(parsedDiff: ParsedDiff): FileChange {
  const changedLines: Array<{
    lineNumber: number
    type: "add" | "delete"
    content: string
  }> = []

  for (const hunk of parsedDiff.hunks) {
    for (const line of hunk.lines) {
      if (line.type === "add" && line.newLineNumber) {
        changedLines.push({
          lineNumber: line.newLineNumber,
          type: "add",
          content: line.content,
        })
      } else if (line.type === "delete" && line.oldLineNumber) {
        changedLines.push({
          lineNumber: line.oldLineNumber,
          type: "delete",
          content: line.content,
        })
      }
    }
  }

  return {
    filename: parsedDiff.filename,
    status: parsedDiff.status,
    additions: parsedDiff.additions,
    deletions: parsedDiff.deletions,
    changedLines,
    language: detectLanguage(parsedDiff.filename),
  }
}

/**
 * Detect programming language from filename
 */
export function detectLanguage(filename: string): string | undefined {
  const ext = filename.split(".").pop()?.toLowerCase()
  
  const languageMap: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    py: "python",
    rb: "ruby",
    go: "go",
    rs: "rust",
    java: "java",
    c: "c",
    cpp: "cpp",
    cs: "csharp",
    php: "php",
    swift: "swift",
    kt: "kotlin",
    scala: "scala",
    sql: "sql",
    html: "html",
    css: "css",
    scss: "scss",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    md: "markdown",
    sh: "bash",
    bash: "bash",
    dockerfile: "dockerfile",
  }

  if (filename.toLowerCase() === "dockerfile") return "dockerfile"
  
  return ext ? languageMap[ext] : undefined
}

/**
 * Group files by language
 */
export function groupFilesByLanguage(
  files: FileChange[]
): Record<string, FileChange[]> {
  const grouped: Record<string, FileChange[]> = {}

  for (const file of files) {
    const lang = file.language || "unknown"
    if (!grouped[lang]) {
      grouped[lang] = []
    }
    grouped[lang].push(file)
  }

  return grouped
}

/**
 * Calculate diff statistics
 */
export interface DiffStats {
  totalFiles: number
  totalAdditions: number
  totalDeletions: number
  totalChanges: number
  filesByStatus: Record<string, number>
  filesByLanguage: Record<string, number>
  largestFiles: Array<{ filename: string; changes: number }>
  binaryFiles: number
}

export function calculateDiffStats(parsedDiffs: ParsedDiff[]): DiffStats {
  const stats: DiffStats = {
    totalFiles: parsedDiffs.length,
    totalAdditions: 0,
    totalDeletions: 0,
    totalChanges: 0,
    filesByStatus: {},
    filesByLanguage: {},
    largestFiles: [],
    binaryFiles: 0,
  }

  const fileChanges: Array<{ filename: string; changes: number }> = []

  for (const diff of parsedDiffs) {
    stats.totalAdditions += diff.additions
    stats.totalDeletions += diff.deletions
    stats.totalChanges += diff.changes

    // Count by status
    stats.filesByStatus[diff.status] =
      (stats.filesByStatus[diff.status] || 0) + 1

    // Count by language
    const lang = detectLanguage(diff.filename) || "unknown"
    stats.filesByLanguage[lang] = (stats.filesByLanguage[lang] || 0) + 1

    // Track file changes
    fileChanges.push({
      filename: diff.filename,
      changes: diff.changes,
    })

    // Count binary files
    if (diff.isBinary) {
      stats.binaryFiles++
    }
  }

  // Sort and get top 10 largest files
  stats.largestFiles = fileChanges
    .sort((a, b) => b.changes - a.changes)
    .slice(0, 10)

  return stats
}

/**
 * Extract function/class names from hunk headers
 * Hunk headers often contain the function/class context
 */
export function extractAffectedFunctions(parsedDiff: ParsedDiff): string[] {
  const functions = new Set<string>()

  for (const hunk of parsedDiff.hunks) {
    if (hunk.header) {
      // Common patterns in hunk headers
      const patterns = [
        /function\s+(\w+)/,
        /def\s+(\w+)/,
        /class\s+(\w+)/,
        /const\s+(\w+)\s*=/,
        /export\s+(?:function|const|class)\s+(\w+)/,
      ]

      for (const pattern of patterns) {
        const match = hunk.header.match(pattern)
        if (match && match[1]) {
          functions.add(match[1])
        }
      }
    }
  }

  return Array.from(functions)
}

/**
 * Check if a file should be reviewed
 * Skip files that don't need review (e.g., lock files, generated files)
 */
export function shouldReviewFile(filename: string): boolean {
  const skipPatterns = [
    /package-lock\.json$/,
    /yarn\.lock$/,
    /pnpm-lock\.yaml$/,
    /\.min\.js$/,
    /\.min\.css$/,
    /\.map$/,
    /\.generated\./,
    /node_modules\//,
    /dist\//,
    /build\//,
    /\.next\//,
    /coverage\//,
    /\.svg$/,
    /\.png$/,
    /\.jpg$/,
    /\.jpeg$/,
    /\.gif$/,
    /\.ico$/,
    /\.woff$/,
    /\.woff2$/,
    /\.ttf$/,
    /\.eot$/,
  ]

  return !skipPatterns.some((pattern) => pattern.test(filename))
}

/**
 * Filter files that need review
 */
export function filterReviewableFiles(files: ParsedDiff[]): ParsedDiff[] {
  return files.filter(
    (file) => !file.isBinary && shouldReviewFile(file.filename)
  )
}

/**
 * Get context lines around changes
 * Returns a range of line numbers to fetch for full context
 */
export function getContextRange(
  changedLines: Array<{ lineNumber: number; type: "add" | "delete" }>,
  contextSize: number = 5
): Array<{ start: number; end: number }> {
  if (changedLines.length === 0) return []

  // Sort by line number
  const sorted = [...changedLines].sort((a, b) => a.lineNumber - b.lineNumber)

  const ranges: Array<{ start: number; end: number }> = []
  let currentRange = {
    start: Math.max(1, sorted[0].lineNumber - contextSize),
    end: sorted[0].lineNumber + contextSize,
  }

  for (let i = 1; i < sorted.length; i++) {
    const line = sorted[i]
    const expandedStart = Math.max(1, line.lineNumber - contextSize)
    const expandedEnd = line.lineNumber + contextSize

    // Merge overlapping ranges
    if (expandedStart <= currentRange.end + 1) {
      currentRange.end = Math.max(currentRange.end, expandedEnd)
    } else {
      ranges.push(currentRange)
      currentRange = { start: expandedStart, end: expandedEnd }
    }
  }

  ranges.push(currentRange)
  return ranges
}

/**
 * Calculate complexity score for a diff
 * Higher score = more complex changes = may need advanced model
 */
export function calculateDiffComplexity(parsedDiff: ParsedDiff): number {
  let score = 0

  // Base score from changes
  score += Math.min(parsedDiff.changes / 10, 50) // Max 50 points for size

  // Increase score for certain file types
  const filename = parsedDiff.filename.toLowerCase()
  if (
    filename.includes("auth") ||
    filename.includes("security") ||
    filename.includes("crypto")
  ) {
    score += 20
  }

  if (
    filename.includes("db") ||
    filename.includes("database") ||
    filename.includes("migration")
  ) {
    score += 15
  }

  if (filename.includes("api") || filename.includes("endpoint")) {
    score += 10
  }

  // Increase score for complex patterns in the diff
  const diffContent = parsedDiff.hunks
    .flatMap((h) => h.lines)
    .map((l) => l.content)
    .join("\n")

  const complexPatterns = [
    /async|await|Promise/i,
    /try\s*{|catch\s*\(/,
    /class\s+\w+/,
    /interface\s+\w+/,
    /type\s+\w+\s*=/,
    /@\w+\(/,  // Decorators
    /\.then\(|\.catch\(/,
    /SELECT|INSERT|UPDATE|DELETE/i,  // SQL
    /crypto|encrypt|decrypt|hash|sign/i,
  ]

  for (const pattern of complexPatterns) {
    if (pattern.test(diffContent)) {
      score += 5
    }
  }

  return Math.min(score, 100) // Cap at 100
}

/**
 * Summarize a diff in human-readable format
 */
export function summarizeDiff(stats: DiffStats): string {
  const parts: string[] = []

  parts.push(`${stats.totalFiles} file${stats.totalFiles !== 1 ? "s" : ""} changed`)
  
  if (stats.totalAdditions > 0) {
    parts.push(`${stats.totalAdditions} addition${stats.totalAdditions !== 1 ? "s" : ""}`)
  }
  
  if (stats.totalDeletions > 0) {
    parts.push(`${stats.totalDeletions} deletion${stats.totalDeletions !== 1 ? "s" : ""}`)
  }

  return parts.join(", ")
}
