import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--text)]/10 bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] rounded-lg"></div>
            <span className="text-xl font-bold">Graph Bug</span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="px-6 py-2 text-sm font-medium hover:bg-black/5 rounded-lg transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/login" 
              className="px-6 py-2 text-sm font-medium bg-[var(--primary)] hover:bg-[var(--primary)]/90 rounded-lg transition-colors shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)]/10 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-[var(--primary)] rounded-full animate-pulse"></span>
            AI-Powered Code Review
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            Intelligent Code Review
            <span className="block bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">
              with Graph RAG
            </span>
          </h1>
          
          <p className="text-xl text-[var(--text)]/70 max-w-2xl mx-auto">
            Advanced AI-powered code review and bug detection using cutting-edge graph-based RAG techniques. 
            Catch bugs before they reach production.
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            <Link 
              href="/login" 
              className="px-8 py-4 text-lg font-medium bg-[var(--primary)] hover:bg-[var(--primary)]/90 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              Start Reviewing →
            </Link>
            <a 
              href="https://github.com" 
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 text-lg font-medium border-2 border-[var(--text)]/20 hover:border-[var(--text)]/40 rounded-xl transition-all"
            >
              View on GitHub
            </a>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-32 grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="p-8 rounded-2xl bg-white/50 border border-[var(--text)]/10 hover:border-[var(--primary)]/30 transition-all hover:shadow-lg">
            <div className="w-12 h-12 bg-[var(--primary)]/20 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
            <p className="text-[var(--text)]/70">Review pull requests in seconds with our optimized AI engine.</p>
          </div>

          <div className="p-8 rounded-2xl bg-white/50 border border-[var(--text)]/10 hover:border-[var(--secondary)]/30 transition-all hover:shadow-lg">
            <div className="w-12 h-12 bg-[var(--secondary)]/20 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Detection</h3>
            <p className="text-[var(--text)]/70">Graph-based analysis finds complex bugs traditional tools miss.</p>
          </div>

          <div className="p-8 rounded-2xl bg-white/50 border border-[var(--text)]/10 hover:border-[var(--accent)]/30 transition-all hover:shadow-lg">
            <div className="w-12 h-12 bg-[var(--accent)]/20 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">GitHub Integration</h3>
            <p className="text-[var(--text)]/70">Seamless integration with your existing GitHub workflow.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--text)]/10 py-8">
        <div className="container mx-auto px-6 text-center text-sm text-[var(--text)]/60">
          © 2026 Graph Bug. All rights reserved.
        </div>
      </footer>
    </div>
  );
}