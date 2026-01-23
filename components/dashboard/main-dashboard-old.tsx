"use client";

import { useEffect, useState } from "react";
import InstallGitHub from "./install-github";
import RepositoryList from "./repository-list";

interface Stats {
  totalRepos: number;
  activeRepos: number;
  processing: number;
  failed: number;
}

interface Repository {
  id: string;
  name: string;
  fullName: string;
  private: boolean;
  ingestionStatus: string;
  ingestionError?: string | null;
  lastSyncedAt?: string | null;
  addedAt: string;
}

interface Installation {
  id: string;
  accountLogin: string;
  accountType: string;
  repositorySelection: string;
}

export default function MainDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalRepos: 0,
    activeRepos: 0,
    processing: 0,
    failed: 0,
  });
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [installations, setInstallations] = useState<Installation[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const timestamp = Date.now();
      const response = await fetch(`/api/repositories?t=${timestamp}`, {
        cache: 'no-store',
      });
      const data = await response.json();
      
      setStats(data.stats || {});
      setRepositories(data.repositories || []);
      setInstallations(data.installations || []);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  // If no installations, show the install screen
  if (!loading && installations.length === 0) {
    return <InstallGitHub />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-[var(--text)]/60">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-[var(--text)]/60 mt-1">
            Welcome back! Here's an overview of your repositories.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 text-sm bg-white hover:bg-gray-50 border border-[var(--text)]/20 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Repositories"
          value={stats.totalRepos}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          }
          color="blue"
        />
        
        <KPICard
          title="Active & Ready"
          value={stats.activeRepos}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="green"
        />
        
        <KPICard
          title="Processing"
          value={stats.processing}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }
          color="yellow"
        />
        
        <KPICard
          title="Failed"
          value={stats.failed}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="red"
        />
      </div>

      {/* Installations Summary */}
      <div className="bg-white rounded-xl p-6 border border-[var(--text)]/10">
        <h2 className="text-xl font-semibold mb-4">Connected GitHub Accounts</h2>
        <div className="space-y-3">
          {installations.map((installation) => (
            <div key={installation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--primary)] rounded-full flex items-center justify-center text-[var(--text)] font-bold">
                  {installation.accountLogin.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium">{installation.accountLogin}</div>
                  <div className="text-sm text-[var(--text)]/60">
                    {installation.accountType} • {installation.repositorySelection === "all" ? "All repositories" : "Selected repositories"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Repository List */}
      <RepositoryList repositories={repositories} onRefresh={fetchData} />
    </div>
  );
}

function KPICard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    yellow: "from-yellow-500 to-yellow-600",
    red: "from-red-500 to-red-600",
  }[color];

  return (
    <div className="bg-white rounded-xl p-6 border border-[var(--text)]/10 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses} flex items-center justify-center text-white`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-[var(--text)]/60">{title}</div>
    </div>
  );
}
