/**
 * Reviews API Endpoint
 * Handles review creation and management for AI service integration
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createCodeReview, getCodeReviewById, type NewCodeReview } from "@/db/queries";
import { db, pullRequests } from "@/db/schema";
import { eq } from "drizzle-orm";

const CreateReviewSchema = z.object({
  pull_request_id: z.string().uuid(),
  status: z.enum(["pending", "in_progress", "completed", "failed", "cancelled"]),
  started_at: z.string().datetime().nullable().optional(),
  completed_at: z.string().datetime().nullable().optional(),
  primary_model: z.enum(["flash", "pro", "thinking"]).optional(),
  models_used: z.array(z.object({
    model: z.string(),
    tier: z.string(),
    tokensInput: z.number(),
    tokensOutput: z.number(),
    cost: z.number(),
    taskType: z.string(),
  })).optional(),
  total_tokens_input: z.number().int().nonnegative().optional(),
  total_tokens_output: z.number().int().nonnegative().optional(),
  total_cost: z.number().nonnegative().optional(),
  execution_time_ms: z.number().int().nonnegative().optional(),
  summary: z.object({
    overallScore: z.number(),
    filesChanged: z.number(),
    issuesFound: z.number(),
    critical: z.number(),
    high: z.number(),
    medium: z.number(),
    low: z.number(),
    info: z.number(),
  }).nullable().optional(),
  key_changes: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
  positives: z.array(z.string()).optional(),
  summary_comment_id: z.number().int().optional(),
  summary_comment_url: z.string().optional(),
  inline_comments_posted: z.number().int().optional(),
});

export type CreateReviewRequest = z.infer<typeof CreateReviewSchema>;

/**
 * POST /api/reviews
 * Create a new code review record
 * Called by ai-service to store review metadata
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const validation = CreateReviewSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verify that the PR exists before creating the review
    const [prExists] = await db
      .select({ id: pullRequests.id })
      .from(pullRequests)
      .where(eq(pullRequests.id, data.pull_request_id))
      .limit(1);

    if (!prExists) {
      console.error(`❌ Pull request ${data.pull_request_id} not found in database`);
      console.error(`   This usually means the webhook failed to create the PR record`);
      return NextResponse.json(
        {
          error: "Pull request not found",
          details: `Pull request with ID ${data.pull_request_id} does not exist. The webhook may have failed to create the PR record.`,
        },
        { status: 404 }
      );
    }

    console.log(`✅ Pull request ${data.pull_request_id} exists, creating review...`);

    // Create review record
    const reviewData: NewCodeReview = {
      pullRequestId: data.pull_request_id,
      status: data.status,
      startedAt: data.started_at ? new Date(data.started_at) : null,
      completedAt: data.completed_at ? new Date(data.completed_at) : null,
      primaryModel: data.primary_model || null,
      modelsUsed: data.models_used || null,
      totalTokensInput: data.total_tokens_input || null,
      totalTokensOutput: data.total_tokens_output || null,
      totalCost: data.total_cost || null,
      executionTimeMs: data.execution_time_ms || null,
      summary: data.summary as any || null,
      keyChanges: data.key_changes || null,
      recommendations: data.recommendations || null,
      positives: data.positives || null,
      summaryCommentId: data.summary_comment_id || null,
      summaryCommentUrl: data.summary_comment_url || null,
      inlineCommentsPosted: data.inline_comments_posted || null,
    };

    const review = await createCodeReview(reviewData);

    console.log(`✅ Created review record: ${review.id}`);
    console.log(`   PR ID: ${review.pullRequestId}`);
    console.log(`   Status: ${review.status}`);

    return NextResponse.json({
      success: true,
      id: review.id,
      pull_request_id: review.pullRequestId,
      status: review.status,
      created_at: review.createdAt,
    });
  } catch (error) {
    console.error("❌ Error creating review:", error);
    
    // Extract detailed error information
    let errorDetails = "Unknown error";
    if (error instanceof Error) {
      errorDetails = error.message;
      // Log the full error for debugging
      console.error("   Error name:", error.name);
      console.error("   Error message:", error.message);
      if (error.stack) {
        console.error("   Error stack:", error.stack.split('\n').slice(0, 5).join('\n'));
      }
      // Check if it's a database error with more details
      if ('code' in error) {
        console.error("   Database error code:", (error as any).code);
        console.error("   Database error detail:", (error as any).detail);
        errorDetails = `${error.message} (code: ${(error as any).code})`;
      }
    }
    
    return NextResponse.json(
      {
        error: "Failed to create review",
        details: errorDetails,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reviews?pull_request_id=xxx
 * Get review by pull request ID
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const reviewId = searchParams.get("id");

    if (!reviewId) {
      return NextResponse.json(
        { error: "Missing review id parameter" },
        { status: 400 }
      );
    }

    const review = await getCodeReviewById(reviewId);

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error("❌ Error fetching review:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch review",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
