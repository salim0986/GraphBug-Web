"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Repository {
  id: string;
  name: string;
  fullName: string;
}

interface Stats {
  totalReviews: number;
  totalCost: number;
  avgIssues: number;
  avgScore: number;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      // Fetch repositories
      const timestamp = Date.now();
      const reposResponse = await fetch(`/api/repositories?t=${timestamp}`, {
        cache: 'no-store',
      });
      const reposData = await reposResponse.json();
      setRepositories(reposData.repositories || []);

      // Fetch overall stats (last 30 days)
      const statsResponse = await fetch("/api/analytics/reviews?limit=1");
      const statsData = await statsResponse.json();
      setStats(statsData.aggregates || null);
    } catch (error) {
      console.error("Failed to fetch analytics data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-[var(--text)]/60">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics & Insights</h1>
        <p className="text-[var(--text)]/60 mt-1">
          Deep dive into your code review metrics, costs, and team performance
        </p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Reviews"
            value={stats.totalReviews}
            icon="📊"
            color="blue"
          />
          <StatCard
            title="Total Cost"
            value={`$${stats.totalCost.toFixed(2)}`}
            icon="💰"
            color="green"
          />
          <StatCard
            title="Avg Issues Found"
            value={stats.avgIssues.toFixed(1)}
            icon="🐛"
            color="yellow"
          />
          <StatCard
            title="Avg Score"
            value={`${stats.avgScore.toFixed(0)}/100`}
            icon="⭐"
            color="purple"
          />
        </div>
      )}

      {/* Analytics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reviews Section */}
        <AnalyticsCard
          title="Review History"
          description="Browse all code reviews with filters and details"
          icon="📝"
          href="/analytics/reviews"
          color="from-blue-500 to-blue-600"
        />

        {/* Cost Section */}
        <AnalyticsCard
          title="Cost Analytics"
          description="Track spending, trends, and projections over time"
          icon="📈"
          href="/analytics/costs"
          color="from-green-500 to-green-600"
        />

        {/* Team Section */}
        <AnalyticsCard
          title="Team Performance"
          description="Analyze author stats, issue patterns, and efficiency"
          icon="👥"
          href="/analytics/team"
          color="from-purple-500 to-purple-600"
        />

        {/* Repository Section */}
        <AnalyticsCard
          title="Repository Insights"
          description="Explore hot files, review trends, and issue patterns"
          icon="📦"
          href="/analytics/repositories"
          color="from-orange-500 to-orange-600"
        />
      </div>

      {/* Repository Quick Access */}
      {repositories.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-[var(--text)]/10">
          <h2 className="text-xl font-semibold mb-4">Quick Access by Repository</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {repositories.slice(0, 6).map((repo) => (
              <Link
                key={repo.id}
                href={`/analytics/repositories/${repo.id}`}
                className="p-4 rounded-lg border border-[var(--text)]/10 hover:border-[var(--primary)] hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium truncate">{repo.name}</div>
                <div className="text-sm text-[var(--text)]/60 truncate">{repo.fullName}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    yellow: "from-yellow-500 to-yellow-600",
    purple: "from-purple-500 to-purple-600",
  }[color];

  return (
    <div className="bg-white rounded-xl p-6 border border-[var(--text)]/10">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses} flex items-center justify-center text-2xl`}
        >
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-[var(--text)]/60">{title}</div>
    </div>
  );
}

function AnalyticsCard({
  title,
  description,
  icon,
  href,
  color,
}: {
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-xl p-6 border border-[var(--text)]/10 hover:shadow-lg transition-shadow group"
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-2xl flex-shrink-0`}
        >
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold group-hover:text-[var(--primary)] transition-colors">
            {title}
          </h3>
          <p className="text-sm text-[var(--text)]/60 mt-1">{description}</p>
        </div>
      </div>
    </Link>
  );
}
