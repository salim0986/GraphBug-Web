import Link from 'next/link';
import { Book, Code, Zap, GitBranch } from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[var(--text)] mb-4 font-heading">Documentation</h1>
          <p className="text-lg text-[var(--text)]/70">Learn how to get the most out of Graph Bug</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-[var(--text)]/10 hover:border-[var(--primary)]/30 transition-all">
            <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-[var(--primary)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text)] mb-2 font-heading">Quick Start</h3>
            <p className="text-sm text-[var(--text)]/70 mb-4">Get up and running with Graph Bug in minutes. Install our GitHub App and start reviewing PRs instantly.</p>
            <Link href="/login" className="text-sm font-medium text-[var(--primary)] hover:underline">Get Started →</Link>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[var(--text)]/10 hover:border-[var(--primary)]/30 transition-all">
            <div className="w-12 h-12 bg-[var(--secondary)]/10 rounded-lg flex items-center justify-center mb-4">
              <GitBranch className="w-6 h-6 text-[var(--secondary)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text)] mb-2 font-heading">PR Reviews</h3>
            <p className="text-sm text-[var(--text)]/70 mb-4">Understand how Graph Bug analyzes your pull requests using graph-based context and vector search.</p>
            <span className="text-sm font-medium text-[var(--text)]/40">Coming soon</span>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[var(--text)]/10 hover:border-[var(--primary)]/30 transition-all">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
              <Code className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text)] mb-2 font-heading">API Reference</h3>
            <p className="text-sm text-[var(--text)]/70 mb-4">Integrate Graph Bug into your CI/CD pipeline with our comprehensive API documentation.</p>
            <span className="text-sm font-medium text-[var(--text)]/40">Coming soon</span>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[var(--text)]/10 hover:border-[var(--primary)]/30 transition-all">
            <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center mb-4">
              <Book className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text)] mb-2 font-heading">Best Practices</h3>
            <p className="text-sm text-[var(--text)]/70 mb-4">Learn the best practices for using Graph Bug effectively in your development workflow.</p>
            <span className="text-sm font-medium text-[var(--text)]/40">Coming soon</span>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link href="/" className="text-sm text-[var(--text)]/60 hover:text-[var(--primary)]">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
