/**
 * Review Comments API Endpoint
 * Handles review comment creation for AI service integration
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createReviewComment, type NewReviewComment } from "@/db/queries";

const CreateCommentSchema = z.object({
  review_id: z.string().uuid(),
  file_path: z.string(),
  start_line: z.number().int().positive().nullable().optional(),
  end_line: z.number().int().positive().nullable().optional(),
  severity: z.enum(["info", "low", "medium", "high", "critical"]),
  category: z.enum(["security", "performance", "bug", "code_quality", "best_practice", "documentation", "testing", "accessibility", "maintainability"]),
  title: z.string(),
  message: z.string(),
  suggestion: z.string().nullable().optional(),
  code_snippet: z.string().nullable().optional(),
  github_comment_id: z.number().int().optional(),
  github_comment_url: z.string().optional(),
});

export type CreateCommentRequest = z.infer<typeof CreateCommentSchema>;

/**
 * POST /api/review_comments
 * Create a new review comment
 * Called by ai-service to store review comments
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const validation = CreateCommentSchema.safeParse(body);

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

    // Create comment record
    const commentData: NewReviewComment = {
      reviewId: data.review_id,
      filePath: data.file_path,
      startLine: data.start_line ?? null,
      endLine: data.end_line ?? null,
      severity: data.severity,
      category: data.category,
      title: data.title,
      message: data.message,
      suggestion: data.suggestion ?? null,
      codeSnippet: data.code_snippet ?? null,
      githubCommentId: data.github_comment_id ?? null,
      githubCommentUrl: data.github_comment_url ?? null,
    };

    const comment = await createReviewComment(commentData);

    console.log(`✅ Created review comment: ${comment.id}`);
    console.log(`   Review ID: ${comment.reviewId}`);
    console.log(`   File: ${comment.filePath}`);
    console.log(`   Severity: ${comment.severity}`);

    return NextResponse.json({
      success: true,
      id: comment.id,
      review_id: comment.reviewId,
      file_path: comment.filePath,
      created_at: comment.createdAt,
    });
  } catch (error) {
    console.error("❌ Error creating review comment:", error);
    return NextResponse.json(
      {
        error: "Failed to create review comment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
