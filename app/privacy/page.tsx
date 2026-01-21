import Link from 'next/link';
import { Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-[var(--primary)]" />
          </div>
          <h1 className="text-4xl font-bold text-[var(--text)] mb-4 font-heading">Privacy Policy</h1>
          <p className="text-sm text-[var(--text)]/60">Last updated: January 19, 2026</p>
        </div>

        <div className="bg-white rounded-xl p-8 border border-[var(--text)]/10 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-3 font-heading">Introduction</h2>
            <p className="text-[var(--text)]/70 leading-relaxed">
              Graph Bug ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our AI-powered code review service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-3 font-heading">Information We Collect</h2>
            <ul className="list-disc list-inside space-y-2 text-[var(--text)]/70">
              <li>GitHub account information (username, email, profile picture)</li>
              <li>Repository metadata and code from repositories you authorize</li>
              <li>Pull request data and comments</li>
              <li>Usage analytics and performance metrics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-3 font-heading">How We Use Your Data</h2>
            <ul className="list-disc list-inside space-y-2 text-[var(--text)]/70">
              <li>To analyze code and provide automated PR reviews</li>
              <li>To build knowledge graphs of your codebase</li>
              <li>To improve our AI models and service quality</li>
              <li>To communicate with you about the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-3 font-heading">Data Security</h2>
            <p className="text-[var(--text)]/70 leading-relaxed">
              We implement industry-standard security measures to protect your data. All data is encrypted in transit and at rest. We use secure databases (Neo4j, Qdrant, PostgreSQL) with access controls and regular backups.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-3 font-heading">Your Rights</h2>
            <p className="text-[var(--text)]/70 leading-relaxed mb-2">
              You have the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-[var(--text)]/70">
              <li>Access your personal data</li>
              <li>Request deletion of your data</li>
              <li>Revoke GitHub App permissions at any time</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-3 font-heading">Contact Us</h2>
            <p className="text-[var(--text)]/70 leading-relaxed">
              For privacy-related questions, please contact us at <a href="mailto:privacy@graphbug.dev" className="text-[var(--primary)] hover:underline">privacy@graphbug.dev</a>
            </p>
          </section>
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
