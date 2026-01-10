import { getInstallationOctokit } from "@/lib/github";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { installationId, owner, repo, prNumber } = await request.json();
    const appClient = await getInstallationOctokit(installationId);

    await appClient.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
      owner,
      repo,
      issue_number: prNumber,
      body: "Beep Boop. I have analyzed your code. It looks great!",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reviewing PR:", error);
    return NextResponse.json({ error: "Failed to review PR" }, { status: 500 });
  }
}