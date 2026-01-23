import { auth } from "@/auth";
import { db, githubRepositories, githubInstallations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ingestRepository } from "@/lib/ai-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the repository with installation info
    const [repo] = await db
      .select({
        repo: githubRepositories,
        installation: githubInstallations,
      })
      .from(githubRepositories)
      .leftJoin(
        githubInstallations,
        eq(githubRepositories.installationId, githubInstallations.id)
      )
      .where(eq(githubRepositories.id, id));

    if (!repo || !repo.repo) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    if (!repo.installation) {
      return NextResponse.json({ error: "Installation not found for repository" }, { status: 404 });
    }

    // Update status to processing
    await db
      .update(githubRepositories)
      .set({
        ingestionStatus: "processing",
        ingestionStartedAt: new Date(),
        ingestionError: null,
      })
      .where(eq(githubRepositories.id, id));

    // Trigger ingestion
    try {
      const result = await ingestRepository({
        repo_url: `https://github.com/${repo.repo.fullName}.git`,
        repo_id: repo.repo.id,
        installation_id: repo.installation.installationId.toString(),
      });

      // Update status to completed
      await db
        .update(githubRepositories)
        .set({
          ingestionStatus: "completed",
          ingestionCompletedAt: new Date(),
          lastSyncedAt: new Date(),
        })
        .where(eq(githubRepositories.id, id));

      return NextResponse.json({ success: true, result });

    } catch (error: any) {
      // Update status to failed
      await db
        .update(githubRepositories)
        .set({
          ingestionStatus: "failed",
          ingestionError: error.message || "Unknown error",
        })
        .where(eq(githubRepositories.id, id));

      throw error;
    }

  } catch (error: any) {
    console.error("Error triggering ingestion:", error);
    return NextResponse.json(
      { error: error.message || "Failed to trigger ingestion" },
      { status: 500 }
    );
  }
}
