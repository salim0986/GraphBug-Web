"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface CostSummary {
  totalCost: number;
  reviewCount: number;
  avgCostPerReview: number;
  modelBreakdown: {
    flash: number;
    pro: number;
    thinking: number;
  };
}

interface CostTrend {
  period: string;
  totalCost: number;
  reviewCount: number;
  modelBreakdown: {
    flash: number;
    pro: number;
    thinking: number;
  };
}

interface Repository {
  repoName: string;
  totalCost: number;
  reviewCount: number;
}

const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"];

export default function CostsPage() {
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [trends, setTrends] = useState<CostTrend[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const [granularity, setGranularity] = useState<"daily" | "weekly">("daily");

  useEffect(() => {
    fetchData();
  }, [timeRange, granularity]);

  async function fetchData() {
    try {
      setLoading(true);

      // Calculate date range
      const dateTo = new Date();
      const dateFrom = new Date();
      const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
      dateFrom.setDate(dateFrom.getDate() - days);

      // Fetch summary
      const summaryResponse = await fetch(
        `/api/analytics/costs?dateFrom=${dateFrom.toISOString()}&dateTo=${dateTo.toISOString()}`
      );
      const summaryData = await summaryResponse.json();
      setSummary(summaryData.summary);
      setRepositories(summaryData.byRepository || []);

      // Fetch trends
      const trendsResponse = await fetch(
        `/api/analytics/costs/trends?granularity=${granularity}&dateFrom=${dateFrom.toISOString()}&dateTo=${dateTo.toISOString()}`
      );
      const trendsData = await trendsResponse.json();
      setTrends(trendsData.dataPoints || []);
    } catch (error) {
      console.error("Failed to fetch cost data:", error);
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

  const modelData = summary
    ? [
        { name: "Flash", value: summary.modelBreakdown.flash, color: "#3b82f6" },
        { name: "Pro", value: summary.modelBreakdown.pro, color: "#10b981" },
        { name: "Thinking", value: summary.modelBreakdown.thinking, color: "#8b5cf6" },
      ].filter((m) => m.value > 0)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cost Analytics</h1>
          <p className="text-[var(--text)]/60 mt-1">
            Track AI model costs and spending trends
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 border border-[var(--text)]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <select
            value={granularity}
            onChange={(e) => setGranularity(e.target.value as any)}
            className="px-4 py-2 border border-[var(--text)]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 border border-[var(--text)]/10">
            <div className="text-sm text-[var(--text)]/60 mb-2">Total Cost</div>
            <div className="text-3xl font-bold">${summary.totalCost.toFixed(2)}</div>
            <div className="text-sm text-[var(--text)]/60 mt-2">
              {summary.reviewCount} reviews
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-[var(--text)]/10">
            <div className="text-sm text-[var(--text)]/60 mb-2">Avg per Review</div>
            <div className="text-3xl font-bold">
              ${summary.avgCostPerReview.toFixed(4)}
            </div>
            <div className="text-sm text-[var(--text)]/60 mt-2">
              Per code review
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-[var(--text)]/10">
            <div className="text-sm text-[var(--text)]/60 mb-2">Review Count</div>
            <div className="text-3xl font-bold">{summary.reviewCount}</div>
            <div className="text-sm text-[var(--text)]/60 mt-2">
              Total completed
            </div>
          </div>
        </div>
      )}

      {/* Cost Trend Chart */}
      <div className="bg-white rounded-xl p-6 border border-[var(--text)]/10">
        <h2 className="text-xl font-semibold mb-4">Cost Trend Over Time</h2>
        {trends.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
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
                formatter={(value: any) => [`$${value.toFixed(4)}`, "Cost"]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="totalCost"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6" }}
                name="Total Cost"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-[var(--text)]/60">
            No cost data available
          </div>
        )}
      </div>

      {/* Model Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-xl p-6 border border-[var(--text)]/10">
          <h2 className="text-xl font-semibold mb-4">Cost by Model</h2>
          {modelData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={modelData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {modelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `$${value.toFixed(4)}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-[var(--text)]/60">
              No model data available
            </div>
          )}
        </div>

        {/* Repository Breakdown */}
        <div className="bg-white rounded-xl p-6 border border-[var(--text)]/10">
          <h2 className="text-xl font-semibold mb-4">Cost by Repository</h2>
          {repositories.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={repositories.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="repoName" stroke="#6b7280" angle={-45} textAnchor="end" height={100} />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(value: any) => [`$${value.toFixed(4)}`, "Cost"]}
                />
                <Bar dataKey="totalCost" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-[var(--text)]/60">
              No repository data available
            </div>
          )}
        </div>
      </div>

      {/* Repository Table */}
      {repositories.length > 0 && (
        <div className="bg-white rounded-xl border border-[var(--text)]/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--text)]/10">
            <h2 className="text-xl font-semibold">Detailed Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-[var(--text)]/10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text)]/70 uppercase">
                    Repository
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text)]/70 uppercase">
                    Reviews
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text)]/70 uppercase">
                    Total Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text)]/70 uppercase">
                    Avg Cost
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--text)]/10">
                {repositories.map((repo, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{repo.repoName}</td>
                    <td className="px-6 py-4">{repo.reviewCount}</td>
                    <td className="px-6 py-4 font-semibold">
                      ${repo.totalCost.toFixed(4)}
                    </td>
                    <td className="px-6 py-4">
                      ${(repo.totalCost / repo.reviewCount).toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
