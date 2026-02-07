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
    r => r.ingestionStatus === "pending" || r.ingestionStatus === "failed" || r.ingestionStatus === "not_reviewed"
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
      <div className="bg-white border border-[var(--text)]/5 p-16 text-center">
        <div className="w-16 h-16 bg-[var(--background)] border border-[var(--text)]/10 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-[var(--text)]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-[var(--text)] mb-2 tracking-tight">No Repositories Yet</h3>
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
    <div className="bg-white border border-[var(--text)]/5 overflow-hidden rounded-xl">
      <div className="p-4 md:p-6 border-b border-[var(--text)]/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--text)]">Repositories</h2>
            <p className="text-sm text-[var(--text)]/50 mt-1 font-medium">
              Select repositories to review with AI
            </p>
          </div>

          {selectableRepos.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <button
                onClick={toggleAll}
                className="flex-1 md:flex-none px-3 py-2 text-sm font-medium border border-[var(--text)]/10 hover:border-[var(--text)]/20 hover:bg-[var(--background)]/50 transition-all rounded-lg"
              >
                {selectedRepos.size === selectableRepos.length ? "Deselect All" : "Select All"}
              </button>

              <button
                onClick={handleReviewSelected}
                disabled={selectedRepos.size === 0 || isReviewing}
                className="flex-[2] md:flex-none px-4 py-2.5 text-sm bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--text)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold rounded-lg shadow-sm"
              >
                {isReviewing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin"></div>
                    <span className="hidden sm:inline">Starting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Ingest ({selectedRepos.size})
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="divide-y divide-[var(--text)]/5">
        {repositories.map((repo) => {
          const isSelectable = repo.ingestionStatus === "not_reviewed" ||
            repo.ingestionStatus === "failed" ||
            repo.ingestionStatus === "pending";
          const isSelected = selectedRepos.has(repo.id);

          return (
            <div key={repo.id} className={`p-4 md:p-6 transition-all duration-200 ${isSelectable ? 'hover:bg-[var(--background)]/30' : 'bg-[var(--background)]/10'}`}>
              <div className="flex items-start gap-3 md:gap-4">
                {isSelectable && (
                  <div className="pt-1 shrink-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRepo(repo.id)}
                      className="w-5 h-5 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                    <h3 className="font-semibold text-base md:text-lg truncate pr-2">{repo.fullName}</h3>
                    <div className="flex flex-wrap gap-2">
                      {repo.private && (
                        <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded border border-gray-200">
                          Private
                        </span>
                      )}
                      <StatusBadge status={repo.ingestionStatus} />
                    </div>
                  </div>

                  {repo.ingestionStatus === "failed" && repo.ingestionError && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800 break-words">
                        <strong>Error:</strong> {repo.ingestionError}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-[var(--text)]/60">
                    <span>Added {new Date(repo.addedAt).toLocaleDateString()}</span>
                    {repo.lastSyncedAt && (
                      <span className="hidden sm:inline">•</span>
                    )}
                    {repo.lastSyncedAt && (
                      <span>Synced {new Date(repo.lastSyncedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-2">
                  <a
                    href={`https://github.com/${repo.fullName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs font-medium border border-[var(--text)]/10 hover:border-[var(--text)]/20 hover:bg-[var(--background)]/50 transition-all rounded-lg whitespace-nowrap"
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
    not_reviewed: { color: "bg-gray-50 text-gray-700 border-gray-200", label: "Not Ingested" },
    pending: { color: "bg-yellow-50 text-yellow-700 border-yellow-200", label: "Pending" },
    processing: { color: "bg-blue-50 text-blue-700 border-blue-200", label: "Processing" },
    completed: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Ready" },
    failed: { color: "bg-red-50 text-red-700 border-red-200", label: "Failed" },
  }[status] || { color: "bg-gray-50 text-gray-700 border-gray-200", label: status };

  return (
    <span className={`px-3 py-1.5 text-xs font-semibold tracking-wide uppercase border ${config.color}`}>
      {config.label}
    </span>
  );
}
