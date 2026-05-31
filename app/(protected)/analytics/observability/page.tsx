"use client";

import { useState, useEffect } from "react";

interface Overview {
  totalReviews: number;
  totalCost: number;
  totalTokensIn: number;
  totalTokensOut: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
}

interface ModelRow {
  model: string;
  count: number;
  totalCost: number;
  avgLatencyMs: number;
}

interface DayRow {
  date: string;
  count: number;
  totalCost: number;
  avgLatencyMs: number;
}

interface ObservabilityData {
  overview: Overview;
  byModel: ModelRow[];
  byDay: DayRow[];
}

export default function ObservabilityPage() {
  const [data, setData] = useState<ObservabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/analytics/observability")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[var(--text)]/60">Loading observability data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
        Failed to load observability data: {error}
      </div>
    );
  }

  const ov = data?.overview;
  const totalTokens = (ov?.totalTokensIn ?? 0) + (ov?.totalTokensOut ?? 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Observability</h1>
        <p className="text-[var(--text)]/60 mt-1">
          LLM token usage, cost, and latency — last 30 days
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Reviews" value={String(ov?.totalReviews ?? 0)} icon="📊" color="from-blue-500 to-blue-600" />
        <StatCard label="Total Cost" value={`$${(ov?.totalCost ?? 0).toFixed(4)}`} icon="💰" color="from-green-500 to-green-600" />
        <StatCard label="p50 Latency" value={(ov?.totalReviews ?? 0) >= 2 ? _ms(ov?.p50LatencyMs ?? 0) : "—"} icon="⚡" color="from-yellow-500 to-yellow-600" />
        <StatCard label="p95 Latency" value={(ov?.totalReviews ?? 0) >= 5 ? _ms(ov?.p95LatencyMs ?? 0) : "—"} icon="🔥" color="from-red-500 to-red-600" />
      </div>

      {/* Token totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InfoCard label="Tokens In" value={_fmt(ov?.totalTokensIn ?? 0)} />
        <InfoCard label="Tokens Out" value={_fmt(ov?.totalTokensOut ?? 0)} />
        <InfoCard label="Total Tokens" value={_fmt(totalTokens)} />
      </div>

      {/* Model breakdown */}
      {(data?.byModel?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-[var(--text)]/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--text)]/10">
            <h2 className="text-lg font-semibold">Breakdown by Model Tier</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["Model", "Reviews", "Total Cost", "Avg Latency"].map((h) => (
                    <th key={h} className="px-6 py-3 text-left font-medium text-[var(--text)]/60">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--text)]/5">
                {data!.byModel.map((row) => (
                  <tr key={row.model} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium capitalize">{row.model}</td>
                    <td className="px-6 py-4">{row.count}</td>
                    <td className="px-6 py-4">${row.totalCost.toFixed(4)}</td>
                    <td className="px-6 py-4">{_ms(row.avgLatencyMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Daily summary */}
      {(data?.byDay?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-[var(--text)]/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--text)]/10">
            <h2 className="text-lg font-semibold">Daily Activity — Last 14 Days</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["Date", "Reviews", "Cost", "Avg Latency"].map((h) => (
                    <th key={h} className="px-6 py-3 text-left font-medium text-[var(--text)]/60">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--text)]/5">
                {data!.byDay
                  .slice()
                  .reverse()
                  .map((row) => (
                    <tr
                      key={row.date}
                      className={`hover:bg-gray-50 ${row.count === 0 ? "opacity-40" : ""}`}
                    >
                      <td className="px-6 py-3 font-mono">{row.date}</td>
                      <td className="px-6 py-3">{row.count}</td>
                      <td className="px-6 py-3">
                        {row.count > 0 ? `$${row.totalCost.toFixed(4)}` : "—"}
                      </td>
                      <td className="px-6 py-3">
                        {row.avgLatencyMs > 0 ? _ms(row.avgLatencyMs) : "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {(ov?.totalReviews ?? 0) === 0 && (
        <div className="bg-white rounded-xl border border-[var(--text)]/10 p-12 text-center">
          <div className="text-4xl mb-4">📡</div>
          <h3 className="text-lg font-semibold mb-2">No data yet</h3>
          <p className="text-[var(--text)]/60 text-sm">
            Observability metrics will appear here after your first AI review
            completes.
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[var(--text)]/10">
      <div
        className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-xl mb-4`}
      >
        {icon}
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm text-[var(--text)]/60">{label}</div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-[var(--text)]/10 flex items-center justify-between">
      <span className="text-sm text-[var(--text)]/60">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function _ms(ms: number): string {
  if (ms <= 0) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function _fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
