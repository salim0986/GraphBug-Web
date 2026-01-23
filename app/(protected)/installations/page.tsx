"use client";

import { useEffect, useState } from "react";
import { 
  Github, 
  Plus, 
  RefreshCw, 
  Settings as SettingsIcon,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Installation {
  id: string;
  accountLogin: string;
  accountType: string;
  repositorySelection: string;
  installationUrl: string;
  createdAt: string;
  updatedAt: string;
  permissions?: {
    contents: string;
    metadata: string;
    pullRequests: string;
  };
}

interface Repository {
  id: string;
  name: string;
  fullName: string;
  private: boolean;
  ingestionStatus: string;
}

export default function InstallationsPage() {
  const [loading, setLoading] = useState(true);
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);

  useEffect(() => {
    fetchInstallations();
  }, []);

  async function fetchInstallations() {
    try {
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      const response = await fetch(`/api/repositories?t=${timestamp}`, {
        cache: 'no-store',
      });
      const data = await response.json();
      
      setInstallations(data.installations || []);
      setRepositories(data.repositories || []);
    } catch (error) {
      console.error("Failed to fetch installations:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-[var(--primary)]/20 rounded-full mx-auto"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
          <p className="text-base font-semibold text-[var(--text)]">Loading installations...</p>
        </div>
      </div>
    );
  }

  // No installations yet
  if (installations.length === 0) {
    return (
      <div className="max-w-4xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[var(--text)] mb-2">GitHub Installations</h2>
          <p className="text-[var(--text)]/70">
            Connect Graph Bug to your GitHub repositories to enable AI-powered code reviews.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[var(--text)]/10 p-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-[var(--primary)]/10 rounded-2xl flex items-center justify-center">
              <Github className="w-10 h-10 text-[var(--primary)]" />
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-[var(--text)] mb-3">
            No Installations Yet
          </h3>
          <p className="text-[var(--text)]/60 mb-8 max-w-md mx-auto">
            Install the Graph Bug GitHub App to start getting AI-powered code reviews on your pull requests.
          </p>
          
          <Button
            href="https://github.com/settings/installations"
            size="lg"
            className="gap-2"
          >
            <Plus className="w-5 h-5" />
            Manage GitHub App
          </Button>
          
          <div className="mt-8 pt-8 border-t border-[var(--text)]/10">
            <p className="text-sm text-[var(--text)]/50 mb-4">What you'll get:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-[var(--primary)] shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">Automatic Reviews</p>
                  <p className="text-xs text-[var(--text)]/60">On every PR</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-[var(--primary)] shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">Deep Context</p>
                  <p className="text-xs text-[var(--text)]/60">Knowledge graphs</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-[var(--primary)] shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">Instant Setup</p>
                  <p className="text-xs text-[var(--text)]/60">Zero configuration</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text)] mb-2">GitHub Installations</h2>
          <p className="text-[var(--text)]/70">
            Manage your GitHub App installations and connected repositories.
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={fetchInstallations}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button
            href={`https://github.com/settings/installations`}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Manage Installations
          </Button>
        </div>
      </div>

      {/* Installations List */}
      <div className="space-y-4">
        {installations.map((installation) => {
          const reposForInstallation = repositories.filter(
            repo => repo.fullName.startsWith(installation.accountLogin + '/')
          );
          
          return (
            <div 
              key={installation.id}
              className="bg-white rounded-2xl border border-[var(--text)]/10 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center">
                    {installation.accountType === 'Organization' ? (
                      <Users className="w-7 h-7 text-[var(--primary)]" />
                    ) : (
                      <Github className="w-7 h-7 text-[var(--primary)]" />
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-[var(--text)]">
                        {installation.accountLogin}
                      </h3>
                      <span className="px-2 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-semibold rounded-full">
                        {installation.accountType}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text)]/60">
                      {installation.repositorySelection === 'all' 
                        ? 'All repositories' 
                        : `${reposForInstallation.length} selected repositories`}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    href={`https://github.com/settings/installations/${installation.id}`}
                    className="gap-1.5"
                  >
                    <SettingsIcon className="w-3.5 h-3.5" />
                    Configure
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
              {/* Permissions */}
              {installation.permissions && (
                <div className="mb-4 p-3 bg-[var(--background)] rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-[var(--text)]/60" />
                    <p className="text-xs font-semibold text-[var(--text)]/60 uppercase tracking-wide">
                      Permissions
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(installation.permissions).map(([key, value]) => (
                      <span 
                        key={key}
                        className="px-2 py-1 bg-white border border-[var(--text)]/10 rounded text-xs text-[var(--text)]/70"
                      >
                        {key}: <span className="font-semibold">{value}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Repositories */}
              {reposForInstallation.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[var(--text)]/60 uppercase tracking-wide mb-3">
                    Connected Repositories ({reposForInstallation.length})
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {reposForInstallation.slice(0, 6).map((repo) => (
                      <div
                        key={repo.id}
                        className="flex items-center gap-2 p-2 bg-[var(--background)] rounded-lg text-sm"
                      >
                        {repo.ingestionStatus === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-[var(--primary)] shrink-0" />
                        ) : repo.ingestionStatus === 'failed' ? (
                          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                        ) : (
                          <RefreshCw className="w-4 h-4 text-[var(--secondary)] animate-spin shrink-0" />
                        )}
                        <span className="text-[var(--text)]/80 font-medium truncate">
                          {repo.name}
                        </span>
                        {repo.private && (
                          <span className="ml-auto px-1.5 py-0.5 bg-[var(--text)]/10 text-[var(--text)]/50 text-xs rounded">
                            Private
                          </span>
                        )}
                      </div>
                    ))}
                    {reposForInstallation.length > 6 && (
                      <div className="flex items-center justify-center p-2 bg-[var(--background)] rounded-lg text-sm text-[var(--text)]/60">
                        +{reposForInstallation.length - 6} more
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t border-[var(--text)]/10">
                <p className="text-xs text-[var(--text)]/50">
                  Installed {new Date(installation.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
