import { auth } from "@/auth";
import { db, githubInstallations, githubRepositories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * This endpoint handles the GitHub App setup callback
 * GitHub redirects here after a user installs/configures your app
 * This is where we CAN access the user's session
 */
export async function GET(req: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const { searchParams } = new URL(req.url);
  const installationId = searchParams.get("installation_id");
  const setupAction = searchParams.get("setup_action");

  if (!installationId) {
    return NextResponse.redirect(new URL("/dashboard?error=no_installation", req.url));
  }

  console.log(`\n🔗 [SETUP CALLBACK] User ${session.user.email} completing setup`);
  console.log(`   Installation ID: ${installationId}`);
  console.log(`   Action: ${setupAction}`);

  try {
    // Check if installation already exists (from webhook)
    const existing = await db
      .select()
      .from(githubInstallations)
      .where(eq(githubInstallations.installationId, parseInt(installationId)));

    console.log(`   Checking for existing installation... Found: ${existing.length}`);

    if (existing.length > 0) {
      // Installation exists (webhook fired first), just update userId
      const [updated] = await db
        .update(githubInstallations)
        .set({ 
          userId: session.user.id, 
          updatedAt: new Date() 
        })
        .where(eq(githubInstallations.installationId, parseInt(installationId)))
        .returning();
      
      console.log(`   ✅ Linked existing installation to user ${session.user.email}`);
      console.log(`      Installation record ID: ${updated.id}`);
      
      // Verify repos are there
      const repos = await db
        .select()
        .from(githubRepositories)
        .where(eq(githubRepositories.installationId, updated.id));
      console.log(`      Repositories available: ${repos.length}`);
      if (repos.length === 0) {
        console.warn(`      ⚠️ WARNING: No repositories found yet!`);
        console.warn(`      This is normal if webhook hasn't processed yet (wait 5-10 seconds)`);
      }
    } else {
      // Installation doesn't exist yet (webhook hasn't fired), create minimal record
      console.log(`   ⏳ Installation not found - creating placeholder`);
      console.log(`      (Webhook will populate details when it fires)`);
      
      const [newInstall] = await db.insert(githubInstallations).values({
        userId: session.user.id,
        installationId: parseInt(installationId),
        accountLogin: "pending", // Will be updated by webhook
        accountType: "pending",
        targetType: "pending",
        installedAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
      
      console.log(`   ✅ Created placeholder installation`);
      console.log(`      Installation record ID: ${newInstall.id}`);
      console.log(`      Waiting for webhook to populate repository list...`);
    }
  } catch (error) {
    console.error("❌ Error creating/updating installation:", error);
  }

  console.log(`🔄 Redirecting user to dashboard...\n`);
  // Redirect back to dashboard with success message
  return NextResponse.redirect(new URL("/dashboard?setup=success", req.url));
}
