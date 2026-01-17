import { describe, it, expect, beforeEach, jest } from "@jest/globals";

/**
 * Analytics API Tests
 * 
 * Tests for all analytics endpoints to ensure correct behavior,
 * data validation, and error handling.
 */

// Mock fetch for API calls
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe("Analytics API - Reviews", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/analytics/reviews", () => {
    it("should return paginated reviews with default parameters", async () => {
      const mockResponse = {
        reviews: [
          {
            id: "review-1",
            prNumber: 123,
            prTitle: "Fix bug",
            status: "completed",
            summary: {
              overallScore: 85,
              issuesFound: 5,
              critical: 0,
              high: 1,
              medium: 2,
              low: 2,
              info: 0,
            },
            totalCost: 0.0123,
            createdAt: new Date().toISOString(),
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
        aggregates: {
          totalReviews: 1,
          totalCost: 0.0123,
          avgIssues: 5,
          avgScore: 85,
        },
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const response = await fetch("/api/analytics/reviews");
      const data = await response.json();

      expect(data.reviews).toHaveLength(1);
      expect(data.pagination.page).toBe(1);
      expect(data.aggregates.totalReviews).toBe(1);
    });

    it("should handle filters correctly", async () => {
      const mockResponse = {
        reviews: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        aggregates: { totalReviews: 0, totalCost: 0, avgIssues: 0, avgScore: 0 },
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const params = new URLSearchParams({
        page: "1",
        status: "completed",
        author: "testuser",
      });

      const response = await fetch(`/api/analytics/reviews?${params}`);
      const data = await response.json();

      expect(data.reviews).toHaveLength(0);
    });

    it("should return 400 for invalid query parameters", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: "Invalid query parameters" }),
      } as Response);

      const response = await fetch("/api/analytics/reviews?page=invalid");
      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid query parameters");
    });
  });

  describe("GET /api/analytics/reviews/[id]", () => {
    it("should return full review details", async () => {
      const mockResponse = {
        review: {
          id: "review-1",
          prNumber: 123,
          status: "completed",
          summary: { overallScore: 85 },
          totalCost: 0.0123,
        },
        comments: [
          {
            id: "comment-1",
            filePath: "src/app.ts",
            severity: "high",
            category: "security",
            title: "SQL Injection Risk",
            message: "Use parameterized queries",
          },
        ],
        prDetails: {
          htmlUrl: "https://github.com/user/repo/pull/123",
          filesChanged: 5,
        },
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const response = await fetch("/api/analytics/reviews/review-1");
      const data = await response.json();

      expect(data.review.id).toBe("review-1");
      expect(data.comments).toHaveLength(1);
      expect(data.comments[0].severity).toBe("high");
    });

    it("should return 404 for non-existent review", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: "Review not found" }),
      } as Response);

      const response = await fetch("/api/analytics/reviews/invalid-id");
      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
      expect(data.error).toBe("Review not found");
    });
  });
});

