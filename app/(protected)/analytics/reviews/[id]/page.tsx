"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, DollarSign, FileCode, GitBranch, AlertCircle, CheckCircle } from "lucide-react";

interface ReviewDetails {
  review: {
    id: string;
    prNumber: number;
    prTitle: string;
    repositoryName: string;
    repositoryFullName: string;
    author: string;
    authorAvatarUrl: string | null;
    status: string;
    summary: {
      overallScore: number;
      filesChanged: number;
      issuesFound: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
      info: number;
    };
    keyChanges: string[];
    recommendations: string[];
    positives: string[];
    modelsUsed: Array<{ model: string; tier: string; cost: number }>;
    totalCost: number;
    executionTimeMs: number | null;
    createdAt: string;
    completedAt: string | null;
  };
  comments: Array<{
    id: string;
    filePath: string;
    startLine: number | null;
    endLine: number | null;
    severity: string;
    category: string;
    title: string;
    message: string;
    suggestion: string | null;
  }>;
  prDetails: {
    htmlUrl: string;
    baseBranch: string;
    headBranch: string;
    additions: number;
    deletions: number;
  };
}

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReviewDetails | null>(null);

  useEffect(() => {
    async function fetchReview() {
      try {
        const res = await fetch(`/api/analytics/reviews/${params.id}`);
        if (!res.ok) {
          throw new Error("Failed to fetch review");
        }
        const result = await res.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchReview();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-[var(--error)] mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-foreground mb-2">Failed to load review</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { review, comments, prDetails } = data;
  const severityColors = {
    critical: "text-[var(--error)] bg-[var(--error)]/10 border-[var(--error)]/30",
    high: "text-[var(--warning)] bg-[var(--warning)]/10 border-[var(--warning)]/30",
    medium: "text-[var(--accent)] bg-[var(--accent)]/10 border-[var(--accent)]/30",
    low: "text-[var(--primary)] bg-[var(--primary)]/10 border-[var(--primary)]/30",
    info: "text-muted-foreground bg-muted/10 border-muted/20",
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/analytics/reviews')}
          className="flex items-center text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Analytics
        </button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              PR #{review.prNumber}: {review.prTitle}
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <FileCode className="h-4 w-4" />
                {review.repositoryFullName}
              </span>
              <span className="flex items-center gap-1">
                <GitBranch className="h-4 w-4" />
                {prDetails.baseBranch} ← {prDetails.headBranch}
              </span>
              <span className="flex items-center gap-1">
                {review.authorAvatarUrl && (
                  <img src={review.authorAvatarUrl} alt="" className="h-4 w-4 rounded-full" />
                )}
                {review.author}
              </span>
            </div>
          </div>

          <a
            href={prDetails.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90"
          >
            View on GitHub
          </a>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Overall Score</p>
              <p className="text-3xl font-bold text-foreground">{review.summary.overallScore}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-[var(--success)]/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-[var(--success)]" />
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Issues Found</p>
              <p className="text-3xl font-bold text-foreground">{review.summary.issuesFound}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-[var(--error)]/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-[var(--error)]" />
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Execution Time</p>
              <p className="text-3xl font-bold text-foreground">
                {review.executionTimeMs ? (review.executionTimeMs / 1000).toFixed(1) : "0.0"}s
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-[var(--primary)]" />
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Cost</p>
              <p className="text-3xl font-bold text-foreground">
                ${review.totalCost ? review.totalCost.toFixed(4) : "0.00"}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-[var(--accent)]" />
            </div>
          </div>
        </div>
      </div>

      {/* Issue Breakdown */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">Issue Breakdown</h2>
        <div className="flex gap-4">
          {(() => {
            const s = review.summary || {} as any;
            const issuesFound = Number(s.issuesFound ?? (
              (Number(s.critical) || 0) + (Number(s.high) || 0) + (Number(s.medium) || 0) + (Number(s.low) || 0) + (Number(s.info) || 0)
            ));

            if (issuesFound === 0) {
              return <div className="text-sm text-muted-foreground">No issues found</div>;
            }

            return (
              <>
                {Number(s.critical || 0) > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-red-600"></div>
                    <span className="text-sm">Critical: {s.critical}</span>
                  </div>
                )}
                {Number(s.high || 0) > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-orange-600"></div>
                    <span className="text-sm">High: {s.high}</span>
                  </div>
                )}
                {Number(s.medium || 0) > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-yellow-600"></div>
                    <span className="text-sm">Medium: {s.medium}</span>
                  </div>
                )}
                {Number(s.low || 0) > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-blue-600"></div>
                    <span className="text-sm">Low: {s.low}</span>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>

      {/* Key Changes */}
      {review.keyChanges && review.keyChanges.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Key Changes</h2>
          <ul className="space-y-2">
            {review.keyChanges.map((change, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-muted-foreground">{change}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {review.recommendations && review.recommendations.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Recommendations</h2>
          <ul className="space-y-2">
            {review.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">•</span>
                <span className="text-muted-foreground">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Positives */}
      {review.positives && review.positives.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Positives</h2>
          <ul className="space-y-2">
            {review.positives.map((pos, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <span className="text-muted-foreground">{pos}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Review Comments */}
      {comments && comments.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Review Comments ({comments.length})
          </h2>
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className={`p-4 rounded-lg border ${
                  severityColors[comment.severity as keyof typeof severityColors] ||
                  severityColors.info
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{comment.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {comment.filePath}
                      {comment.startLine && comment.endLine && (
                        <> (Lines {comment.startLine}-{comment.endLine})</>
                      )}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-white border">
                    {comment.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-muted-foreground mb-2">{comment.message}</p>
                {comment.suggestion && (
                  <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                    <p className="text-sm font-medium text-foreground mb-1">Suggestion:</p>
                    <p className="text-sm text-muted-foreground">{comment.suggestion}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
