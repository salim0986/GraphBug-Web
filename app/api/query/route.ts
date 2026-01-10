import { auth } from "@/auth";
import { queryRepository } from "@/lib/ai-service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { repo_id, query } = await request.json();

    if (!repo_id || !query) {
      return NextResponse.json(
        { error: "Missing repo_id or query" },
        { status: 400 }
      );
    }

    const results = await queryRepository({ repo_id, query });

    return NextResponse.json(results);

  } catch (error: any) {
    console.error("Error querying repository:", error);
    return NextResponse.json(
      { error: error.message || "Failed to query repository" },
      { status: 500 }
    );
  }
}
