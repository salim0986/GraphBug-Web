import { auth } from "@/auth";
import { db, githubInstallations } from "@/db/schema";
import { eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * Manual fix: Link unlinked installations to the current user
 * This is a workaround for when the Setup URL callback doesn't work
 */
export async function POST() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`\n🔧 [MANUAL LINK] Attempting to link unlinked installations for user ${session.user.email}`);

    // Find installations with NULL userId
    const unlinkedInstallations = await db
      .select()
      .from(githubInstallations)
      .where(isNull(githubInstallations.userId));

    console.log(`   Found ${unlinkedInstallations.length} unlinked installations`);

    if (unlinkedInstallations.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "No unlinked installations found",
        linked: 0
      });
    }

    // Link all unlinked installations to this user
    const updated = await db
      .update(githubInstallations)
      .set({ 
        userId: session.user.id,
        updatedAt: new Date()
      })
      .where(isNull(githubInstallations.userId))
      .returning();

    console.log(`   ✅ Linked ${updated.length} installations to user ${session.user.email}`);
    updated.forEach(inst => {
      console.log(`      - ${inst.accountLogin} (Installation ID: ${inst.installationId})`);
    });

    return NextResponse.json({ 
      success: true, 
      message: `Successfully linked ${updated.length} installation(s)`,
      linked: updated.length,
      installations: updated.map(i => ({
        accountLogin: i.accountLogin,
        installationId: i.installationId
      }))
    });

  } catch (error) {
    console.error("❌ Error linking installations:", error);
    return NextResponse.json(
      { error: "Failed to link installations" },
      { status: 500 }
    );
  }
}
