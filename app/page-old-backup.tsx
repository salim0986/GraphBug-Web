import Link from "next/link";
import { ArrowRight, Github, Sparkles, Network, Zap, Shield, Code2, GitPullRequest } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none" />
      
      {/* Header */}
      <header className="border-b border-slate-900/10 bg-white/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <nav className="container mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-600 rounded-xl animate-pulse" />
              <div className="absolute inset-0.5 bg-white rounded-lg flex items-center justify-center">
                <Network className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Graph Bug
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors">
              How It Works
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors">
              Pricing
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            <Link 
              href="/login" 
              className="px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-all duration-200"
            >
              Sign In
            </Link>
            <Link 
              href="/login" 
              className="group px-5 py-2 text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-200 flex items-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative">
        <section className="container mx-auto px-6 lg:px-8 pt-20 pb-24 lg:pt-32 lg:pb-32">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100/80 backdrop-blur-sm border border-blue-200 rounded-full text-sm font-medium text-blue-700 shadow-sm">
              <Sparkles className="w-4 h-4" />
              AI-Powered Code Review with True Codebase Understanding
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>
            </div>
            
            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight">
              Code Reviews That
              <br />
              <span className="relative inline-block">
                <span className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 blur-2xl opacity-30 animate-pulse"></span>
                <span className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                  Actually Understand
                </span>
              </span>
              {" "}Your Code
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl lg:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              The only AI reviewer powered by <span className="font-semibold text-slate-900">Knowledge Graphs</span>.
              Find bugs, security issues, and code smells with true context awareness.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Link 
                href="/login" 
                className="group px-8 py-4 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                Start Reviewing for Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a 
                href="https://github.com" 
                target="_blank"
                rel="noopener noreferrer"
                className="group px-8 py-4 text-base font-semibold border-2 border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-white rounded-xl transition-all duration-300 flex items-center gap-2"
              >
                <Github className="w-5 h-5" />
                View on GitHub
              </a>
            </div>
            
            {/* Social Proof */}
            <div className="flex items-center justify-center gap-8 pt-12 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 border-2 border-white" />
                  ))}
                </div>
                <span className="font-medium">10,000+ reviews</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-yellow-500">★★★★★</span>
                <span className="font-medium">5.0 rating</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container mx-auto px-6 lg:px-8 py-24 bg-white/50">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Why Teams Choose <span className="text-blue-600">Graph Bug</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Our unique GraphRAG technology gives you codebase understanding that other tools can't match
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Feature 1: Knowledge Graphs */}
            <div className="group p-8 rounded-2xl bg-white border-2 border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Network className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Knowledge Graphs</h3>
              <p className="text-slate-600 leading-relaxed">
                Builds a complete graph of your codebase relationships. Understands how functions, classes, and modules connect.
              </p>
              <div className="mt-4 inline-flex items-center text-blue-600 font-semibold text-sm">
                Learn more <ArrowRight className="w-4 h-4 ml-1" />
              </div>
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