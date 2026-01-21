import Link from 'next/link';
import { FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-[var(--secondary)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-[var(--secondary)]" />
          </div>
          <h1 className="text-4xl font-bold text-[var(--text)] mb-4 font-heading">Terms of Service</h1>
          <p className="text-sm text-[var(--text)]/60">Last updated: January 19, 2026</p>
        </div>

        <div className="bg-white rounded-xl p-8 border border-[var(--text)]/10 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-3 font-heading">Acceptance of Terms</h2>
            <p className="text-[var(--text)]/70 leading-relaxed">
              By accessing or using Graph Bug, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-3 font-heading">Service Description</h2>
            <p className="text-[var(--text)]/70 leading-relaxed">
              Graph Bug provides AI-powered code review services for GitHub repositories. We analyze your code using knowledge graphs and machine learning to provide intelligent feedback on pull requests.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-3 font-heading">User Responsibilities</h2>
            <ul className="list-disc list-inside space-y-2 text-[var(--text)]/70">
              <li>You must provide accurate information when creating an account</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You must not use the service for any illegal purposes</li>
              <li>You must not attempt to reverse engineer or exploit our service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-3 font-heading">GitHub Integration</h2>
            <p className="text-[var(--text)]/70 leading-relaxed">
              By installing our GitHub App, you grant us permission to access the repositories you select. We will only access data necessary to provide our service. You can revoke these permissions at any time through GitHub settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-3 font-heading">Service Availability</h2>
            <p className="text-[var(--text)]/70 leading-relaxed">
              We strive to maintain high availability but do not guarantee uninterrupted service. We may perform maintenance or updates that temporarily affect service availability.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-3 font-heading">Limitation of Liability</h2>
            <p className="text-[var(--text)]/70 leading-relaxed">
              Graph Bug is provided "as is" without warranties of any kind. We are not liable for any damages arising from the use of our service. Our AI-generated reviews are suggestions and should not replace human judgment.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-3 font-heading">Changes to Terms</h2>
            <p className="text-[var(--text)]/70 leading-relaxed">
              We may update these terms from time to time. We will notify users of significant changes via email or through the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-3 font-heading">Contact</h2>
            <p className="text-[var(--text)]/70 leading-relaxed">
              For questions about these terms, contact us at <a href="mailto:legal@graphbug.dev" className="text-[var(--primary)] hover:underline">legal@graphbug.dev</a>
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