describe("Analytics API - Costs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/analytics/costs", () => {
    it("should return cost summary with model breakdown", async () => {
      const mockResponse = {
        summary: {
          totalCost: 1.23,
          reviewCount: 100,
          avgCostPerReview: 0.0123,
          modelBreakdown: {
            flash: 0.45,
            pro: 0.68,
            thinking: 0.10,
          },
        },
        byRepository: [
          {
            repoName: "test-repo",
            totalCost: 0.50,
            reviewCount: 50,
            avgCost: 0.01,
          },
        ],
        byModel: [
          { model: "Gemini 1.5 Flash", cost: 0.45, percentage: 36.6 },
          { model: "Gemini 1.5 Pro", cost: 0.68, percentage: 55.3 },
          { model: "Gemini 2.0 Flash Thinking", cost: 0.10, percentage: 8.1 },
        ],
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const response = await fetch("/api/analytics/costs");
      const data = await response.json();

      expect(data.summary.totalCost).toBe(1.23);
      expect(data.summary.reviewCount).toBe(100);
      expect(data.byModel).toHaveLength(3);
    });
  });

  describe("GET /api/analytics/costs/trends", () => {
    it("should return time-series cost data", async () => {
      const mockResponse = {
        dataPoints: [
          {
            period: "2026-01-10",
            totalCost: 0.123,
            reviewCount: 10,
            avgCostPerReview: 0.0123,
            modelBreakdown: { flash: 0.05, pro: 0.06, thinking: 0.013 },
          },
          {
            period: "2026-01-11",
            totalCost: 0.156,
            reviewCount: 12,
            avgCostPerReview: 0.013,
            modelBreakdown: { flash: 0.06, pro: 0.08, thinking: 0.016 },
          },
        ],
        totals: {
          cost: 0.279,
          reviews: 22,
        },
        metadata: {
          granularity: "daily",
          dataPointCount: 2,
        },
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const response = await fetch("/api/analytics/costs/trends?granularity=daily");
      const data = await response.json();

      expect(data.dataPoints).toHaveLength(2);
      expect(data.totals.cost).toBeCloseTo(0.279);
      expect(data.metadata.granularity).toBe("daily");
    });
  });

  describe("GET /api/analytics/costs/projections", () => {
    it("should return cost projections with trend", async () => {
      const mockResponse = {
        currentPeriod: { cost: 5.0, reviews: 100 },
        projection: { cost: 10.0, reviews: 200 },
        trend: "increasing",
        confidence: 0.8,
        metadata: {
          period: "month",
          message: "Costs are trending upward. Expected to spend $10.00 this month.",
        },
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const response = await fetch("/api/analytics/costs/projections?period=month");
      const data = await response.json();

      expect(data.currentPeriod.cost).toBe(5.0);
      expect(data.projection.cost).toBe(10.0);
      expect(data.trend).toBe("increasing");
      expect(data.confidence).toBeGreaterThan(0);
    });
  });
});

describe("Analytics API - Team", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/analytics/team", () => {
    it("should return team analytics with author stats", async () => {
      const mockResponse = {
        authors: [
          {
            author: "testuser",
            prCount: 50,
            reviewCount: 50,
            avgIssuesFound: 8.5,
            avgScore: 82.3,
            severityBreakdown: {
              critical: 2,
              high: 10,
              medium: 20,
              low: 30,
              info: 5,
            },
            categoryBreakdown: {
              security: 5,
              performance: 10,
              bug: 15,
              code_quality: 20,
              best_practice: 10,
              documentation: 5,
              testing: 2,
              accessibility: 0,
              maintainability: 0,
            },
            totalCost: 0.615,
          },
        ],
        topContributors: [
          { author: "testuser", prCount: 50, avgScore: 82.3 },
        ],
        aggregates: {
          totalAuthors: 1,
          totalPRs: 50,
          totalReviews: 50,
          totalIssues: 67,
          totalCost: 0.615,
        },
        overallSeverity: {
          critical: 2,
          high: 10,
          medium: 20,
          low: 30,
          info: 5,
        },
        overallCategories: {
          security: 5,
          performance: 10,
          bug: 15,
          code_quality: 20,
          best_practice: 10,
          documentation: 5,
          testing: 2,
          accessibility: 0,
          maintainability: 0,
        },
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const response = await fetch("/api/analytics/team");
      const data = await response.json();

      expect(data.authors).toHaveLength(1);
      expect(data.aggregates.totalAuthors).toBe(1);
      expect(data.overallSeverity.critical).toBe(2);
    });
  });
});

describe("Analytics API - Repository Insights", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/analytics/repositories/[id]/insights", () => {
    it("should return comprehensive repository insights", async () => {
      const mockResponse = {
        repository: {
          id: "repo-1",
          name: "test-repo",
          fullName: "user/test-repo",
        },
        overview: {
          totalReviews: 100,
          totalPRs: 95,
          avgIssuesPerPR: 8.5,
          avgScorePerPR: 82.0,
          totalCost: 1.23,
        },
        hotFiles: [
          {
            filePath: "src/app.ts",
            reviewCount: 25,
            issueCount: 50,
            avgSeverity: 3.2,
            lastReviewedAt: new Date().toISOString(),
          },
        ],
        reviewTrends: [
          {
            period: "2026-01-10",
            totalCost: 0.123,
            reviewCount: 10,
          },
        ],
        issuePatterns: {
          byCategory: [
            { category: "security", count: 25, percentage: 25.0 },
            { category: "performance", count: 30, percentage: 30.0 },
          ],
          bySeverity: [
            { severity: "critical", count: 5, percentage: 5.0 },
            { severity: "high", count: 20, percentage: 20.0 },
          ],
          commonIssues: [
            { title: "Use parameterized queries", count: 15 },
          ],
        },
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const response = await fetch("/api/analytics/repositories/repo-1/insights");
      const data = await response.json();

      expect(data.repository.id).toBe("repo-1");
      expect(data.overview.totalReviews).toBe(100);
      expect(data.hotFiles).toHaveLength(1);
      expect(data.issuePatterns.byCategory).toHaveLength(2);
    });

    it("should return 404 for non-existent repository", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: "Repository not found" }),
      } as Response);

      const response = await fetch("/api/analytics/repositories/invalid-id/insights");
      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
      expect(data.error).toBe("Repository not found");
    });
  });
});

describe("Error Handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 for unauthenticated requests", async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: "Unauthorized" }),
    } as Response);

    const response = await fetch("/api/analytics/reviews");
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should handle 500 internal server errors", async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: "Internal server error" }),
    } as Response);

    const response = await fetch("/api/analytics/costs");
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal server error");
  });
});
