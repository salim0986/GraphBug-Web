import Link from 'next/link';
import { CheckCircle2, Sparkles, Bug, Zap } from 'lucide-react';

export default function ChangelogPage() {
  const releases = [
    {
      version: "v1.2.0",
      date: "January 15, 2026",
      changes: [
        { type: "feature", text: "Added support for Python type hints in graph analysis" },
        { type: "feature", text: "New analytics dashboard with cost tracking" },
        { type: "improvement", text: "Improved context merging for large PRs" },
        { type: "fix", text: "Fixed issue with nested class detection in TypeScript" }
      ]
    },
    {
      version: "v1.1.0",
      date: "January 5, 2026",
      changes: [
        { type: "feature", text: "Gemini 2.5 Flash integration for faster reviews" },
        { type: "feature", text: "Multi-repository support" },
        { type: "improvement", text: "Enhanced vector search with better embeddings" },
        { type: "fix", text: "Resolved webhook timeout issues" }
      ]
    },
    {
      version: "v1.0.0",
      date: "December 20, 2025",
      changes: [
        { type: "feature", text: "Initial public release" },
        { type: "feature", text: "GitHub App integration" },
        { type: "feature", text: "Neo4j knowledge graph builder" },
        { type: "feature", text: "Automated PR reviews with AI" }
      ]
    }
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'feature': return <Sparkles className="w-4 h-4 text-[var(--primary)]" />;
      case 'improvement': return <Zap className="w-4 h-4 text-[var(--secondary)]" />;
      case 'fix': return <Bug className="w-4 h-4 text-red-500" />;
      default: return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
    }
  };

  const getLabel = (type: string) => {
    switch (type) {
      case 'feature': return 'New';
      case 'improvement': return 'Improved';
      case 'fix': return 'Fixed';
      default: return 'Update';
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[var(--text)] mb-4 font-heading">Changelog</h1>
          <p className="text-lg text-[var(--text)]/70">Track all updates and improvements to Graph Bug</p>
        </div>

        <div className="space-y-8">
          {releases.map((release, index) => (
            <div key={index} className="bg-white rounded-xl p-6 border border-[var(--text)]/10">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--text)]/10">
                <h2 className="text-xl font-bold text-[var(--text)] font-heading">{release.version}</h2>
                <span className="text-sm text-[var(--text)]/60">{release.date}</span>
              </div>
              <ul className="space-y-3">
                {release.changes.map((change, changeIndex) => (
                  <li key={changeIndex} className="flex items-start gap-3">
                    <div className="mt-0.5">{getIcon(change.type)}</div>
                    <div className="flex-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[var(--background)] text-[var(--text)]/70 mr-2">
                        {getLabel(change.type)}
                      </span>
                      <span className="text-sm text-[var(--text)]/70">{change.text}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link href="/" className="text-sm text-[var(--text)]/60 hover:text-[var(--primary)]">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
