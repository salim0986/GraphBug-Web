import { db, githubInstallations, githubRepositories } from "@/db/schema";
import { Webhooks } from "@octokit/webhooks";
import { eq, and } from "drizzle-orm";

const webhooks = new Webhooks({
  secret: process.env.NEXT_PUBLIC_GITHUB_WEBHOOK_SECRET!,
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("x-hub-signature-256") || "";
  const event = req.headers.get("x-github-event") || "";

  // 1. Verify the signature
  const verified = await webhooks.verify(body, signature);
  if (!verified) {
    console.error("❌ Webhook signature verification failed");
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = JSON.parse(body);
  console.log(`📩 Webhook received: ${event}.${payload.action || 'n/a'}`);

  try {
    // Handle installation events
    if (event === "installation") {
      return await handleInstallationEvent(payload);
    }

    // Handle installation_repositories events (when user adds/removes repos)
    if (event === "installation_repositories") {
      return await handleInstallationRepositoriesEvent(payload);
    }

    // Handle pull request events
    if (event === "pull_request") {
      return await handlePullRequestEvent(payload);
    }

    console.log(`ℹ️ Unhandled event: ${event}`);
    return new Response("OK", { status: 200 });

  } catch (error) {
    console.error("❌ Webhook handler error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// Handle installation created/deleted
async function handleInstallationEvent(payload: any) {
  const { action, installation } = payload;
  const installationId = installation.id;

  if (action === "created") {
    console.log(`✅ App installed by ${installation.account.login}, ID: ${installationId}`);

    const installationData = {
      accountLogin: installation.account.login,
      accountType: installation.account.type,
      targetType: installation.target_type,
      permissions: JSON.stringify(installation.permissions),
      repositorySelection: installation.repository_selection,
      suspended: false,
      installedAt: new Date(installation.created_at),
      updatedAt: new Date(installation.updated_at),
    };

    // Check if installation already exists (from setup callback)
    const [existing] = await db
      .select()
      .from(githubInstallations)
      .where(eq(githubInstallations.installationId, installationId));

    let createdInstallation;

    if (existing) {
      // Update existing record, preserve userId if it exists
      [createdInstallation] = await db
        .update(githubInstallations)
        .set({
          ...installationData,
          userId: existing.userId, // Preserve userId from setup callback
          updatedAt: new Date(),
        })
        .where(eq(githubInstallations.installationId, installationId))
        .returning();
      
      console.log(`✅ Updated existing installation ${installationId} with real data (userId preserved: ${existing.userId || 'none'})`);
    } else {
      // Create new record (userId will be set by setup callback later or remain null)
      [createdInstallation] = await db
        .insert(githubInstallations)
        .values({
          userId: null as any,
          installationId: installationId,
          ...installationData,
        })
        .returning();
      
      console.log(`✅ Created new installation ${installationId} (userId will be set by setup callback)`);
    }

    // Add repositories to database (without triggering ingestion)
    if (installation.repository_selection === "selected" && payload.repositories) {
      // Specific repos were selected
      await addRepositories(createdInstallation.id, payload.repositories);
    } else if (installation.repository_selection === "all") {
      // All repositories - need to fetch them from GitHub API
      await fetchAndAddAllRepositories(installationId, createdInstallation.id);
    }

  } else if (action === "deleted") {
    console.log(`🗑️  App uninstalled, installation ID: ${installationId}`);
    
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    
    // Find the installation to get all its repositories
    const [installationRecord] = await db
      .select()
      .from(githubInstallations)
      .where(eq(githubInstallations.installationId, installationId));

    if (installationRecord) {
      // Get all repositories for this installation
      const repos = await db
        .select()
        .from(githubRepositories)
        .where(eq(githubRepositories.installationId, installationRecord.id));

      // Delete AI service data for each repository
      for (const repo of repos) {
        try {
          const deleteResponse = await fetch(`${AI_SERVICE_URL}/repos/${repo.id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
          });

          if (deleteResponse.ok) {
            console.log(`🧹 AI service data deleted for ${repo.fullName}`);
          } else {
            console.error(`⚠️ Failed to delete AI service data for ${repo.fullName}`);
          }
        } catch (aiError) {
          console.error(`⚠️ AI service delete error for ${repo.fullName}:`, aiError);
        }
      }
    }
    
    // Delete installation (cascade will handle repos in database)
    await db
      .delete(githubInstallations)
      .where(eq(githubInstallations.installationId, installationId));

    console.log(`✅ Installation ${installationId} removed from database`);
  }

  return new Response("OK", { status: 200 });
}

// Handle repository additions/removals
async function handleInstallationRepositoriesEvent(payload: any) {
  const { action, installation, repositories_added, repositories_removed } = payload;
  const installationId = installation.id;

  // Find our installation record
  const [installationRecord] = await db
    .select()
    .from(githubInstallations)
    .where(eq(githubInstallations.installationId, installationId));

  if (!installationRecord) {
    console.error(`❌ Installation ${installationId} not found in database`);
    return new Response("Installation not found", { status: 404 });
  }

  if (action === "added" && repositories_added?.length > 0) {
    console.log(`➕ Adding ${repositories_added.length} repositories to installation ${installationId}`);
    await addRepositories(installationRecord.id, repositories_added);
  }

  if (action === "removed" && repositories_removed?.length > 0) {
    console.log(`➖ Removing ${repositories_removed.length} repositories from installation ${installationId}`);
    await removeRepositories(installationRecord.id, repositories_removed);
  }

  return new Response("OK", { status: 200 });
}

// Handle pull request events
async function handlePullRequestEvent(payload: any) {
  const { action, pull_request, installation } = payload;

  if (action === "opened" || action === "synchronize") {
    console.log(`🔍 PR ${action}: ${pull_request.html_url}`);
    
    // TODO: Trigger AI review here
    // For now, just log it
    console.log(`ℹ️ Would trigger AI review for PR #${pull_request.number} in ${pull_request.base.repo.full_name}`);
  }

  return new Response("OK", { status: 200 });
}

// Helper: Add repositories and trigger ingestion
async function addRepositories(installationDbId: string, repos: any[]) {
  for (const repo of repos) {
    try {
      // Check if repo already exists (avoid duplicates)
      const existing = await db
        .select()
        .from(githubRepositories)
        .where(
          and(
            eq(githubRepositories.installationId, installationDbId),
            eq(githubRepositories.repoId, repo.id)
          )
        );

      if (existing.length > 0) {
        console.log(`ℹ️ Repository ${repo.full_name} already exists, skipping`);
        continue;
      }

      // Insert new repository
      const [repoRecord] = await db
        .insert(githubRepositories)
        .values({
          installationId: installationDbId,
          repoId: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          private: repo.private,
          addedAt: new Date(),
          ingestionStatus: "not_reviewed",
        })
        .returning();

      console.log(`✅ Repository ${repo.full_name} added to database (status: not_reviewed)`);

    } catch (error) {
      console.error(`❌ Failed to add repository ${repo.full_name}:`, error);
    }
  }
}

// Helper: Remove repositories
async function removeRepositories(installationDbId: string, repos: any[]) {
  const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  
  for (const repo of repos) {
    try {
      // First, find the repository in our database to get the UUID
      const [repoRecord] = await db
        .select()
        .from(githubRepositories)
        .where(
          and(
            eq(githubRepositories.installationId, installationDbId),
            eq(githubRepositories.repoId, repo.id)
          )
        );

      if (repoRecord) {
        // Call ai-service to delete vector and graph data
        try {
          const deleteResponse = await fetch(`${AI_SERVICE_URL}/repos/${repoRecord.id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
          });

          if (deleteResponse.ok) {
            console.log(`🧹 AI service data deleted for ${repo.full_name}`);
          } else {
            console.error(`⚠️ Failed to delete AI service data for ${repo.full_name}: ${deleteResponse.status}`);
          }
        } catch (aiError) {
          console.error(`⚠️ AI service delete error for ${repo.full_name}:`, aiError);
          // Continue with database deletion even if AI service fails
        }
      }

      // Delete from our database
      await db
        .delete(githubRepositories)
        .where(
          and(
            eq(githubRepositories.installationId, installationDbId),
            eq(githubRepositories.repoId, repo.id)
          )
        );

      console.log(`✅ Repository ${repo.full_name} removed from database`);
    } catch (error) {
      console.error(`❌ Failed to remove repository ${repo.full_name}:`, error);
    }
  }
}

// Helper: Fetch all repositories for an installation from GitHub API
async function fetchAndAddAllRepositories(installationId: number, installationDbId: string) {
  try {
    console.log(`🔍 Fetching all repositories for installation ${installationId}...`);
    
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_GITHUB_APP_ID) {
      throw new Error("NEXT_PUBLIC_GITHUB_APP_ID environment variable is not set");
    }
    if (!process.env.NEXT_PUBLIC_GITHUB_PRIVATE_KEY) {
      throw new Error("NEXT_PUBLIC_GITHUB_PRIVATE_KEY environment variable is not set");
    }
    
    // Use App auth to get installation access token
    const { App } = await import("octokit");
    
    const app = new App({
      appId: process.env.NEXT_PUBLIC_GITHUB_APP_ID,
      privateKey: process.env.NEXT_PUBLIC_GITHUB_PRIVATE_KEY,
    });

    console.log(`🔐 Getting installation octokit for installation ${installationId}...`);
    const octokit = await app.getInstallationOctokit(installationId);

    console.log(`📡 Fetching repositories from GitHub API...`);
    // Fetch all repositories for this installation
    const { data: response } = await octokit.rest.apps.listReposAccessibleToInstallation();
    
    console.log(`📦 Found ${response.repositories.length} repositories for installation ${installationId}`);
    
    // Add each repository to database
    if (response.repositories.length > 0) {
      await addRepositories(installationDbId, response.repositories);
    } else {
      console.log(`⚠️ No repositories found for installation ${installationId}`);
    }
    
  } catch (error: any) {
    console.error(`❌ Failed to fetch repositories for installation ${installationId}:`, error);
    console.error(`❌ Error details:`, error.message);
    console.error(`❌ Error stack:`, error.stack);
  }
}