-- Drop the old index
DROP INDEX IF EXISTS "pr_repo_number_unique_idx";

-- Add unique constraint
ALTER TABLE "pull_request" ADD CONSTRAINT "pr_repo_number_unique" UNIQUE("repository_id","pr_number");
