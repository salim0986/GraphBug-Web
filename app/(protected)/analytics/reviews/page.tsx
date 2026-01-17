"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";

interface Review {
  id: string;
  prNumber: number;
  prTitle: string;
  prHtmlUrl: string;
  repositoryName: string;
  repositoryFullName: string;
  author: string;
  status: string;
  summary: {
    overallScore: number;
    issuesFound: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  } | null;
  totalCost: number | null;
  createdAt: string;
  completedAt: string | null;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: "",
    author: "",
    repository: "",
  });

  useEffect(() => {
    fetchReviews();
  }, [page, filters]);

  async function fetchReviews() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(filters.status && { status: filters.status }),
        ...(filters.author && { author: filters.author }),
        ...(filters.repository && { repositoryId: filters.repository }),
      });

      const response = await fetch(`/api/analytics/reviews?${params}`);
      const data = await response.json();

      setReviews(data.reviews || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Review History</h1>
        <p className="text-[var(--text)]/60 mt-1">
          Browse and analyze all code reviews
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-[var(--text)]/10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters({ ...filters, status: e.target.value });
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-[var(--text)]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Author</label>
            <input
              type="text"
              value={filters.author}
              onChange={(e) => {
                setFilters({ ...filters, author: e.target.value });
                setPage(1);
              }}
              placeholder="Filter by author..."
              className="w-full px-3 py-2 border border-[var(--text)]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({ status: "", author: "", repository: "" });
                setPage(1);
              }}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-xl border border-[var(--text)]/10 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-[var(--text)]/60">
            No reviews found
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-[var(--text)]/10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text)]/70 uppercase">
                      PR
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text)]/70 uppercase">
                      Repository
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text)]/70 uppercase">
                      Author
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text)]/70 uppercase">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text)]/70 uppercase">
                      Issues
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text)]/70 uppercase">
                      Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text)]/70 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text)]/70 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--text)]/10">
                  {reviews.map((review) => (
                    <tr
                      key={review.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => window.open(`/analytics/reviews/${review.id}`, "_blank")}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">#{review.prNumber}</span>
                        </div>
                        <div className="text-sm text-[var(--text)]/60 truncate max-w-xs">
                          {review.prTitle}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">{review.repositoryName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">{review.author}</div>
                      </td>
                      <td className="px-6 py-4">
                        {review.summary ? (
                          <div className="flex items-center gap-2">
                            <div className="text-lg font-bold">
                              {review.summary.overallScore}
                            </div>
                            <div className="text-xs text-[var(--text)]/60">/100</div>
                          </div>
                        ) : (
                          <span className="text-[var(--text)]/40">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {review.summary ? (
                          <div className="flex flex-wrap gap-1">
                            {review.summary.critical > 0 && (
                              <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                                {review.summary.critical} 🔴
                              </span>
                            )}
                            {review.summary.high > 0 && (
                              <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded">
                                {review.summary.high} 🟠
                              </span>
                            )}
                            {review.summary.medium > 0 && (
                              <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">
                                {review.summary.medium} 🟡
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[var(--text)]/40">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium">
                          ${(review.totalCost || 0).toFixed(4)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {format(new Date(review.createdAt), "MMM d, yyyy")}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={review.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--text)]/10">
                <div className="text-sm text-[var(--text)]/60">
                  Page {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm bg-white border border-[var(--text)]/20 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 text-sm bg-white border border-[var(--text)]/20 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    completed: { color: "bg-green-100 text-green-700", label: "Completed" },
    in_progress: { color: "bg-blue-100 text-blue-700", label: "In Progress" },
    failed: { color: "bg-red-100 text-red-700", label: "Failed" },
    pending: { color: "bg-gray-100 text-gray-700", label: "Pending" },
  }[status] || { color: "bg-gray-100 text-gray-700", label: status };

  return (
    <span className={`px-2 py-1 text-xs rounded ${config.color}`}>
      {config.label}
    </span>
  );
}
