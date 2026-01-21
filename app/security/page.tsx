import Link from 'next/link';
import { Lock, Shield, Key, Eye } from 'lucide-react';

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-4xl font-bold text-[var(--text)] mb-4 font-heading">Security</h1>
          <p className="text-lg text-[var(--text)]/70">Your code security is our top priority</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white p-6 rounded-xl border border-[var(--text)]/10">
            <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-[var(--primary)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text)] mb-2 font-heading">Encryption</h3>
            <p className="text-sm text-[var(--text)]/70">All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Your code never leaves our secure infrastructure.</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[var(--text)]/10">
            <div className="w-12 h-12 bg-[var(--secondary)]/10 rounded-lg flex items-center justify-center mb-4">
              <Key className="w-6 h-6 text-[var(--secondary)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text)] mb-2 font-heading">Access Control</h3>
            <p className="text-sm text-[var(--text)]/70">Multi-tenant isolation with strict access controls. Each repository's data is completely isolated from others.</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[var(--text)]/10">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text)] mb-2 font-heading">Privacy by Design</h3>
            <p className="text-sm text-[var(--text)]/70">We only request the minimum GitHub permissions necessary. You control which repositories we can access.</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[var(--text)]/10">
            <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text)] mb-2 font-heading">Regular Audits</h3>
            <p className="text-sm text-[var(--text)]/70">Our infrastructure undergoes regular security audits and penetration testing to identify vulnerabilities.</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 border border-[var(--text)]/10 mb-8">
          <h2 className="text-2xl font-bold text-[var(--text)] mb-4 font-heading">Security Measures</h2>
          <ul className="space-y-3 text-[var(--text)]/70">
            <li className="flex items-start gap-3">
              <span className="text-[var(--primary)] mt-1">✓</span>
              <span>SOC 2 Type II compliant infrastructure (in progress)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[var(--primary)] mt-1">✓</span>
              <span>Regular automated security scanning of dependencies</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[var(--primary)] mt-1">✓</span>
              <span>Secure credential management with secrets rotation</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[var(--primary)] mt-1">✓</span>
              <span>Comprehensive logging and monitoring for security events</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[var(--primary)] mt-1">✓</span>
              <span>Incident response plan and security team on standby</span>
            </li>
          </ul>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-red-900 mb-2 font-heading">Report a Vulnerability</h3>
          <p className="text-sm text-red-800 mb-3">
            If you discover a security vulnerability, please report it responsibly.
          </p>
          <a href="mailto:security@graphbug.dev" className="text-sm font-medium text-red-600 hover:underline">
            security@graphbug.dev
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
