import Link from 'next/link';
import { Network, Users, Target, Sparkles } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[var(--text)] mb-4 font-heading">About Graph Bug</h1>
          <p className="text-lg text-[var(--text)]/70">The AI code reviewer that truly understands your codebase</p>
        </div>

        <div className="bg-white rounded-xl p-8 mb-8 border border-[var(--text)]/10">
          <h2 className="text-2xl font-bold text-[var(--text)] mb-4 font-heading">Our Mission</h2>
          <p className="text-[var(--text)]/70 leading-relaxed mb-4">
            Graph Bug is revolutionizing code review by combining the power of knowledge graphs and AI. Unlike traditional tools that only analyze changed files in isolation, we build a complete understanding of your entire codebase.
          </p>
          <p className="text-[var(--text)]/70 leading-relaxed">
            By mapping relationships between functions, classes, and modules, Graph Bug catches bugs that other tools miss - especially those that arise from complex dependencies and side effects across your codebase.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white p-6 rounded-xl border border-[var(--text)]/10">
            <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center mb-4">
              <Network className="w-6 h-6 text-[var(--primary)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text)] mb-2 font-heading">Graph Technology</h3>
            <p className="text-sm text-[var(--text)]/70">We use Neo4j to build a complete knowledge graph of your codebase, mapping every relationship and dependency.</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[var(--text)]/10">
            <div className="w-12 h-12 bg-[var(--secondary)]/10 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-[var(--secondary)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text)] mb-2 font-heading">AI-Powered</h3>
            <p className="text-sm text-[var(--text)]/70">Powered by Google Gemini 2.5, our AI understands context and provides intelligent, actionable feedback.</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[var(--text)]/10">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text)] mb-2 font-heading">Team-Friendly</h3>
            <p className="text-sm text-[var(--text)]/70">Designed for teams of all sizes, from solo developers to large engineering organizations.</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[var(--text)]/10">
            <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text)] mb-2 font-heading">Precision Focus</h3>
            <p className="text-sm text-[var(--text)]/70">We focus on real issues that matter, reducing noise and false positives common in other tools.</p>
          </div>
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm text-[var(--text)]/60 hover:text-[var(--primary)]">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
