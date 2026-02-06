const { db, pullRequests, codeReviews } = require("./db/schema");
const { eq } = require("drizzle-orm");

async function checkStatus() {
  try {
    console.log("Checking database status...\n");
    
    const prId = "da8d3752-0d7a-45e3-b7dd-7794c18b2ac1";
    
    // Check if PR exists
    console.log(`Looking for PR: ${prId}`);
    const prs = await db.select().from(pullRequests).where(eq(pullRequests.id, prId));
    
    if (prs.length > 0) {
      console.log("✅ PR exists in database:");
      console.log(`   ID: ${prs[0].id}`);
      console.log(`   Number: ${prs[0].prNumber}`);
      console.log(`   Title: ${prs[0].title}`);
      console.log(`   Repository ID: ${prs[0].repositoryId}`);
    } else {
      console.log("❌ PR NOT FOUND in database!");
      console.log("   This is why the foreign key constraint fails!");
    }
    
    console.log("\nChecking existing reviews for this PR...");
    const reviews = await db.select().from(codeReviews).where(eq(codeReviews.pullRequestId, prId));
    console.log(`Found ${reviews.length} review(s)`);
    
    await db.$client.end();
  } catch (error) {
    console.error("Error:", error.message);
  }
}

checkStatus();
