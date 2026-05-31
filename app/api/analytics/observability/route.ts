import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, codeReviews, pullRequests, githubRepositories, githubInstallations } from "@/db/schema";
import { gte, desc, eq, inArray } from "drizzle-orm";
import { subDays } from "date-fns";

/**
 * GET /api/analytics/observability
 *
 * Returns aggregated LLM observability metrics derived from stored reviews:
 * - overview: totals and latency percentiles
 * - byModel: breakdown per primaryModel tier
 * - byDay: last 14 days of cost + count
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    const since = subDays(new Date(), 30);

    // Scope to repositories owned by this user's installations only.
    // Without this, any authenticated user can see token/cost data for all users.
    const userInstallations = await db
      .select({ id: githubInstallations.id })
      .from(githubInstallations)
      .where(eq(githubInstallations.userId, userId ?? ""));

    const installationIds = userInstallations.map((i) => i.id);
    if (installationIds.length === 0) {
      return NextResponse.json({
        overview: { totalReviews: 0, totalCost: 0, totalTokensIn: 0, totalTokensOut: 0, avgLatencyMs: 0, p50LatencyMs: 0, p95LatencyMs: 0 },
        byModel: [],
        byDay: [],
      });
    }

    // Collect repository IDs for this user's installations.
    const userRepos = await db
      .select({ id: githubRepositories.id })
      .from(githubRepositories)
      .where(inArray(githubRepositories.installationId, installationIds));

    const repoIds = userRepos.map((r) => r.id);
    if (repoIds.length === 0) {
      return NextResponse.json({
        overview: { totalReviews: 0, totalCost: 0, totalTokensIn: 0, totalTokensOut: 0, avgLatencyMs: 0, p50LatencyMs: 0, p95LatencyMs: 0 },
        byModel: [],
        byDay: [],
      });
    }

    // Pull the user's reviews from the last 30 days (limit 500 for percentile calc).
    const prIds = (await db
      .select({ id: pullRequests.id })
      .from(pullRequests)
      .where(inArray(pullRequests.repositoryId, repoIds))
    ).map((p) => p.id);

    if (prIds.length === 0) {
      return NextResponse.json({
        overview: { totalReviews: 0, totalCost: 0, totalTokensIn: 0, totalTokensOut: 0, avgLatencyMs: 0, p50LatencyMs: 0, p95LatencyMs: 0 },
        byModel: [],
        byDay: [],
      });
    }

    const rows = await db
      .select({
        id: codeReviews.id,
        primaryModel: codeReviews.primaryModel,
        totalCost: codeReviews.totalCost,
        totalTokensInput: codeReviews.totalTokensInput,
        totalTokensOutput: codeReviews.totalTokensOutput,
        executionTimeMs: codeReviews.executionTimeMs,
        completedAt: codeReviews.completedAt,
      })
      .from(codeReviews)
      .where(inArray(codeReviews.pullRequestId, prIds))
      .orderBy(desc(codeReviews.createdAt))
      .limit(500);

    if (rows.length === 0) {
      return NextResponse.json({
        overview: {
          totalReviews: 0,
          totalCost: 0,
          totalTokensIn: 0,
          totalTokensOut: 0,
          avgLatencyMs: 0,
          p50LatencyMs: 0,
          p95LatencyMs: 0,
        },
        byModel: [],
        byDay: [],
      });
    }

    // ---- overview ----
    const latencies = rows
      .map((r) => r.executionTimeMs ?? 0)
      .filter((v) => v > 0)
      .sort((a, b) => a - b);

    const p50 = _percentile(latencies, 0.5);
    const p95 = _percentile(latencies, 0.95);
    const avgLatency =
      latencies.length > 0
        ? Math.round(latencies.reduce((s, v) => s + v, 0) / latencies.length)
        : 0;

    const overview = {
      totalReviews: rows.length,
      totalCost: _round(rows.reduce((s, r) => s + (r.totalCost ?? 0), 0), 6),
      totalTokensIn: rows.reduce((s, r) => s + (r.totalTokensInput ?? 0), 0),
      totalTokensOut: rows.reduce((s, r) => s + (r.totalTokensOutput ?? 0), 0),
      avgLatencyMs: avgLatency,
      p50LatencyMs: p50,
      p95LatencyMs: p95,
    };

    // ---- byModel ----
    const modelMap = new Map<
      string,
      { count: number; totalCost: number; latencies: number[] }
    >();
    for (const r of rows) {
      const model = r.primaryModel ?? "unknown";
      if (!modelMap.has(model)) {
        modelMap.set(model, { count: 0, totalCost: 0, latencies: [] });
      }
      const entry = modelMap.get(model)!;
      entry.count += 1;
      entry.totalCost += r.totalCost ?? 0;
      if (r.executionTimeMs && r.executionTimeMs > 0)
        entry.latencies.push(r.executionTimeMs);
    }

    const byModel = Array.from(modelMap.entries()).map(([model, data]) => ({
      model,
      count: data.count,
      totalCost: _round(data.totalCost, 6),
      avgLatencyMs:
        data.latencies.length > 0
          ? Math.round(
              data.latencies.reduce((s, v) => s + v, 0) / data.latencies.length
            )
          : 0,
    }));

    // ---- byDay (last 14 days) ----
    const dayMap = new Map<string, { count: number; totalCost: number; totalMs: number; latCount: number }>();
    for (let i = 13; i >= 0; i--) {
      const d = subDays(new Date(), i);
      dayMap.set(_isoDate(d), { count: 0, totalCost: 0, totalMs: 0, latCount: 0 });
    }
    for (const r of rows) {
      if (!r.completedAt) continue;
      const key = _isoDate(r.completedAt);
      if (!dayMap.has(key)) continue;
      const entry = dayMap.get(key)!;
      entry.count += 1;
      entry.totalCost += r.totalCost ?? 0;
      if (r.executionTimeMs && r.executionTimeMs > 0) {
        entry.totalMs += r.executionTimeMs;
        entry.latCount += 1;
      }
    }

    const byDay = Array.from(dayMap.entries()).map(([date, data]) => ({
      date,
      count: data.count,
      totalCost: _round(data.totalCost, 6),
      avgLatencyMs:
        data.latCount > 0 ? Math.round(data.totalMs / data.latCount) : 0,
    }));

    return NextResponse.json({ overview, byModel, byDay });
  } catch (error) {
    console.error("[GET /api/analytics/observability] Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function _percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil(sorted.length * p) - 1;
  return sorted[Math.max(0, idx)];
}

function _round(v: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(v * factor) / factor;
}

function _isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
