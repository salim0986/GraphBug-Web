"use client";

import { useState } from "react";

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

export default function RepositoryList({ repositories, onRefresh }: { repositories: Repository[]; onRefresh: () => void }) {
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set());
  const [isReviewing, setIsReviewing] = useState(false);

  // Filter repos that are not yet reviewed or failed
  const selectableRepos = repositories.filter(
    r => r.ingestionStatus === "not_reviewed" || r.ingestionStatus === "failed"
  );

  function toggleRepo(repoId: string) {
    const newSelected = new Set(selectedRepos);
    if (newSelected.has(repoId)) {
      newSelected.delete(repoId);
    } else {
      newSelected.add(repoId);
    }
    setSelectedRepos(newSelected);
  }

  function toggleAll() {
    if (selectedRepos.size === selectableRepos.length) {
      setSelectedRepos(new Set());
    } else {
      setSelectedRepos(new Set(selectableRepos.map(r => r.id)));
    }
  }

  async function handleReviewSelected() {
    if (selectedRepos.size === 0) return;

    setIsReviewing(true);
    try {
      // Trigger ingestion for all selected repos
      const promises = Array.from(selectedRepos).map(repoId =>
        fetch(`/api/repositories/${repoId}/ingest`, { method: "POST" })
      );

      await Promise.all(promises);
      
      // Clear selection and refresh
      setSelectedRepos(new Set());
      setTimeout(() => {
        onRefresh();
        setIsReviewing(false);
      }, 1000);
    } catch (error) {
      console.error("Failed to start review:", error);
      alert("Failed to start review. Please try again.");
      setIsReviewing(false);
    }
  }

  async function handleRetryIngestion(repoId: string) {
    setRetryingId(repoId);
    try {
      const response = await fetch(`/api/repositories/${repoId}/ingest`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to retry ingestion");
      }

      // Wait a bit and refresh
      setTimeout(() => {
        onRefresh();
        setRetryingId(null);
      }, 1000);
    } catch (error) {
      console.error("Failed to retry ingestion:", error);
      setRetryingId(null);
      alert("Failed to retry ingestion. Please try again.");
    }
  }

  if (repositories.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 border border-[var(--text)]/10 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2">No Repositories Yet</h3>
        <p className="text-[var(--text)]/60 mb-4">
          You haven't selected any repositories for review. Add repositories to your GitHub App installation to get started.
        </p>
        <a
          href={`https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP_NAME || "graph-bug"}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-black/90 transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
          </svg>
          Manage GitHub App
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[var(--text)]/10 overflow-hidden">
      <div className="p-6 border-b border-[var(--text)]/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Repositories</h2>
            <p className="text-sm text-[var(--text)]/60 mt-1">
              Select repositories to review with AI
            </p>
          </div>
          
          {selectableRepos.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={toggleAll}
                className="px-4 py-2 text-sm border border-[var(--text)]/20 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {selectedRepos.size === selectableRepos.length ? "Deselect All" : "Select All"}
              </button>
              
              <button
                onClick={handleReviewSelected}
                disabled={selectedRepos.size === 0 || isReviewing}
                className="px-6 py-2 text-sm bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] hover:opacity-90 text-white rounded-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isReviewing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Starting Review...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Review Selected ({selectedRepos.size})
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="divide-y divide-[var(--text)]/10">
        {repositories.map((repo) => {
          const isSelectable = repo.ingestionStatus === "not_reviewed" || repo.ingestionStatus === "failed";
          const isSelected = selectedRepos.has(repo.id);
          
          return (
            <div key={repo.id} className={`p-6 transition-colors ${isSelectable ? 'hover:bg-gray-50' : 'bg-gray-50/50'}`}>
              <div className="flex items-start gap-4">
                {isSelectable && (
                  <div className="pt-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRepo(repo.id)}
                      className="w-5 h-5 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                    />
                  </div>
                )}
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{repo.fullName}</h3>
                    {repo.private && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        Private
                      </span>
                    )}
                    <StatusBadge status={repo.ingestionStatus} />
                  </div>

                  {repo.ingestionStatus === "failed" && repo.ingestionError && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        <strong>Error:</strong> {repo.ingestionError}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-[var(--text)]/60">
                    <span>Added {new Date(repo.addedAt).toLocaleDateString()}</span>
                    {repo.lastSyncedAt && (
                      <span>Last synced {new Date(repo.lastSyncedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://github.com/${repo.fullName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-sm border border-[var(--text)]/20 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    View on GitHub
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    not_reviewed: { color: "bg-gray-100 text-gray-700", label: "Not Ingested", icon: "⏸️" },
    pending: { color: "bg-yellow-100 text-yellow-700", label: "Pending", icon: "⏳" },
    processing: { color: "bg-blue-100 text-blue-700", label: "Processing", icon: "⚙️" },
    completed: { color: "bg-green-100 text-green-700", label: "Ready", icon: "✅" },
    failed: { color: "bg-red-100 text-red-700", label: "Failed", icon: "❌" },
  }[status] || { color: "bg-gray-100 text-gray-700", label: status, icon: "❓" };

  return (
    <span className={`px-3 py-1 text-xs font-medium rounded-full ${config.color}`}>
      {config.icon} {config.label}
    </span>
  );
}
