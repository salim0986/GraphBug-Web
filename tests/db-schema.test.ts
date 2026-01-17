/**
 * Phase 1 Schema Validation Tests
 * Validates that all tables, relationships, and queries work correctly
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import {
  db,
  pullRequests,
  codeReviews,
  reviewComments,
  reviewInsights,
  githubRepositories,
  githubInstallations,
} from '@/db/schema'
import {
  createPullRequest,
  createCodeReview,
  createReviewComment,
  getPullRequestById,
  getCodeReviewWithDetails,
  listPullRequests,
  getRepositoryStats,
  hasPendingReview,
} from '@/db/queries'
import type { NewPullRequest, NewCodeReview, NewReviewComment } from '@/db/types'

// Test data
let testInstallationId: string
let testRepositoryId: string
let testPRId: string
let testReviewId: string

describe('Phase 1: Database Schema Validation', () => {
  beforeAll(async () => {
    // Create test installation
    const [installation] = await db
      .insert(githubInstallations)
      .values({
        userId: null as any,
        installationId: 999999,
        accountLogin: 'test-user',
        accountType: 'User',
        targetType: 'User',
        repositorySelection: 'all',
        installedAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()
    
    testInstallationId = installation.id

    // Create test repository
    const [repository] = await db
      .insert(githubRepositories)
      .values({
        installationId: testInstallationId,
        repoId: 888888,
        name: 'test-repo',
        fullName: 'test-user/test-repo',
        private: false,
        addedAt: new Date(),
        ingestionStatus: 'completed',
      })
      .returning()
    
    testRepositoryId = repository.id
  })

  afterAll(async () => {
    // Clean up test data
    if (testRepositoryId) {
      await db.delete(githubRepositories).where({ id: testRepositoryId } as any)
    }
    if (testInstallationId) {
      await db.delete(githubInstallations).where({ id: testInstallationId } as any)
    }
  })

  describe('Pull Request Operations', () => {
    test('should create a pull request', async () => {
      const prData: NewPullRequest = {
        prNumber: 1,
        prId: 777777,
        repositoryId: testRepositoryId,
        title: 'Test PR',
        description: 'This is a test pull request',
        author: 'test-author',
        htmlUrl: 'https://github.com/test/pr/1',
        baseBranch: 'main',
        headBranch: 'feature/test',
        headCommitSha: 'abc123',
        status: 'open',
        filesChanged: 5,
        additions: 100,
        deletions: 50,
        totalChanges: 150,
      }

      const pr = await createPullRequest(prData)
      testPRId = pr.id

      expect(pr).toBeDefined()
      expect(pr.prNumber).toBe(1)
      expect(pr.title).toBe('Test PR')
      expect(pr.status).toBe('open')
      expect(pr.reviewStatus).toBe('pending')
    })

    test('should retrieve pull request by ID', async () => {
      const pr = await getPullRequestById(testPRId)
      
      expect(pr).toBeDefined()
      expect(pr?.id).toBe(testPRId)
      expect(pr?.title).toBe('Test PR')
    })

    test('should list pull requests with filters', async () => {
      const result = await listPullRequests(
        { repositoryId: testRepositoryId },
        { field: 'createdAt', order: 'desc' },
        1,
        10
      )

      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)
      expect(result.pagination.totalItems).toBeGreaterThan(0)
    })
  })

  describe('Code Review Operations', () => {
    test('should create a code review', async () => {
      const reviewData: NewCodeReview = {
        pullRequestId: testPRId,
        reviewVersion: 1,
        triggerType: 'manual',
        status: 'completed',
        summary: {
          overallScore: 85,
          filesChanged: 5,
          issuesFound: 3,
          critical: 0,
          high: 1,
          medium: 2,
          low: 0,
          info: 0,
        },
        keyChanges: ['Added new authentication', 'Updated API endpoints'],
        recommendations: ['Consider adding more tests', 'Add error handling'],
        primaryModel: 'pro',
        totalTokensInput: 1500,
        totalTokensOutput: 500,
        totalCost: 0.05,
        executionTimeMs: 3000,
      }

      const review = await createCodeReview(reviewData)
      testReviewId = review.id

      expect(review).toBeDefined()
      expect(review.pullRequestId).toBe(testPRId)
      expect(review.status).toBe('completed')
      expect(review.summary?.overallScore).toBe(85)
    })

    test('should check for pending reviews', async () => {
      const hasPending = await hasPendingReview(testPRId)
      expect(typeof hasPending).toBe('boolean')
    })

    test('should retrieve review with details', async () => {
      const review = await getCodeReviewWithDetails(testReviewId)
      
      expect(review).toBeDefined()
      expect(review?.pullRequest).toBeDefined()
      expect(review?.comments).toBeDefined()
      expect(Array.isArray(review?.comments)).toBe(true)
    })
  })

  describe('Review Comment Operations', () => {
    test('should create review comments', async () => {
      const commentData: NewReviewComment = {
        reviewId: testReviewId,
        filePath: 'src/auth.ts',
        startLine: 10,
        endLine: 15,
        severity: 'high',
        category: 'security',
        title: 'Potential SQL Injection',
        message: 'User input is not properly sanitized',
        suggestion: 'Use parameterized queries',
        codeSnippet: 'const query = `SELECT * FROM users WHERE id = ${userId}`',
        confidence: 0.92,
        modelUsed: 'gemini-pro',
      }

      const comment = await createReviewComment(commentData)

      expect(comment).toBeDefined()
      expect(comment.reviewId).toBe(testReviewId)
      expect(comment.severity).toBe('high')
      expect(comment.category).toBe('security')
      expect(comment.isResolved).toBe(false)
      expect(comment.isPosted).toBe(false)
    })

    test('should create multiple comments in batch', async () => {
      const comments: NewReviewComment[] = [
        {
          reviewId: testReviewId,
          filePath: 'src/api.ts',
          startLine: 20,
          severity: 'medium',
          category: 'performance',
          title: 'Inefficient Loop',
          message: 'Consider using map instead of forEach',
        },
        {
          reviewId: testReviewId,
          filePath: 'src/utils.ts',
          startLine: 5,
          severity: 'low',
          category: 'code_quality',
          title: 'Missing Type Annotation',
          message: 'Add explicit return type',
        },
      ]

      const created = await db.insert(reviewComments).values(comments).returning()

      expect(created).toBeDefined()
      expect(created.length).toBe(2)
    })
  })

  describe('Analytics Operations', () => {
    test('should get repository statistics', async () => {
      const stats = await getRepositoryStats(testRepositoryId)

      expect(stats).toBeDefined()
      expect(stats.totalPRs).toBeGreaterThan(0)
      expect(stats.totalIssues).toBeGreaterThan(0)
      expect(typeof stats.avgScore).toBe('number')
      expect(typeof stats.totalCost).toBe('number')
    })

    test('should create review insights', async () => {
      const insightData = {
        scope: 'repository',
        scopeId: testRepositoryId,
        periodType: 'daily',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-01-02'),
        totalReviews: 1,
        completedReviews: 1,
        failedReviews: 0,
        totalPRs: 1,
        reviewedPRs: 1,
        totalIssues: 3,
        criticalIssues: 0,
        highIssues: 1,
        mediumIssues: 2,
        totalCost: 0.05,
        modelUsageStats: {
          flash: 0,
          pro: 1,
          thinking: 0,
        },
      }

      const [insight] = await db
        .insert(reviewInsights)
        .values(insightData)
        .returning()

      expect(insight).toBeDefined()
      expect(insight.totalReviews).toBe(1)
      expect(insight.totalIssues).toBe(3)
    })
  })

  describe('Foreign Key Constraints', () => {
    test('should cascade delete reviews when PR is deleted', async () => {
      // Create a temporary PR
      const [tempPR] = await db
        .insert(pullRequests)
        .values({
          prNumber: 999,
          prId: 123456,
          repositoryId: testRepositoryId,
          title: 'Temp PR',
          author: 'test',
          htmlUrl: 'https://test.com',
          baseBranch: 'main',
          headBranch: 'temp',
          headCommitSha: 'temp123',
          status: 'open',
        })
        .returning()

      // Create a review for it
      const [tempReview] = await db
        .insert(codeReviews)
        .values({
          pullRequestId: tempPR.id,
          status: 'pending',
        })
        .returning()

      // Delete the PR
      await db.delete(pullRequests).where({ id: tempPR.id } as any)

      // Check that review is also deleted (cascade)
      const review = await db
        .select()
        .from(codeReviews)
        .where({ id: tempReview.id } as any)

      expect(review.length).toBe(0)
    })
  })

  describe('Enum Validations', () => {
    test('should validate PR status enum', async () => {
      const validStatuses = ['open', 'closed', 'merged', 'draft']
      
      // This should work with valid status
      const [pr] = await db
        .insert(pullRequests)
        .values({
          prNumber: 100,
          prId: 100100,
          repositoryId: testRepositoryId,
          title: 'Test Enum PR',
          author: 'test',
          htmlUrl: 'https://test.com',
          baseBranch: 'main',
          headBranch: 'test',
          headCommitSha: 'test123',
          status: 'draft',
        })
        .returning()

      expect(pr.status).toBe('draft')
      
      // Clean up
      await db.delete(pullRequests).where({ id: pr.id } as any)
    })

    test('should validate review severity enum', async () => {
      const comment: NewReviewComment = {
        reviewId: testReviewId,
        filePath: 'test.ts',
        startLine: 1,
        severity: 'critical',
        category: 'security',
        title: 'Critical Issue',
        message: 'This is critical',
      }

      const [created] = await db
        .insert(reviewComments)
        .values(comment)
        .returning()

      expect(created.severity).toBe('critical')
    })
  })

  describe('Index Performance', () => {
    test('should efficiently query by repository', async () => {
      const startTime = Date.now()
      
      const prs = await db
        .select()
        .from(pullRequests)
        .where({ repositoryId: testRepositoryId } as any)
      
      const executionTime = Date.now() - startTime

      expect(prs).toBeDefined()
      expect(executionTime).toBeLessThan(100) // Should be fast with index
    })

    test('should efficiently query by status', async () => {
      const startTime = Date.now()
      
      const prs = await db
        .select()
        .from(pullRequests)
        .where({ status: 'open' } as any)
      
      const executionTime = Date.now() - startTime

      expect(prs).toBeDefined()
      expect(executionTime).toBeLessThan(100)
    })
  })
})
