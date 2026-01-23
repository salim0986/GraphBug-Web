import { auth } from "@/auth";
import { db, githubInstallations } from "@/db/schema";
import { NextResponse } from "next/server";

/**
 * Debug endpoint to check installation status
 */
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all installations (including unlinked ones)
    const allInstallations = await db
      .select({
        id: githubInstallations.id,
        userId: githubInstallations.userId,
        installationId: githubInstallations.installationId,
        accountLogin: githubInstallations.accountLogin,
        accountType: githubInstallations.accountType,
      })
      .from(githubInstallations);

    // Get user's linked installations
    const userInstallations = allInstallations.filter(
      i => i.userId === session.user?.id
    );

    // Get unlinked installations
    const unlinkedInstallations = allInstallations.filter(
      i => i.userId === null
    );

    return NextResponse.json({
      currentUser: {
        id: session.user.id,
        email: session.user.email,
      },
      totalInstallations: allInstallations.length,
      userInstallations: {
        count: userInstallations.length,
        data: userInstallations,
      },
      unlinkedInstallations: {
        count: unlinkedInstallations.length,
        data: unlinkedInstallations,
      },
      allInstallations: allInstallations,
    });

  } catch (error) {
    console.error("Error fetching debug info:", error);
    return NextResponse.json(
      { error: "Failed to fetch debug info" },
      { status: 500 }
    );
  }
}
