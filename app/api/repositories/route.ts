import { auth } from "@/auth";
import { db, githubInstallations, githubRepositories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's installations
    const installations = await db
      .select()
      .from(githubInstallations)
      .where(eq(githubInstallations.userId, session.user.id));

    console.log(`📊 [/api/repositories] Found ${installations.length} installations for user ${session.user.id}`);

    if (installations.length === 0) {
      console.log(`   ℹ️ No installations found - user needs to install GitHub App`);
      return NextResponse.json({
        installations: [],
        repositories: [],
        stats: {
          totalRepos: 0,
          activeRepos: 0,
          processing: 0,
          failed: 0,
        }
      });
    }

    // Get all repositories for these installations
    const installationIds = installations.map(i => i.id);
    const allRepositories = [];
    
    for (const installationId of installationIds) {
      const repos = await db
        .select()
        .from(githubRepositories)
        .where(eq(githubRepositories.installationId, installationId));
      
      console.log(`   Installation ${installationId}: Found ${repos.length} repositories`);
      if (repos.length === 0) {
        console.warn(`      ⚠️ Installation has NO repositories! Possible causes:`);
        console.warn(`         - Webhook hasn't fired yet (retry in 5s)`);
        console.warn(`         - Webhook fired but repositories weren't included in payload`);
        console.warn(`         - "All repositories" selected but GitHub API fetch failed`);
      }
      allRepositories.push(...repos);
    }

    // Calculate stats
    const stats = {
      totalRepos: allRepositories.length,
      activeRepos: allRepositories.filter(r => r.ingestionStatus === "completed").length,
      processing: allRepositories.filter(r => r.ingestionStatus === "processing").length,
      failed: allRepositories.filter(r => r.ingestionStatus === "failed").length,
    };

    return NextResponse.json({
      installations,
      repositories: allRepositories,
      stats,
    });

  } catch (error) {
    console.error("Error fetching repositories:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}
