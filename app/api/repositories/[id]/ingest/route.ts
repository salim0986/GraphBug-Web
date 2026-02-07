import { auth } from "@/auth";
import { db, githubRepositories, githubInstallations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ingestRepository } from "@/lib/ai-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const timestamp = new Date().toISOString();
  
  try {
    const session = await auth();
    const { id } = await params;
    
    console.log(`[${timestamp}] ========================================`);
    console.log(`[${timestamp}] 📥 INGESTION REQUEST RECEIVED`);
    console.log(`[${timestamp}] Repository ID: ${id}`);
    console.log(`[${timestamp}] User: ${session?.user?.id || 'unknown'}`);
    console.log(`[${timestamp}] ========================================`);
    
    if (!session?.user?.id) {
      console.error(`[${timestamp}] ❌ Unauthorized - No session`);
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
      console.error(`[${timestamp}] ❌ Repository not found: ${id}`);
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    if (!repo.installation) {
      console.error(`[${timestamp}] ❌ Installation not found for repository: ${id}`);
      return NextResponse.json({ error: "Installation not found for repository" }, { status: 404 });
    }

    console.log(`[${timestamp}] ✅ Repository found: ${repo.repo.fullName}`);
    console.log(`[${timestamp}] Installation ID: ${repo.installation.installationId}`);

    // Update status to processing
    await db
      .update(githubRepositories)
      .set({
        ingestionStatus: "processing",
        ingestionStartedAt: new Date(),
        ingestionError: null,
      })
      .where(eq(githubRepositories.id, id));

    console.log(`[${timestamp}] 📝 Database status updated to 'processing'`);

    // Trigger ingestion
    try {
      const ingestionData = {
        repo_url: `https://github.com/${repo.repo.fullName}.git`,
        repo_id: repo.repo.id,
        installation_id: repo.installation.installationId.toString(),
      };
      
      console.log(`[${timestamp}] 🚀 Triggering AI service ingestion...`);
      
      const result = await ingestRepository(ingestionData);

      console.log(`[${timestamp}] ✅ Ingestion successful, updating database...`);

      // Update status to completed
      await db
        .update(githubRepositories)
        .set({
          ingestionStatus: "completed",
          ingestionCompletedAt: new Date(),
          lastSyncedAt: new Date(),
        })
        .where(eq(githubRepositories.id, id));

      console.log(`[${timestamp}] ========================================`);
      console.log(`[${timestamp}] ✅ INGESTION COMPLETE`);
      console.log(`[${timestamp}] Repository: ${repo.repo.fullName}`);
      console.log(`[${timestamp}] ========================================`);

      return NextResponse.json({ success: true, result });

    } catch (error: any) {
      const errorTimestamp = new Date().toISOString();
      console.error(`[${errorTimestamp}] ========================================`);
      console.error(`[${errorTimestamp}] ❌ INGESTION FAILED`);
      console.error(`[${errorTimestamp}] Repository: ${repo.repo.fullName}`);
      console.error(`[${errorTimestamp}] Error: ${error.message || error}`);
      console.error(`[${errorTimestamp}] ========================================`);
      
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
    const errorTimestamp = new Date().toISOString();
    console.error(`[${errorTimestamp}] ========================================`);
    console.error(`[${errorTimestamp}] ❌ REQUEST ERROR`);
    console.error(`[${errorTimestamp}] Error triggering ingestion:`, error);
    console.error(`[${errorTimestamp}] ========================================`);
    return NextResponse.json(
      { error: error.message || "Failed to trigger ingestion" },
      { status: 500 }
    );
  }
}
