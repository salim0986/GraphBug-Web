import { db, githubInstallations, githubRepositories, users, pullRequests } from "@/db/schema";
import { Webhooks } from "@octokit/webhooks";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { decryptApiKey, signServiceRequest } from "@/lib/encryption";

const webhooks = new Webhooks({
  secret: process.env.GITHUB_WEBHOOK_SECRET!,
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
    console.log(`\n✅ [WEBHOOK] App installed`);
    console.log(`   Account: ${installation.account.login} (${installation.account.type})`);
    console.log(`   Installation ID: ${installationId}`);
    console.log(`   Repository Selection: ${installation.repository_selection}`);
    console.log(`   Repositories in payload: ${payload.repositories?.length || 0}`);

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
    const existing = await db
      .select()
      .from(githubInstallations)
      .where(eq(githubInstallations.installationId, installationId));

    let createdInstallation;

    if (existing.length > 0) {
      // Update existing record, preserve userId if it exists
      [createdInstallation] = await db
        .update(githubInstallations)
        .set({
          ...installationData,
          userId: existing[0].userId, // Preserve userId from setup callback
          updatedAt: new Date(),
        })
        .where(eq(githubInstallations.installationId, installationId))
        .returning();
      
      console.log(`   ℹ️ Installation already existed (setup callback ran first)`);
      console.log(`      Updated with webhook data, userId preserved: ${existing[0].userId || '(none yet)'}`);
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
      
      console.log(`   ✅ Created new installation record (userId will be set by setup callback)`);
      console.log(`      Record ID: ${createdInstallation.id}`);
    }

    // Add repositories to database (without triggering ingestion)
    if (installation.repository_selection === "selected" && payload.repositories) {
      // Specific repos were selected
      console.log(`   📚 Adding ${payload.repositories.length} selected repositories...`);
      await addRepositories(createdInstallation.id, payload.repositories);
    } else if (installation.repository_selection === "all") {
      // All repositories - need to fetch them from GitHub API
      console.log(`   📚 Fetching all repositories from GitHub API...`);
      await fetchAndAddAllRepositories(installationId, createdInstallation.id);
    } else {
      console.log(`   ⚠️ Unknown repository selection: ${installation.repository_selection}`);
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
  const { action, pull_request, installation, repository } = payload;

  // Trigger review on PR open or update (new commits pushed)
  if (action === "opened" || action === "synchronize") {
    console.log(`🔍 PR ${action}: ${pull_request.html_url}`);
    console.log(`   Repository: ${repository.full_name} (ID: ${repository.id})`);
    console.log(`   Installation ID: ${installation.id}`);
    
    // Find the installation record
    const [installationRecord] = await db
      .select()
      .from(githubInstallations)
      .where(eq(githubInstallations.installationId, installation.id));

    if (!installationRecord) {
      console.error(`❌ Installation ${installation.id} not found in database`);
      return new Response("Installation not found", { status: 404 });
    }
    
    console.log(`✅ Installation found in DB (ID: ${installationRecord.id}, User: ${installationRecord.userId || 'null'})`);

    // Check if this repository is in our database and has been ingested
    const [repoRecord] = await db
      .select()
      .from(githubRepositories)
      .where(
        and(
          eq(githubRepositories.installationId, installationRecord.id),
          eq(githubRepositories.repoId, repository.id)
        )
      );

    if (!repoRecord) {
      console.log(`ℹ️ Repository ${repository.full_name} not found in database`);
      console.log(`   Looking for: installationId=${installationRecord.id}, repoId=${repository.id}`);
      console.log(`   Creating repository record and triggering review...`);
      
      // Create repository record if it doesn't exist
      const [newRepoRecord] = await db
        .insert(githubRepositories)
        .values({
          installationId: installationRecord.id,
          repoId: repository.id,
          name: repository.name,
          fullName: repository.full_name,
          private: repository.private,
          addedAt: new Date(),
          ingestionStatus: "pending",
        })
        .returning();
      
      console.log(`✅ Repository record created (ID: ${newRepoRecord.id})`);
      console.log(`🤖 Triggering AI review for PR #${pull_request.number} in ${repository.full_name}`);
      await triggerAICodeReview(newRepoRecord.id, pull_request, installation.id, installationRecord.userId);
      return new Response("OK", { status: 200 });
    }
    
    console.log(`✅ Repository found in DB (Status: ${repoRecord.ingestionStatus})`);

    // Trigger AI code review regardless of ingestion status
    console.log(`🤖 Triggering AI review for PR #${pull_request.number} in ${repository.full_name}`);
    await triggerAICodeReview(repoRecord.id, pull_request, installation.id, installationRecord.userId);
  }

  // Trigger auto-ingestion on PR merge (Phase 8)
  if (action === "closed" && pull_request.merged === true) {
    console.log(`✅ PR merged: ${pull_request.html_url}`);
    
    // Find the installation record
    const [installationRecord] = await db
      .select()
      .from(githubInstallations)
      .where(eq(githubInstallations.installationId, installation.id));

    if (!installationRecord) {
      console.error(`❌ Installation ${installation.id} not found`);
      return new Response("Installation not found", { status: 404 });
    }

    // Check if this repository is in our database
    const [repoRecord] = await db
      .select()
      .from(githubRepositories)
      .where(
        and(
          eq(githubRepositories.installationId, installationRecord.id),
          eq(githubRepositories.repoId, repository.id)
        )
      );

    if (!repoRecord) {
      console.log(`ℹ️ Repository ${repository.full_name} not found in database, skipping auto-ingestion`);
      return new Response("OK", { status: 200 });
    }

    // Trigger auto-ingestion to update permanent database
    console.log(`📦 Triggering auto-ingestion for ${repository.full_name} after PR #${pull_request.number} merge`);
    await triggerAutoIngestion(repoRecord, repository, installation.id);
  }

  return new Response("OK", { status: 200 });
}



// Trigger AI-powered code review for a pull request
async function triggerAICodeReview(repoDbId: string, pullRequest: any, installationId: number, userId: string | null) {
  try {
    console.log(`📝 Starting AI review for PR #${pullRequest.number}: ${pullRequest.title}`);
    
    // Create or update PR record in database
    console.log(`💾 Creating/updating PR record in database...`);
    
    let prRecord;
    try {
      // Try to find existing PR first
      const existing = await db
        .select()
        .from(pullRequests)
        .where(
          and(
            eq(pullRequests.repositoryId, repoDbId),
            eq(pullRequests.prNumber, pullRequest.number)
          )
        )
        .limit(1);
      
      if (existing.length > 0) {
        // Update existing PR
        console.log(`   Found existing PR record, updating...`);
        [prRecord] = await db
          .update(pullRequests)
          .set({
            title: pullRequest.title,
            description: pullRequest.body || null,
            headCommitSha: pullRequest.head.sha,
            filesChanged: pullRequest.changed_files || 0,
            additions: pullRequest.additions || 0,
            deletions: pullRequest.deletions || 0,
            totalChanges: (pullRequest.additions || 0) + (pullRequest.deletions || 0),
            updatedAt: new Date(),
          })
          .where(eq(pullRequests.id, existing[0].id))
          .returning();
      } else {
        // Create new PR
        console.log(`   Creating new PR record...`);
        [prRecord] = await db
          .insert(pullRequests)
          .values({
            prNumber: pullRequest.number,
            prId: pullRequest.id,
            repositoryId: repoDbId,
            title: pullRequest.title,
            description: pullRequest.body || null,
            author: pullRequest.user.login,
            authorAvatarUrl: pullRequest.user.avatar_url,
            htmlUrl: pullRequest.html_url,
            diffUrl: pullRequest.diff_url,
            patchUrl: pullRequest.patch_url,
            baseBranch: pullRequest.base.ref,
            headBranch: pullRequest.head.ref,
            baseCommitSha: pullRequest.base.sha,
            headCommitSha: pullRequest.head.sha,
            status: pullRequest.state === "closed" ? "closed" : "open",
            isDraft: pullRequest.draft || false,
            filesChanged: pullRequest.changed_files || 0,
            additions: pullRequest.additions || 0,
            deletions: pullRequest.deletions || 0,
            totalChanges: (pullRequest.additions || 0) + (pullRequest.deletions || 0),
            reviewStatus: "pending",
            reviewRequestedAt: new Date(),
          })
          .returning();
      }
      
      console.log(`✅ PR record ${existing.length > 0 ? 'updated' : 'created'} (ID: ${prRecord.id})`);
    } catch (dbError) {
      console.error(`❌ Failed to create/update PR record in database!`);
      console.error(`   Error:`, dbError);
      if (dbError instanceof Error) {
        console.error(`   Message: ${dbError.message}`);
        if ('code' in dbError) {
          console.error(`   DB Error Code: ${(dbError as any).code}`);
          console.error(`   DB Error Detail: ${(dbError as any).detail}`);
        }
      }
      throw dbError; // Re-throw to be caught by outer try-catch
    }
    
    // M7: resolve provider + API key from user record.
    // Priority: apiKeys[preferredProvider] → legacy geminiApiKey (gemini only).
    let resolvedApiKey: string | null = null;
    let resolvedProvider = "gemini";

    if (userId) {
      const [user] = await db
        .select({
          geminiApiKey: users.geminiApiKey,
          apiKeys: users.apiKeys,
          preferredProvider: users.preferredProvider,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      resolvedProvider = user?.preferredProvider ?? "gemini";

      // Try new multi-provider apiKeys column first
      if (user?.apiKeys) {
        const encryptedKey = (user.apiKeys as Record<string, string>)[resolvedProvider];
        if (encryptedKey) {
          try {
            resolvedApiKey = decryptApiKey(encryptedKey);
            console.log(`✅ Using user's ${resolvedProvider} API key (M7 apiKeys column)`);
          } catch (err) {
            console.error(`❌ Failed to decrypt ${resolvedProvider} key from apiKeys:`, err);
          }
        }
      }

      // Fall back to legacy geminiApiKey column for gemini provider
      if (!resolvedApiKey && resolvedProvider === "gemini" && user?.geminiApiKey) {
        try {
          resolvedApiKey = decryptApiKey(user.geminiApiKey);
          console.log(`✅ Using user's Gemini API key (legacy column)`);
        } catch (err) {
          console.error(`❌ Failed to decrypt legacy Gemini API key:`, err);
        }
      }

      if (!resolvedApiKey) {
        console.warn(`⚠️ User ${userId} has no API key for provider "${resolvedProvider}", review will be skipped`);
        return;
      }
    } else {
      console.warn(`⚠️ No user associated with installation ${installationId}, review will be skipped`);
      return;
    }

    // Kept for backward compat with older ai-service deployments that only read gemini_api_key
    const geminiApiKey = resolvedProvider === "gemini" ? resolvedApiKey : null;
    
    // Get PR details
    const prNumber = pullRequest.number;
    const prUrl = pullRequest.html_url;
    const repoFullName = pullRequest.base.repo.full_name;
    const [owner, repo] = repoFullName.split('/');
    
    console.log(`✅ AI review queued for PR #${prNumber} in ${repoFullName}`);
    console.log(`   📎 PR URL: ${prUrl}`);
    console.log(`   🔬 Changed files: ${pullRequest.changed_files || 'unknown'}`);
    console.log(`   ➕ Additions: +${pullRequest.additions || 0}`);
    console.log(`   ➖ Deletions: -${pullRequest.deletions || 0}`);
    
    // Step 1: Build PR context with file contents
    console.log(`🔨 Building full PR context with file contents...`);
    const { GitHubAPIClient } = await import("@/lib/github-pr");
    const { buildPRContext, prepareForAIReview } = await import("@/lib/pr-context");
    
    const client = new GitHubAPIClient(installationId);
    const context = await buildPRContext(client, owner, repo, prNumber, {
      includeFileContents: true,
      includeCommits: true,
      contextLines: 10,
      maxFilesToFetch: 50,
    });
    
    const aiContext = prepareForAIReview(context);
    console.log(`✅ PR context built: ${aiContext.files.length} files with contents`);
    
    // Trigger AI review workflow with full context
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    console.log(`🚀 Triggering AI review workflow with full context in ai-service...`);
    console.log(`   🌐 AI Service URL: ${aiServiceUrl}/review`);
    
    try {
      const reviewPayload = {
        owner,
        repo,
        pr_number: prNumber,
        installation_id: installationId.toString(),
        repo_db_id: repoDbId,
        pull_request_id: prRecord.id,
        // M7: provider-agnostic fields (ai-service prefers these)
        provider: resolvedProvider,
        api_key: resolvedApiKey,
        // Legacy field for backward compat with older ai-service deployments
        gemini_api_key: geminiApiKey,
        // CRITICAL: Include full context
        context: aiContext,
      };
      
      console.log(`   📦 Sending payload with context:`, {
        owner,
        repo,
        pr_number: prNumber,
        installation_id: installationId.toString(),
        repo_db_id: repoDbId,
        pull_request_id: prRecord.id,
        has_gemini_key: !!geminiApiKey,
        context_files: aiContext.files.length,
        context_size_kb: Math.round(JSON.stringify(aiContext).length / 1024),
      });
      
      // M12: sign the request so ai-service can verify it came from us
      const reviewBody = JSON.stringify(reviewPayload);
      const serviceSig = signServiceRequest(reviewBody);
      const reviewHeaders: Record<string, string> = { "Content-Type": "application/json" };
      if (serviceSig) reviewHeaders["X-Service-Signature"] = serviceSig;

      const reviewResponse = await fetch(`${aiServiceUrl}/review`, {
        method: "POST",
        headers: reviewHeaders,
        body: reviewBody,
        signal: AbortSignal.timeout(30000),
      });

      console.log(`   📡 AI service response status: ${reviewResponse.status} ${reviewResponse.statusText}`);

      if (!reviewResponse.ok) {
        const errorText = await reviewResponse.text();
        console.error(`❌ AI service returned error: ${reviewResponse.status}`);
        console.error(`   Response body: ${errorText}`);
        throw new Error(`AI service error: ${reviewResponse.status} - ${errorText}`);
      }

      const reviewData = await reviewResponse.json();
      console.log(`✅ AI review workflow started successfully!`);
      console.log(`   🔑 Review ID: ${reviewData.review_id || 'N/A'}`);
      console.log(`   📊 Status: ${reviewData.status}`);
      console.log(`   ⏱️  Estimated time: ${reviewData.estimated_time || 'Unknown'}`);
    } catch (aiError) {
      console.error(`❌ CRITICAL: Failed to trigger AI service!`);
      console.error(`   🌐 Target URL: ${aiServiceUrl}/review`);
      console.error(`   ❗ Error type: ${aiError instanceof Error ? aiError.constructor.name : typeof aiError}`);
      console.error(`   💬 Error message: ${aiError instanceof Error ? aiError.message : String(aiError)}`);
      if (aiError instanceof Error && aiError.stack) {
        console.error(`   📚 Stack trace: ${aiError.stack.split('\n').slice(0, 3).join('\n')}`);
      }
      console.error(`   ⚙️  Make sure ai-service is running on ${aiServiceUrl}`);
      console.error(`   💡 Check: 1) Service is running, 2) Port is correct, 3) No firewall blocking`);
      // Don't throw - we've already saved the PR, just log the error
    }
    
  } catch (error) {
    console.error(`❌ Failed to trigger AI review:`, error);
    throw error;
  }
}

// Trigger auto-ingestion after PR merge (Phase 8)
async function triggerAutoIngestion(repoRecord: any, repository: any, installationId: number) {
  try {
    console.log(`📦 Starting auto-ingestion for ${repository.full_name}`);
    console.log(`   📊 Current ingestion status: ${repoRecord.ingestionStatus}`);
    
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    
    // Update ingestion status to "in_progress"
    await db
      .update(githubRepositories)
      .set({
        ingestionStatus: "in_progress",
        ingestionStartedAt: new Date(),
      })
      .where(eq(githubRepositories.id, repoRecord.id));
    
    console.log(`🔄 Ingestion status updated to "in_progress"`);
    
    // Construct clone URL with authentication
    // For GitHub App, use installation token (we'll pass installation_id to ai-service)
    const cloneUrl = repository.clone_url;
    
    // Call ai-service /ingest endpoint
    const ingestResponse = await fetch(`${AI_SERVICE_URL}/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        repo_url: cloneUrl,
        repo_id: repoRecord.id,
        installation_id: installationId.toString(),
      }),
    });

    if (!ingestResponse.ok) {
      const errorText = await ingestResponse.text();
      console.error(`❌ AI service ingestion failed: ${ingestResponse.status} ${errorText}`);
      
      // Update ingestion status to "failed"
      await db
        .update(githubRepositories)
        .set({
          ingestionStatus: "failed",
          ingestionCompletedAt: new Date(),
        })
        .where(eq(githubRepositories.id, repoRecord.id));
      
      throw new Error(`AI service ingestion failed: ${ingestResponse.status}`);
    }

    const ingestData = await ingestResponse.json();
    console.log(`✅ Auto-ingestion queued:`, ingestData);
    console.log(`   🔑 Repo ID: ${repoRecord.id}`);
    console.log(`   📦 Status: ${ingestData.status}`);
    
    // Note: Ingestion happens in background, status will be updated by ai-service webhook or polling
    console.log(`⏳ Ingestion running in background for ${repository.full_name}`);
    
  } catch (error) {
    console.error(`❌ Failed to trigger auto-ingestion:`, error);
    
    // Update ingestion status to "failed"
    try {
      await db
        .update(githubRepositories)
        .set({
          ingestionStatus: "failed",
          ingestionCompletedAt: new Date(),
        })
        .where(eq(githubRepositories.id, repoRecord.id));
    } catch (dbError) {
      console.error(`❌ Failed to update ingestion status:`, dbError);
    }
  }
}

// Helper: Add repositories and trigger ingestion
async function addRepositories(installationDbId: string, repos: any[]) {
  console.log(`\n📦 [addRepositories] Processing ${repos.length} repositories`);
  
  let added = 0;
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
        console.log(`   ℹ️ ${repo.full_name} - already exists, skipping`);
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
          ingestionStatus: "pending",
        })
        .returning();

      console.log(`   ✅ ${repo.full_name} - added to database`);
      added++;

    } catch (error) {
      console.error(`   ❌ ${repo.full_name} - failed to add:`, error);
    }
  }
  
  console.log(`✅ Added ${added}/${repos.length} repositories successfully\n`);
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
    if (!process.env.GITHUB_PRIVATE_KEY) {
      throw new Error("GITHUB_PRIVATE_KEY environment variable is not set");
    }
    
    // Use App auth to get installation access token
    const { App } = await import("octokit");
    
    const app = new App({
      appId: process.env.NEXT_PUBLIC_GITHUB_APP_ID,
      privateKey: process.env.GITHUB_PRIVATE_KEY,
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