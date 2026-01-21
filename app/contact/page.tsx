import Link from 'next/link';
import { Mail, MessageSquare, Github } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[var(--text)] mb-4 font-heading">Contact Us</h1>
          <p className="text-lg text-[var(--text)]/70">Get in touch with the Graph Bug team</p>
        </div>

        <div className="grid gap-6 mb-12">
          <a href="mailto:support@graphbug.dev" className="bg-white p-6 rounded-xl border border-[var(--text)]/10 hover:border-[var(--primary)]/30 transition-all flex items-start gap-4">
            <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6 text-[var(--primary)]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--text)] mb-1 font-heading">Email Support</h3>
              <p className="text-sm text-[var(--text)]/70 mb-2">For general inquiries and support questions</p>
              <p className="text-sm font-medium text-[var(--primary)]">support@graphbug.dev</p>
            </div>
          </a>

          <a href="https://github.com/graphbug/graphbug/discussions" target="_blank" rel="noopener noreferrer" className="bg-white p-6 rounded-xl border border-[var(--text)]/10 hover:border-[var(--secondary)]/30 transition-all flex items-start gap-4">
            <div className="w-12 h-12 bg-[var(--secondary)]/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-6 h-6 text-[var(--secondary)]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--text)] mb-1 font-heading">Community Discussions</h3>
              <p className="text-sm text-[var(--text)]/70 mb-2">Join our community to ask questions and share ideas</p>
              <p className="text-sm font-medium text-[var(--secondary)]">GitHub Discussions →</p>
            </div>
          </a>

          <a href="https://github.com/graphbug/graphbug/issues" target="_blank" rel="noopener noreferrer" className="bg-white p-6 rounded-xl border border-[var(--text)]/10 hover:border-blue-400/30 transition-all flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Github className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--text)] mb-1 font-heading">Report Issues</h3>
              <p className="text-sm text-[var(--text)]/70 mb-2">Found a bug or have a feature request?</p>
              <p className="text-sm font-medium text-blue-600">Open an Issue →</p>
            </div>
          </a>
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
