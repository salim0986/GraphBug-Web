/**
 * Test Suite for Phase 2: PR Data Fetching
 * Tests GitHub API client, diff parsing, and PR context building
 */

import { describe, test, expect } from '@jest/globals'
import { GitHubAPIClient } from "@/lib/github-pr"
import {
  parseDiff,
  extractChangedLines,
  calculateDiffComplexity,
  filterReviewableFiles,
  getContextRange,
  calculateDiffStats,
  detectLanguage,
  extractAffectedFunctions,
  type ParsedDiff,
} from "@/lib/diff-parser"
import {
  buildPRContext,
  getFocusedContext,
  getLineContexts,
  generatePRSummary,
  prepareForAIReview,
} from "@/lib/pr-context"

describe("Phase 2: PR Data Fetching", () => {
  describe("Diff Parser", () => {
    const sampleDiff = `diff --git a/src/utils/helper.ts b/src/utils/helper.ts
index 1234567..abcdefg 100644
--- a/src/utils/helper.ts
+++ b/src/utils/helper.ts
@@ -1,10 +1,15 @@
 export function formatDate(date: Date): string {
-  return date.toISOString()
+  return date.toISOString().split('T')[0]
 }
 
+export function parseDate(dateStr: string): Date {
+  return new Date(dateStr)
+}
+
 export function capitalize(str: string): string {
   if (!str) return ''
   return str.charAt(0).toUpperCase() + str.slice(1)
 }
 
-// TODO: Add more utility functions
+export function truncate(str: string, maxLength: number): string {
+  if (str.length <= maxLength) return str
+  return str.slice(0, maxLength - 3) + '...'
+}
`

    test("parseDiff should parse unified diff format", () => {
      const result = parseDiff(sampleDiff)

      expect(result).toHaveLength(1)
      expect(result[0].filename).toBe("src/utils/helper.ts")
      expect(result[0].status).toBe("modified")
      expect(result[0].additions).toBeGreaterThan(0)
      expect(result[0].deletions).toBeGreaterThan(0)
    })

    test("extractChangedLines should identify added and removed lines", () => {
      const parsed = parseDiff(sampleDiff)[0]
      const changes = extractChangedLines(parsed)

      expect(changes.filename).toBe("src/utils/helper.ts")
      expect(changes.additions).toBeGreaterThan(0)
      expect(changes.deletions).toBeGreaterThan(0)
      expect(changes.changedLines.length).toBeGreaterThan(0)
    })

    test("calculateDiffComplexity should score changes", () => {
      const parsed = parseDiff(sampleDiff)[0]
      const complexity = calculateDiffComplexity(parsed)

      expect(complexity).toBeGreaterThanOrEqual(0)
      expect(complexity).toBeLessThanOrEqual(100)
    })

    test("calculateDiffStats should aggregate statistics", () => {
      const parsed = parseDiff(sampleDiff)
      const stats = calculateDiffStats(parsed)

      expect(stats.totalFiles).toBe(1)
      expect(stats.totalAdditions).toBeGreaterThan(0)
      expect(stats.totalDeletions).toBeGreaterThan(0)
      expect(stats.totalChanges).toBeGreaterThan(0)
    })

    test("detectLanguage should identify file language", () => {
      expect(detectLanguage("index.ts")).toBe("TypeScript")
      expect(detectLanguage("app.py")).toBe("Python")
      expect(detectLanguage("main.go")).toBe("Go")
      expect(detectLanguage("styles.css")).toBe("CSS")
      expect(detectLanguage("README.md")).toBe("Markdown")
      expect(detectLanguage("unknown.xyz")).toBe("Unknown")
    })

    test("filterReviewableFiles should exclude non-reviewable files", () => {
      const diffs: ParsedDiff[] = [
        {
          filename: "src/app.ts",
          status: "modified" as const,
          additions: 10,
          deletions: 5,
          changes: 15,
          hunks: [],
          isBinary: false,
        },
        {
          filename: "package-lock.json",
          status: "modified" as const,
          additions: 1000,
          deletions: 500,
          changes: 1500,
          hunks: [],
          isBinary: false,
        },
        {
          filename: "dist/bundle.js",
          status: "modified" as const,
          additions: 5000,
          deletions: 0,
          changes: 5000,
          hunks: [],
          isBinary: false,
        },
        {
          filename: "image.png",
          status: "added" as const,
          additions: 0,
          deletions: 0,
          changes: 0,
          hunks: [],
          isBinary: true,
        },
      ]

      const filtered = filterReviewableFiles(diffs)

      expect(filtered).toHaveLength(1)
      expect(filtered[0].filename).toBe("src/app.ts")
    })

    test("getContextRange should merge overlapping ranges", () => {
      const lines = [
        { lineNumber: 1, type: "add" as const },
        { lineNumber: 2, type: "add" as const },
        { lineNumber: 3, type: "delete" as const },
        { lineNumber: 10, type: "add" as const },
        { lineNumber: 11, type: "add" as const },
        { lineNumber: 12, type: "delete" as const },
        { lineNumber: 20, type: "add" as const },
      ]
      const ranges = getContextRange(lines, 2)

      expect(ranges.length).toBeGreaterThan(0)
      ranges.forEach((range) => {
        expect(range.start).toBeLessThanOrEqual(range.end)
      })
    })

    test("extractAffectedFunctions should identify function changes", () => {
      const parsed = parseDiff(sampleDiff)[0]
      const functions = extractAffectedFunctions(parsed)

      expect(Array.isArray(functions)).toBe(true)
      // The diff modifies formatDate and adds new functions
      expect(functions.length).toBeGreaterThan(0)
    })
  })

  describe("Language Detection", () => {
    const languageTests = [
      { file: "component.tsx", expected: "TypeScript React" },
      { file: "api.ts", expected: "TypeScript" },
      { file: "script.js", expected: "JavaScript" },
      { file: "server.py", expected: "Python" },
      { file: "main.go", expected: "Go" },
      { file: "App.java", expected: "Java" },
      { file: "program.rs", expected: "Rust" },
      { file: "page.php", expected: "PHP" },
      { file: "styles.css", expected: "CSS" },
      { file: "template.html", expected: "HTML" },
      { file: "config.json", expected: "JSON" },
      { file: "data.yaml", expected: "YAML" },
      { file: "README.md", expected: "Markdown" },
      { file: "Dockerfile", expected: "Dockerfile" },
      { file: "script.sh", expected: "Shell" },
    ]

    languageTests.forEach(({ file, expected }) => {
      test(`should detect ${expected} for ${file}`, () => {
        expect(detectLanguage(file)).toBe(expected)
      })
    })
  })

  describe("Context Range Calculation", () => {
    test("should handle single line change", () => {
      const ranges = getContextRange([{ lineNumber: 10, type: "add" }], 3)
      expect(ranges).toHaveLength(1)
      expect(ranges[0].start).toBe(7) // 10 - 3
      expect(ranges[0].end).toBe(13) // 10 + 3
    })

    test("should merge nearby changes", () => {
      const ranges = getContextRange(
        [
          { lineNumber: 10, type: "add" },
          { lineNumber: 11, type: "add" },
          { lineNumber: 12, type: "delete" },
        ],
        2
      )
      expect(ranges).toHaveLength(1)
      expect(ranges[0].start).toBe(8)
      expect(ranges[0].end).toBe(14)
    })

    test("should create separate ranges for distant changes", () => {
      const ranges = getContextRange(
        [
          { lineNumber: 10, type: "add" },
          { lineNumber: 50, type: "add" },
        ],
        2
      )
      expect(ranges.length).toBeGreaterThanOrEqual(2)
    })

    test("should handle empty input", () => {
      const ranges = getContextRange([], 5)
      expect(ranges).toHaveLength(0)
    })
  })

  describe("Complexity Scoring", () => {
    test("should score simple changes lower", () => {
      const simpleDiff: ParsedDiff = {
        filename: "README.md",
        status: "modified" as const,
        additions: 2,
        deletions: 1,
        changes: 3,
        hunks: [
          {
            oldStart: 1,
            oldLines: 3,
            newStart: 1,
            newLines: 4,
            header: "@@ -1,3 +1,4 @@",
            lines: [
              { type: "context" as const, content: "# Project", oldLineNumber: 1, newLineNumber: 1 },
              { type: "delete" as const, content: "Old description", oldLineNumber: 2 },
              { type: "add" as const, content: "New description", newLineNumber: 2 },
              { type: "add" as const, content: "More details", newLineNumber: 3 },
            ],
          },
        ],
        isBinary: false,
      }

      const complexity = calculateDiffComplexity(simpleDiff)
      expect(complexity).toBeLessThan(30)
    })

    test("should score complex changes higher", () => {
      const complexDiff: ParsedDiff = {
        filename: "src/auth/security.ts",
        status: "modified" as const,
        additions: 150,
        deletions: 80,
        changes: 230,
        hunks: [
          {
            oldStart: 1,
            oldLines: 100,
            newStart: 1,
            newLines: 170,
            header: "@@ -1,100 +1,170 @@",
            lines: Array(230)
              .fill(null)
              .map((_, i) => ({
                type: (i % 3 === 0 ? "add" : i % 3 === 1 ? "delete" : "context") as
                  | "add"
                  | "delete"
                  | "context",
                content: `line ${i}`,
                oldLineNumber: i % 3 !== 0 ? i : undefined,
                newLineNumber: i % 3 !== 1 ? i : undefined,
              })),
          },
        ],
        isBinary: false,
      }

      const complexity = calculateDiffComplexity(complexDiff)
      expect(complexity).toBeGreaterThan(50)
    })
  })

  describe("PR Context Summary", () => {
    test("generatePRSummary should format PR information", () => {
      const mockContext = {
        pr: {
          number: 123,
          id: 1,
          title: "Add new feature",
          body: "This PR adds a new feature",
          state: "open" as const,
          draft: false,
          merged: false,
          html_url: "https://github.com/owner/repo/pull/123",
          diff_url: "https://github.com/owner/repo/pull/123.diff",
          patch_url: "https://github.com/owner/repo/pull/123.patch",
          user: { login: "testuser", avatar_url: "https://example.com/avatar.png" },
          base: {
            ref: "main",
            sha: "def456",
            repo: { id: 1, name: "repo", full_name: "owner/repo", private: false },
          },
          head: { ref: "feature-branch", sha: "abc123" },
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-02T00:00:00Z",
          closed_at: null,
          merged_at: null,
          files_changed: 5,
          additions: 100,
          deletions: 20,
          changed_files: 5,
          commits: 3,
        },
        diff: {
          diff: "",
          files: [],
          stats: {
            total_files: 5,
            total_additions: 100,
            total_deletions: 20,
            total_changes: 120,
          },
        },
        parsedDiffs: [],
        fileChanges: [],
        fileContents: new Map(),
        commits: [
          {
            sha: "commit1",
            message: "Initial commit",
            author: "testuser",
            date: "2024-01-01",
          },
        ],
        stats: {
          totalFiles: 5,
          totalAdditions: 100,
          totalDeletions: 20,
          totalChanges: 120,
          filesByStatus: { modified: 5 },
          filesByLanguage: { TypeScript: 3, Python: 2 },
          largestFiles: [],
          binaryFiles: 0,
        },
        complexity: {
          overall: 45,
          perFile: {},
        },
        metadata: {
          languages: ["TypeScript", "Python"],
          affectedAreas: ["API", "Database"],
          isLargeChange: false,
          hasSensitiveFiles: true,
          requiresDeepReview: true,
        },
      }

      const summary = generatePRSummary(mockContext)

      expect(summary).toContain("PR #123")
      expect(summary).toContain("Add new feature")
      expect(summary).toContain("testuser")
      expect(summary).toContain("5 files changed")
      expect(summary).toContain("Sensitive files")
      expect(summary).toContain("deep review")
    })
  })

  describe("AI Review Preparation", () => {
    test("prepareForAIReview should format context for LLM", () => {
      const mockContext = {
        pr: {
          number: 123,
          id: 1,
          title: "Test PR",
          body: "Description",
          state: "open" as const,
          draft: false,
          merged: false,
          html_url: "https://github.com/test/repo/pull/123",
          diff_url: "https://github.com/test/repo/pull/123.diff",
          patch_url: "https://github.com/test/repo/pull/123.patch",
          user: { login: "user", avatar_url: "https://example.com/avatar.png" },
          base: {
            ref: "main",
            sha: "def",
            repo: { id: 1, name: "repo", full_name: "test/repo", private: false },
          },
          head: { ref: "branch", sha: "abc" },
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          closed_at: null,
          merged_at: null,
          files_changed: 1,
          additions: 10,
          deletions: 5,
          changed_files: 1,
          commits: 1,
        },
        diff: {
          diff: "",
          files: [],
          stats: {
            total_files: 1,
            total_additions: 10,
            total_deletions: 5,
            total_changes: 15,
          },
        },
        parsedDiffs: [],
        fileChanges: [
          {
            filename: "test.ts",
            status: "modified" as const,
            additions: 10,
            deletions: 5,
            changedLines: [
              { lineNumber: 1, type: "add" as const, content: "new line" },
              { lineNumber: 2, type: "add" as const, content: "another line" },
              { lineNumber: 3, type: "delete" as const, content: "old line" },
            ],
            language: "TypeScript",
            affectedFunctions: [],
          },
        ],
        fileContents: new Map([
          ["test.ts", { filename: "test.ts", content: "code here", sha: "abc", encoding: "utf-8", size: 9 }],
        ]),
        commits: [],
        stats: {
          totalFiles: 1,
          totalAdditions: 10,
          totalDeletions: 5,
          totalChanges: 15,
          filesByStatus: { modified: 1 },
          filesByLanguage: { TypeScript: 1 },
          largestFiles: [],
          binaryFiles: 0,
        },
        complexity: {
          overall: 30,
          perFile: { "test.ts": 30 },
        },
        metadata: {
          languages: ["TypeScript"],
          affectedAreas: ["Tests"],
          isLargeChange: false,
          hasSensitiveFiles: false,
          requiresDeepReview: false,
        },
      }

      const aiContext = prepareForAIReview(mockContext)

      expect(aiContext.summary).toBeTruthy()
      expect(aiContext.files).toHaveLength(1)
      expect(aiContext.files[0].filename).toBe("test.ts")
      expect(aiContext.files[0].content).toBe("code here")
      expect(aiContext.metadata.totalFiles).toBe(1)
      expect(aiContext.metadata.complexity).toBe(30)
    })
  })

  describe("File Filtering", () => {
    test("should filter out lock files", () => {
      const diffs: ParsedDiff[] = [
        {
          filename: "src/app.ts",
          status: "modified" as const,
          additions: 10,
          deletions: 5,
          changes: 15,
          hunks: [],
          isBinary: false,
        },
        {
          filename: "package-lock.json",
          status: "modified" as const,
          additions: 1000,
          deletions: 0,
          changes: 1000,
          hunks: [],
          isBinary: false,
        },
        {
          filename: "yarn.lock",
          status: "modified" as const,
          additions: 500,
          deletions: 0,
          changes: 500,
          hunks: [],
          isBinary: false,
        },
      ]

      const filtered = filterReviewableFiles(diffs)
      expect(filtered).toHaveLength(1)
      expect(filtered[0].filename).toBe("src/app.ts")
    })

    test("should filter out build artifacts", () => {
      const diffs: ParsedDiff[] = [
        {
          filename: "src/component.tsx",
          status: "modified" as const,
          additions: 20,
          deletions: 10,
          changes: 30,
          hunks: [],
          isBinary: false,
        },
        {
          filename: "dist/bundle.js",
          status: "added" as const,
          additions: 10000,
          deletions: 0,
          changes: 10000,
          hunks: [],
          isBinary: false,
        },
        {
          filename: "build/output.js",
          status: "added" as const,
          additions: 5000,
          deletions: 0,
          changes: 5000,
          hunks: [],
          isBinary: false,
        },
      ]

      const filtered = filterReviewableFiles(diffs)
      expect(filtered).toHaveLength(1)
      expect(filtered[0].filename).toBe("src/component.tsx")
    })

    test("should filter out binary files", () => {
      const diffs: ParsedDiff[] = [
        {
          filename: "docs/README.md",
          status: "modified" as const,
          additions: 5,
          deletions: 2,
          changes: 7,
          hunks: [],
          isBinary: false,
        },
        {
          filename: "assets/logo.png",
          status: "added" as const,
          additions: 0,
          deletions: 0,
          changes: 0,
          hunks: [],
          isBinary: true,
        },
      ]

      const filtered = filterReviewableFiles(diffs)
      expect(filtered).toHaveLength(1)
      expect(filtered[0].filename).toBe("docs/README.md")
    })
  })
})
