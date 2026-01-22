"use client";

import { useEffect, useState } from "react";
import { 
  BarChart3, 
  GitBranch, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  Github,
  Sparkles,
  Network,
  Activity,
  Zap,
  Key,
  ExternalLink
} from "lucide-react";
import InstallGitHub from "./install-github";
import RepositoryList from "./repository-list";
import Link from "next/link";

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
  installationId: number;
  accountLogin: string;
  accountType: string;
  repositorySelection: string;
}

export default function MainDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalRepos: 0,
    activeRepos: 0,
    processing: 0,
    failed: 0,
  });
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    fetchData();
    checkApiKey();
    
    // Auto-refresh every 10 seconds to catch webhooks
    const interval = setInterval(() => {
      fetchData();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      const response = await fetch("/api/repositories");
      const data = await response.json();
      
      console.log("[Dashboard] Fetched repositories:", {
        installations: data.installations?.length,
        repositories: data.repositories?.length,
      });
      
      setStats(data.stats || {});
      setRepositories(data.repositories || []);
      setInstallations(data.installations || []);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }
  
  async function manualRefresh() {
    setRefreshing(true);
    await fetchData();
  }

  async function checkApiKey() {
    try {
      const response = await fetch("/api/user/gemini-key");
      if (response.ok) {
        const data = await response.json();
        setHasApiKey(data.hasKey);
      }
    } catch (error) {
      console.error("Failed to check API key:", error);
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
          <div className="relative">
            <div className="w-12 h-12 border-4 border-[var(--primary)]/20 rounded-full mx-auto"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
          <div className="space-y-2">
            <p className="text-base font-semibold text-[var(--text)]">Loading your dashboard...</p>
            <p className="text-xs text-[var(--text)]/50">If you just installed the app, this may take a few seconds</p>
          </div>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: "Total Repos",
      value: stats.totalRepos,
      icon: GitBranch,
      color: "text-blue-500",
      change: "+12%",
      changePositive: true,
    },
    {
      title: "Active & Ready",
      value: stats.activeRepos,
      icon: CheckCircle2,
      color: "text-[var(--primary)]",
      change: "Operational",
      changePositive: true,
    },
    {
      title: "Processing",
      value: stats.processing,
      icon: Clock,
      color: "text-[var(--secondary)]",
      change: "Ingesting",
      changePositive: true,
    },
    {
      title: "Failed",
      value: stats.failed,
      icon: AlertCircle,
      color: "text-red-500",
      change: stats.failed > 0 ? "Check logs" : "No issues",
      changePositive: stats.failed === 0,
    },
  ];

  return (
    <div className="space-y-8">
      {/* API Key Warning Banner */}
      {hasApiKey === false && (
        <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-lg">
          <div className="flex items-start gap-4">
            <div className="shrink-0 p-2.5 bg-amber-100 border border-amber-300 rounded-lg">
              <Key className="w-6 h-6 text-amber-700" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-amber-900 mb-1">
                Gemini API Key Required
              </h3>
              <p className="text-sm text-amber-800 mb-3">
                To enable AI-powered code reviews, you need to add your own Gemini API key. 
                Graph Bug uses a Bring Your Own (BYO) system to ensure you have full control over your API usage and costs.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link 
                  href="/settings?tab=api"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  <Key className="w-4 h-4" />
                  Add API Key in Settings
                </Link>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-amber-50 text-amber-900 text-sm font-semibold border border-amber-300 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Get Gemini API Key
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Repositories Warning Banner */}
      {installations.length > 0 && repositories.length === 0 && (
        <div className="p-5 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-lg">
          <div className="flex items-start gap-4">
            <div className="shrink-0 p-2.5 bg-orange-100 border border-orange-300 rounded-lg">
              <AlertCircle className="w-6 h-6 text-orange-700" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-orange-900 mb-1 flex items-center gap-2">
                No Repositories Found
                {refreshing && <RefreshCw className="w-4 h-4 animate-spin" />}
              </h3>
              <p className="text-sm text-orange-800 mb-3">
                You have connected your GitHub account, but no repositories are showing up. This might happen if the GitHub webhook hasn't processed yet (this takes 5-10 seconds).
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={manualRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh Now'}
                </button>
                <a
                  href={`https://github.com/settings/installations/${installations[0]?.installationId || ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-orange-50 text-orange-900 text-sm font-semibold border border-orange-300 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Check GitHub App Settings
                </a>
              </div>
              <p className="text-xs text-orange-700 mt-3 italic">
                💡 If refreshing doesn't help, try selecting/adding repositories again in GitHub App settings
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="group relative p-6 bg-white border border-[var(--text)]/5 hover:border-[var(--text)]/10 transition-all duration-300 overflow-hidden"
            >
              {/* Subtle gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--background)]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2.5 bg-gradient-to-br from-[var(--background)] to-white border border-[var(--text)]/5 ${card.color}`}>
                    <Icon className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <span className={`text-xs font-semibold tracking-wide px-2.5 py-1 ${
                    card.changePositive 
                      ? 'bg-[var(--primary)]/5 text-[var(--primary)] border border-[var(--primary)]/10' 
                      : 'bg-red-50 text-red-600 border border-red-100'
                  }`}>
                    {card.change}
                  </span>
                </div>
                
                <div>
                  <h3 className="text-3xl font-bold text-[var(--text)] mb-1 tracking-tight">
                    {card.value}
                  </h3>
                  <p className="text-sm font-medium text-[var(--text)]/50 uppercase tracking-wide">
                    {card.title}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Repository List - Takes up 2/3 */}
        <div className="lg:col-span-2">
           <RepositoryList repositories={repositories} onRefresh={manualRefresh} />
        </div>

        {/* Sidebar - Installed Accounts */}
        <div className="space-y-6">
            <div className="bg-white border border-[var(--text)]/5 p-6">
                <h3 className="font-semibold text-[var(--text)] mb-5 flex items-center gap-2.5 text-sm uppercase tracking-wide">
                    <Github className="w-4 h-4" strokeWidth={2} />
                    Connected Accounts
                </h3>
                 <div className="space-y-3">
                  {installations.map((installation) => (
                    <div
                      key={installation.id}
                      className="flex items-center justify-between p-4 bg-[var(--background)]/50 border border-[var(--text)]/5 hover:border-[var(--text)]/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[var(--text)] flex items-center justify-center text-white">
                           <Github className="w-4 h-4" strokeWidth={2} />
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-semibold text-sm text-[var(--text)] truncate">{installation.accountLogin}</p>
                          <p className="text-xs text-[var(--text)]/50 font-medium">
                            {installation.repositorySelection === 'all' ? 'All repos' : 'Selected repos'}
                          </p>
                        </div>
                      </div>
                      <div className="w-2 h-2 bg-[var(--primary)]" />
                    </div>
                  ))}
                </div>
            </div>

            <div className="bg-gradient-to-br from-[var(--primary)]/5 to-[var(--primary)]/10 border border-[var(--primary)]/20 p-6">
                <h3 className="font-bold text-[var(--text)] mb-3 text-sm flex items-center gap-2">
                    <div className="w-5 h-5 bg-[var(--primary)] flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-[var(--text)]" strokeWidth={2.5} />
                    </div>
                    Pro Tip
                </h3>
                <p className="text-sm text-[var(--text)]/70 leading-relaxed">
                    Graph Bug works best when you process your default branch first. This builds the complete knowledge graph before reviewing individual PRs.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}
