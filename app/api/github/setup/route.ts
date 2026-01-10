import { auth } from "@/auth";
import { db, githubInstallations } from "@/db/schema";
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

  console.log(`User ${session.user.email} completed setup for installation ${installationId}`);

  // Link the installation to the user
  // The webhook may have already created the installation with real data
  try {
    // Check if installation already exists (from webhook)
    const [existing] = await db
      .select()
      .from(githubInstallations)
      .where(eq(githubInstallations.installationId, parseInt(installationId)));

    if (existing) {
      // Installation exists (webhook fired first), just update userId
      await db
        .update(githubInstallations)
        .set({ 
          userId: session.user.id, 
          updatedAt: new Date() 
        })
        .where(eq(githubInstallations.installationId, parseInt(installationId)));
      
      console.log(`✅ Linked existing installation ${installationId} to user ${session.user.email}`);
    } else {
      // Installation doesn't exist yet (webhook hasn't fired), create minimal record
      console.log(`Creating minimal installation record for ID ${installationId}, webhook will populate details`);
      
      await db.insert(githubInstallations).values({
        userId: session.user.id,
        installationId: parseInt(installationId),
        accountLogin: "pending", // Will be updated by webhook
        accountType: "pending",
        targetType: "pending",
        installedAt: new Date(),
        updatedAt: new Date(),
      });
      
      console.log(`✅ Created installation ${installationId} with userId ${session.user.id}, awaiting webhook data`);
    }
  } catch (error) {
    console.error("Error creating/updating installation:", error);
  }

  // Redirect back to dashboard with success message
  return NextResponse.redirect(new URL("/dashboard?setup=success", req.url));
}
