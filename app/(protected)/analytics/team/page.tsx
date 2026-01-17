"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface AuthorStats {
  author: string;
  prCount: number;
  reviewCount: number;
  avgIssuesFound: number;
  avgScore: number;
  severityBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  categoryBreakdown: {
    security: number;
    performance: number;
    bug: number;
    code_quality: number;
    best_practice: number;
    documentation: number;
    testing: number;
    accessibility: number;
    maintainability: number;
  };
  totalCost: number;
}

interface TeamData {
  authors: AuthorStats[];
  aggregates: {
    totalAuthors: number;
    totalPRs: number;
    totalReviews: number;
    totalIssues: number;
    totalCost: number;
  };
  overallSeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  overallCategories: {
    security: number;
    performance: number;
    bug: number;
    code_quality: number;
    best_practice: number;
    documentation: number;
    testing: number;
    accessibility: number;
    maintainability: number;
  };
}

const SEVERITY_COLORS = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#3b82f6",
  info: "#6b7280",
};

export default function TeamPage() {
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const response = await fetch("/api/analytics/team");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch team data:", error);
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
        No team data available
      </div>
    );
  }

  const severityData = Object.entries(data.overallSeverity).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value,
    color: SEVERITY_COLORS[key as keyof typeof SEVERITY_COLORS],
  }));

  const categoryData = Object.entries(data.overallCategories)
    .filter(([_, value]) => value > 0)
    .sort(([_, a], [__, b]) => b - a)
    .slice(0, 8)
    .map(([key, value]) => ({
      name: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      value,
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Team Analytics</h1>
        <p className="text-[var(--text)]/60 mt-1">
          Analyze team performance and issue patterns
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-[var(--text)]/10">
          <div className="text-sm text-[var(--text)]/60 mb-2">Total Authors</div>
          <div className="text-3xl font-bold">{data.aggregates.totalAuthors}</div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[var(--text)]/10">
          <div className="text-sm text-[var(--text)]/60 mb-2">Total PRs</div>
          <div className="text-3xl font-bold">{data.aggregates.totalPRs}</div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[var(--text)]/10">
          <div className="text-sm text-[var(--text)]/60 mb-2">Total Issues</div>
          <div className="text-3xl font-bold">{data.aggregates.totalIssues}</div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[var(--text)]/10">
          <div className="text-sm text-[var(--text)]/60 mb-2">Total Cost</div>
          <div className="text-3xl font-bold">${data.aggregates.totalCost.toFixed(2)}</div>
        </div>
      </div>

      {/* Issue Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution */}
        <div className="bg-white rounded-xl p-6 border border-[var(--text)]/10">
          <h2 className="text-xl font-semibold mb-4">Issues by Severity</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-xl p-6 border border-[var(--text)]/10">
          <h2 className="text-xl font-semibold mb-4">Issues by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" angle={-45} textAnchor="end" height={100} />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Author Leaderboard */}
      <div className="bg-white rounded-xl border border-[var(--text)]/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--text)]/10">
          <h2 className="text-xl font-semibold">Author Leaderboard</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-[var(--text)]/10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text)]/70 uppercase">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text)]/70 uppercase">
                  PRs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text)]/70 uppercase">
                  Avg Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text)]/70 uppercase">
                  Avg Issues
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text)]/70 uppercase">
                  Critical
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text)]/70 uppercase">
                  High
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text)]/70 uppercase">
                  Cost
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--text)]/10">
              {data.authors.slice(0, 20).map((author, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium">{author.author}</div>
                  </td>
                  <td className="px-6 py-4">{author.prCount}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{author.avgScore.toFixed(0)}</span>
                      <span className="text-xs text-[var(--text)]/60">/100</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{author.avgIssuesFound.toFixed(1)}</td>
                  <td className="px-6 py-4">
                    {author.severityBreakdown.critical > 0 ? (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                        {author.severityBreakdown.critical}
                      </span>
                    ) : (
                      <span className="text-[var(--text)]/40">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {author.severityBreakdown.high > 0 ? (
                      <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded">
                        {author.severityBreakdown.high}
                      </span>
                    ) : (
                      <span className="text-[var(--text)]/40">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium">
                    ${author.totalCost.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
