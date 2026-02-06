"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Search, Filter, X, ExternalLink, Clock, AlertCircle, CheckCircle2, Loader2, Calendar, GitPullRequest, ArrowUpRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

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
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    status: "all",
    author: "",
    repository: "",
  });

  useEffect(() => {
    fetchReviews();
  }, [page, filters]);

  async function fetchReviews() {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(filters.status && filters.status !== "all" && { status: filters.status }),
        ...(filters.author && { author: filters.author }),
        ...(filters.repository && { repositoryId: filters.repository }),
      });

      console.log("Fetching reviews with params:", params.toString());
      const response = await fetch(`/api/analytics/reviews?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Reviews data:", data);

      setReviews(data.reviews || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      setError(error instanceof Error ? error.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }

  const hasActiveFilters = filters.status !== "all" || filters.author || filters.repository;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Review History</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Monitor and analyze code review performance across your repositories.
          </p>
        </div>
        {total > 0 && (
           <Badge variant="outline" className="w-fit">
            {total} Total Reviews
           </Badge>
        )}
      </div>

      {/* Toolbar / Filters */}
      <div className="bg-card border rounded-lg shadow-sm p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto flex-1">
            {/* Search Author */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={filters.author}
                onChange={(e) => {
                  setFilters({ ...filters, author: e.target.value });
                  setPage(1);
                }}
                placeholder="Search by author..."
                className="pl-9 bg-background border-input shadow-sm focus-visible:ring-primary"
              />
            </div>

            {/* Status Select */}
            <div className="w-full sm:w-48">
              <Select
                value={filters.status}
                onValueChange={(value) => {
                  setFilters({ ...filters, status: value });
                  setPage(1);
                }}
              >
                <SelectTrigger className="bg-background border-input shadow-sm w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--background)]">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilters({ status: "all", author: "", repository: "" });
                setPage(1);
              }}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <X className="h-4 w-4 mr-2" />
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-4">
        {error ? (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center text-destructive">
              <AlertCircle className="h-10 w-10 mb-4" />
              <h3 className="text-lg font-semibold">Failed to load reviews</h3>
              <p className="opacity-80 mt-1 max-w-sm mx-auto">{error}</p>
              <Button onClick={fetchReviews} variant="outline" className="mt-4 border-destructive/30 hover:bg-destructive/10 text-destructive">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
            <p className="text-muted-foreground animate-pulse font-medium">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <EmptyState filters={filters} clearFilters={() => setFilters({ status: "all", author: "", repository: "" })} />
        ) : (
          <div className="grid gap-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Page <span className="font-medium text-foreground">{page}</span> of <span className="font-medium text-foreground">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ filters, clearFilters }: { filters: any, clearFilters: () => void }) {
  const hasFilters = filters.status !== "all" || filters.author || filters.repository;

  return (
    <div className="border border-dashed rounded-lg p-12 flex flex-col items-center justify-center text-center bg-muted/5">
      <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center mb-6">
        <GitPullRequest className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">No active reviews</h3>
      <p className="text-muted-foreground max-w-md mb-8">
        {hasFilters
          ? "We couldn't find any reviews matching your current filters. Try adjusting or clearing them."
          : "Get started by opening a pull request in one of your connected repositories. The AI reviewer will automatically analyze it."}
      </p>
      {hasFilters && (
        <Button onClick={clearFilters} variant="secondary">
          Clear All Filters
        </Button>
      )}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const handleClick = () => {
    window.open(`/analytics/reviews/${review.id}`, "_blank");
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group relative bg-card border rounded-lg p-5 shadow-sm transition-all duration-200",
        "hover:shadow-md hover:border-primary/20 hover:bg-accent/5 cursor-pointer"
      )}
    >
      <div className="flex flex-col sm:flex-row gap-4 sm:items-start justify-between">
        
        {/* Main Info */}
        <div className="flex-1 space-y-3 min-w-0">
          <div className="flex items-center gap-3 text-sm">
            <Badge variant="outline" className="font-mono text-xs bg-muted/30 text-muted-foreground font-normal">
              #{review.prNumber}
            </Badge>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span>{review.repositoryName}</span>
              <span className="text-muted-foreground/30">•</span>
              <span className="flex items-center gap-1">
                By <span className="font-medium text-foreground">{review.author}</span>
              </span>
              <span className="text-muted-foreground/30">•</span>
              <span className="flex items-center gap-1" title={format(new Date(review.createdAt), "PPpp")}>
                <Clock className="w-3 h-3" />
                {format(new Date(review.createdAt), "MMM d, yyyy")}
              </span>
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
            <span className="truncate">{review.prTitle}</span>
            <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary shadow-none" />
          </h3>

          {/* Metrics Bar */}
          <div className="flex flex-wrap items-center gap-6 pt-1">
             {/* Score */}
            {review.summary && (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-primary to-primary/60">
                  {review.summary.overallScore}
                </span>
                <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Score</span>
              </div>
            )}
             
            {/* Cost */}
            <div className="flex items-baseline gap-2 pl-6 border-l">
              <span className="text-lg font-semibold text-foreground">
                ${(review.totalCost || 0).toFixed(4)}
              </span>
               <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Cost</span>
            </div>

            {/* Issues Summary */}
            {review.summary && review.summary.issuesFound > 0 && (
              <div className="flex items-center gap-2 pl-6 border-l">
                 {review.summary.critical > 0 && <IssueCount count={review.summary.critical} type="critical" />}
                 {review.summary.high > 0 && <IssueCount count={review.summary.high} type="high" />}
                 {review.summary.medium > 0 && <IssueCount count={review.summary.medium} type="medium" />}
                 {review.summary.low > 0 && <IssueCount count={review.summary.low} type="low" />}
              </div>
            )}
          </div>
        </div>

        {/* Status Actions */}
        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-4 sm:pl-4 sm:border-l sm:h-full min-h-[80px]">
          <StatusBadge status={review.status} />
          
          <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-1 text-muted-foreground group-hover:text-foreground">
             View Analysis
             <ArrowUpRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function IssueCount({ count, type }: { count: number, type: 'critical' | 'high' | 'medium' | 'low' }) {
    const colors = {
        critical: "bg-destructive text-destructive-foreground border-destructive",
        high: "bg-orange-500 text-white border-orange-600",
        medium: "bg-yellow-500 text-white border-yellow-600",
        low: "bg-blue-500 text-white border-blue-600"
    };

    const labels = {
        critical: "Critical",
        high: "High",
        medium: "Med",
        low: "Low"
    };

    return (
        <div className={cn("px-2 py-0.5 rounded text-xs font-semibold shadow-sm border flex items-center gap-1", colors[type])}>
            <span>{count}</span>
            <span className="opacity-80 font-normal">{labels[type]}</span>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    completed: "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20",
    in_progress: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
    failed: "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
    pending: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  };

  const icons = {
    completed: CheckCircle2,
    in_progress: Loader2,
    failed: AlertCircle,
    pending: Clock,
  };

  // @ts-ignore
  const Icon = icons[status] || Clock;
  // @ts-ignore
  const style = styles[status] || styles.pending;

  const label = status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border", style)}>
      <Icon className={cn("w-3.5 h-3.5", status === 'in_progress' && "animate-spin")} />
      {label}
    </div>
  );
}