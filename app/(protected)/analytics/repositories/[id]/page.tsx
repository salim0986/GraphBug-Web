"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface RepositoryInsights {
  repository: {
    id: string;
    name: string;
    fullName: string;
  };
  overview: {
    totalReviews: number;
    totalPRs: number;
    avgIssuesPerPR: number;
    avgScorePerPR: number;
    totalCost: number;
  };
  hotFiles: Array<{
    filePath: string;
    reviewCount: number;
    issueCount: number;
    avgSeverity: number;
    lastReviewedAt: string;
  }>;
  reviewTrends: Array<{
    period: string;
    totalCost: number;
    reviewCount: number;
  }>;
  issuePatterns: {
    byCategory: Array<{ category: string; count: number; percentage: number }>;
    bySeverity: Array<{ severity: string; count: number; percentage: number }>;
    commonIssues: Array<{ title: string; count: number }>;
  };
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#3b82f6",
  info: "#6b7280",
};

export default function RepositoryInsightsPage() {
  const params = useParams();
  const repositoryId = params?.id as string;
  const [data, setData] = useState<RepositoryInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (repositoryId) {
      fetchData();
    }
  }, [repositoryId]);

  async function fetchData() {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/repositories/${repositoryId}/insights`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch repository insights:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-[var(--text)]/60">
        Repository not found or no data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{data.repository.name}</h1>
        <p className="text-[var(--text)]/60 mt-1">{data.repository.fullName}</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl p-6 border border-[var(--text)]/10">
          <div className="text-sm text-[var(--text)]/60 mb-2">Total Reviews</div>
          <div className="text-3xl font-bold">{data.overview.totalReviews}</div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[var(--text)]/10">
          <div className="text-sm text-[var(--text)]/60 mb-2">Total PRs</div>
          <div className="text-3xl font-bold">{data.overview.totalPRs}</div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[var(--text)]/10">
          <div className="text-sm text-[var(--text)]/60 mb-2">Avg Issues</div>
          <div className="text-3xl font-bold">{data.overview.avgIssuesPerPR.toFixed(1)}</div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[var(--text)]/10">
          <div className="text-sm text-[var(--text)]/60 mb-2">Avg Score</div>
          <div className="text-3xl font-bold">{data.overview.avgScorePerPR.toFixed(0)}</div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[var(--text)]/10">
          <div className="text-sm text-[var(--text)]/60 mb-2">Total Cost</div>
          <div className="text-3xl font-bold">${data.overview.totalCost.toFixed(2)}</div>
        </div>
      </div>

      {/* Review Trends */}
      <div className="bg-white rounded-xl p-6 border border-[var(--text)]/10">
        <h2 className="text-xl font-semibold mb-4">Review Activity Over Time</h2>
        {data.reviewTrends.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.reviewTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="period"
                tickFormatter={(value) => format(new Date(value), "MMM d")}
                stroke="#6b7280"
              />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
                labelFormatter={(value) => format(new Date(value), "MMM d, yyyy")}
              />
              <Line
                type="monotone"
                dataKey="reviewCount"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Reviews"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-[var(--text)]/60">
            No trend data available
          </div>
        )}
      </div>

      {/* Issue Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Severity */}
        <div className="bg-white rounded-xl p-6 border border-[var(--text)]/10">
          <h2 className="text-xl font-semibold mb-4">Issues by Severity</h2>
          {data.issuePatterns.bySeverity.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.issuePatterns.bySeverity}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) =>
                    `${entry.payload?.severity || entry.name}: ${entry.percent ? (entry.percent * 100).toFixed(0) : 0}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.issuePatterns.bySeverity.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={SEVERITY_COLORS[entry.severity] || "#6b7280"}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-[var(--text)]/60">
              No severity data
            </div>
          )}
        </div>

        {/* By Category */}
        <div className="bg-white rounded-xl p-6 border border-[var(--text)]/10">
          <h2 className="text-xl font-semibold mb-4">Issues by Category</h2>
          {data.issuePatterns.byCategory.length > 0 ? (
            <div className="space-y-3">
              {data.issuePatterns.byCategory.slice(0, 8).map((item) => (
                <div key={item.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">
                      {item.category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                    <span className="text-sm text-[var(--text)]/60">
                      {item.count} ({item.percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-[var(--text)]/60">
              No category data
            </div>
          )}
        </div>
      </div>

      {/* Hot Files */}
      <div className="bg-white rounded-xl border border-[var(--text)]/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--text)]/10">
          <h2 className="text-xl font-semibold">Most Reviewed Files</h2>
        </div>
        {data.hotFiles.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-[var(--text)]/10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text)]/70 uppercase">
                    File Path
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text)]/70 uppercase">
                    Review Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text)]/70 uppercase">
                    Issues
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text)]/70 uppercase">
                    Avg Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text)]/70 uppercase">
                    Last Reviewed
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--text)]/10">
                {data.hotFiles.slice(0, 15).map((file, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm truncate max-w-md">
                        {file.filePath}
                      </div>
                    </td>
                    <td className="px-6 py-4">{file.reviewCount}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                        {file.issueCount}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor:
                              file.avgSeverity >= 4
                                ? SEVERITY_COLORS.critical
                                : file.avgSeverity >= 3
                                ? SEVERITY_COLORS.high
                                : file.avgSeverity >= 2
                                ? SEVERITY_COLORS.medium
                                : SEVERITY_COLORS.low,
                          }}
                        ></div>
                        <span className="text-sm">{file.avgSeverity.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {format(new Date(file.lastReviewedAt), "MMM d, yyyy")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-[var(--text)]/60">
            No hot files data
          </div>
        )}
      </div>

      {/* Common Issues */}
      {data.issuePatterns.commonIssues.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-[var(--text)]/10">
          <h2 className="text-xl font-semibold mb-4">Most Common Issues</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.issuePatterns.commonIssues.map((issue, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1 truncate">
                  <div className="font-medium text-sm">{issue.title}</div>
                </div>
                <div className="ml-4">
                  <span className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full font-medium">
                    {issue.count}×
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
