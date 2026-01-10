"use client";

import { useState } from "react";

export default function TestPage() {
  const [repoId, setRepoId] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleQuery(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_id: repoId, query }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Query failed");
      }

      const data = await response.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Test AI Query</h1>
        <p className="text-[var(--text)]/60">
          Test the AI service query endpoint with your ingested repositories
        </p>
      </div>

      <form onSubmit={handleQuery} className="bg-white rounded-xl p-6 border border-[var(--text)]/10 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Repository ID</label>
          <input
            type="text"
            value={repoId}
            onChange={(e) => setRepoId(e.target.value)}
            placeholder="Enter repository ID from dashboard"
            className="w-full px-4 py-2 border border-[var(--text)]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Query</label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Function that handles authentication"
            className="w-full px-4 py-2 border border-[var(--text)]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] min-h-[100px]"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? "Searching..." : "Search Code"}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-800 font-medium">Error:</p>
          <p className="text-red-700 text-sm mt-1">{error}</p>
        </div>
      )}

      {results && (
        <div className="bg-white rounded-xl p-6 border border-[var(--text)]/10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Results</h2>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              {results.count} {results.count === 1 ? "result" : "results"}
            </span>
          </div>

          {results.results.length === 0 && (
            <p className="text-[var(--text)]/60 text-center py-8">
              No results found. Try a different query.
            </p>
          )}

          <div className="space-y-4">
            {results.results.map((result: any, index: number) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      Score: {(result.score * 100).toFixed(1)}%
                    </span>
                    <span className="font-mono text-sm">{result.name}</span>
                  </div>
                  <span className="text-sm text-[var(--text)]/60">{result.file}:{result.start_line}</span>
                </div>

                <pre className="p-4 bg-white rounded border border-[var(--text)]/10 overflow-x-auto text-sm">
                  <code>{result.code}</code>
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
