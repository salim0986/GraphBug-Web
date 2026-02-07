"use client";

import Link from "next/link";
import { ArrowRight, Github, Sparkles, Network, Zap, Shield, Code2, GitPullRequest, Check, ChevronRight, Menu, X } from "lucide-react";
import { motion, useScroll, useSpring, AnimatePresence, Variants } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session } = useSession();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div className="min-h-screen bg-[var(--background)] font-sans overflow-x-hidden">
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] origin-left z-[100]"
        style={{ scaleX }}
      />
      
      {/* Animated Background Grid */}
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none opacity-40" />
      
      {/* Floating Orbs for "Wow" Effect */}
      <motion.div 
        animate={{ 
          x: [0, 100, 0], 
          y: [0, -50, 0],
          opacity: [0.3, 0.5, 0.3] 
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="fixed top-20 right-[-100px] w-96 h-96 bg-[var(--primary)]/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob pointer-events-none"
      />
      <motion.div 
        animate={{ 
          x: [0, -100, 0], 
          y: [0, 50, 0],
          opacity: [0.3, 0.5, 0.3] 
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 2 }}
        className="fixed bottom-20 left-[-100px] w-96 h-96 bg-[var(--secondary)]/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob pointer-events-none"
      />

      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 w-full border-b border-[var(--text)]/10 bg-white/80 backdrop-blur-xl z-50 shadow-sm"
      >
        <nav className="container mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img 
              src="/logo.png" 
              alt="Graph Bug Logo" 
              className="w-10 h-10 rounded-xl group-hover:scale-105 transition-transform duration-300"
            />
            <span className="text-xl font-bold text-[var(--text)]">
              Graph Bug
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-[var(--text)]/70 hover:text-[var(--primary)] transition-colors relative group">
              Features
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--primary)] transition-all group-hover:w-full" />
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium text-[var(--text)]/70 hover:text-[var(--primary)] transition-colors relative group">
              How It Works
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--primary)] transition-all group-hover:w-full" />
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-[var(--text)]/70 hover:text-[var(--primary)] transition-colors relative group">
              Pricing
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--primary)] transition-all group-hover:w-full" />
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            {!session?.user && <Link 
              href="/login" 
              className="hidden md:block px-5 py-2.5 text-sm font-semibold text-[var(--text)]/70 hover:text-[var(--primary)] transition-colors"
            >
              Sign In
            </Link>}
            <Button href={session?.user ? "/dashboard" : "/login"} size="sm" className="hidden md:flex shadow-none">
                {session?.user ? "Go to Dashboard" : "Start For Free"}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            <button className="md:hidden p-2 text-[var(--text)]/70" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>
        
        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-[var(--text)]/10 bg-white"
            >
              <div className="container mx-auto px-6 py-4 space-y-4">
                <Link href="#features" className="block text-[var(--text)]/70 font-medium" onClick={() => setIsMenuOpen(false)}>Features</Link>
                <Link href="#how-it-works" className="block text-[var(--text)]/70 font-medium" onClick={() => setIsMenuOpen(false)}>How It Works</Link>
                <Link href="#pricing" className="block text-[var(--text)]/70 font-medium" onClick={() => setIsMenuOpen(false)}>Pricing</Link>
                <div className="pt-4 border-t border-[var(--text)]/10 flex flex-col gap-3">
                  {session?.user ? (
                    <Link href="/dashboard" className="block text-center py-2 text-[var(--text)]/70 font-semibold" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
                  ) : (
                    <Link href="/login" className="block text-center py-2 text-[var(--text)]/70 font-semibold" onClick={() => setIsMenuOpen(false)}>Sign In</Link>
                  )}
                  <Button href={session?.user ? "/dashboard" : "/login"} onClick={() => setIsMenuOpen(false)} className="w-full">Get Started</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Hero Section */}
      <main className="relative pt-24 pb-16 lg:pt-32 lg:pb-32 overflow-hidden">
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-5xl mx-auto text-center space-y-10"
          >
            {/* Badge */}
            <motion.div variants={fadeInUp} className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-md border border-[var(--primary)]/20 rounded-full shadow-lg hover:shadow-xl transition-all cursor-default">
                <Sparkles className="w-4 h-4 text-[var(--primary)]" />
                <span className="text-sm font-medium text-[var(--primary)]">
                  Introducing GraphRAG Technology
                </span>
                <span className="flex h-2 w-2 relative ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--primary)]"></span>
                </span>
              </div>
            </motion.div>
            
            {/* Headline */}
            <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.1]">
              Code Reviews with
              <br />
              <span className="relative inline-block mt-2">
                <span className="absolute -inset-2 bg-gradient-to-r from-[var(--primary)] via-[var(--secondary)] to-[var(--accent)] blur-3xl opacity-20 pointer-events-none"></span>
                <span className="relative text-[var(--primary)] pb-4">
                  Actual Intelligence
                </span>
              </span>
            </motion.h1>
            
            {/* Subtitle */}
            <motion.p variants={fadeInUp} className="text-xl md:text-2xl text-[var(--text)]/70 max-w-3xl mx-auto leading-relaxed font-medium">
              Existing AI tools guess. Graph Bug <b className="text-[var(--text)]">understands</b>. 
              Powered by Knowledge Graphs to catch the deep logical bugs that LLMs miss.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
              <Button href="/login" size="lg" className="rounded-2xl px-10 py-7 text-xl shadow-xl shadow-[var(--primary)]/30 hover:shadow-2xl hover:shadow-[var(--primary)]/40 hover:-translate-y-1">
                  Analyze My Code Free
                  <ArrowRight className="w-6 h-6 ml-2" />
              </Button>
              
              <motion.a 
                href="https://github.com" 
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group px-8 py-4 text-lg font-semibold bg-white border border-[var(--text)]/20 text-[var(--text)] rounded-2xl hover:bg-[var(--text)]/5 hover:border-[var(--text)]/30 transition-all flex items-center gap-3 shadow-md hover:shadow-lg"
              >
                <Github className="w-6 h-6" />
                See How It Works
              </motion.a>
            </motion.div>
            
            {/* Social Proof */}
            <motion.div variants={fadeInUp} className="pt-16 flex flex-col items-center gap-4">
              <p className="text-sm font-semibold uppercase tracking-wider text-[var(--text)]/40">Trusted by developers at</p>
              <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                 {/* Placeholders for logos - would use SVGs in production */}
                 <div className="text-xl font-bold font-mono text-[var(--text)]">ACME Corp</div>
                 <div className="text-xl font-bold font-mono text-[var(--text)]">TechnoLogic</div>
                 <div className="text-xl font-bold font-mono text-[var(--text)]">DataFlow</div>
                 <div className="text-xl font-bold font-mono text-[var(--text)]">CloudSystems</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      {/* Features Section - Bento Grid Style */}
      <section id="features" className="py-32 bg-white relative">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[var(--text)]">
               Why simple LLMs aren't enough
            </h2>
            <p className="text-xl text-[var(--text)]/70 max-w-2xl mx-auto">
              Graph Bug combines the reasoning of LLMs with the structured memory of a Knowledge Graph.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Large Feature */}
            <motion.div 
               initial={{ opacity: 0, x: -20 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.5 }}
               className="md:col-span-2 p-10 rounded-[2rem] bg-white border border-[var(--text)]/10 hover:border-[var(--primary)]/20 hover:shadow-2xl transition-all duration-500 group overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
                 <Network className="w-64 h-64 text-[var(--primary)]" />
              </div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-[var(--primary)]/10 rounded-2xl shadow-lg border border-[var(--primary)]/20 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                  <Network className="w-8 h-8 text-[var(--primary)]" />
                </div>
                <h3 className="text-3xl font-bold mb-4 text-[var(--text)]">Deep Context Awareness</h3>
                <p className="text-lg text-[var(--text)]/70 leading-relaxed max-w-md">
                  We don't just read the file; we map the entire dependency graph. When you change a function, we check every single place it's called across your entire codebase.
                </p>
                <div className="mt-8 flex items-center gap-2 text-[var(--primary)] font-bold group-hover:translate-x-2 transition-transform cursor-pointer">
                  See the graph in action <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
               initial={{ opacity: 0, x: 20 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.5, delay: 0.1 }}
               className="p-10 rounded-[2rem] bg-[var(--primary)] text-[var(--text)] shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
            >
              <Zap className="w-12 h-12 mb-6 text-[var(--text)]/90" />
              <h3 className="text-2xl font-bold mb-3">Instant Reviews</h3>
              <p className="text-[var(--text)]/80 leading-relaxed mb-6">
                Zero setup time. Our Temporary Graph technology reviews new PRs immediately, even on first install.
              </p>
              <div className="w-full bg-[var(--text)]/20 h-1.5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-[var(--text)]"
                />
              </div>
              <p className="text-xs mt-2 text-[var(--text)]/60 font-mono">Processing: 0.4s</p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.5, delay: 0.2 }}
               className="p-10 rounded-[2rem] bg-white border border-[var(--text)]/10 hover:border-red-200 hover:shadow-xl transition-all duration-500 group"
            >
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-6 text-red-600 group-hover:rotate-12 transition-transform">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-[var(--text)]">Security First</h3>
              <p className="text-[var(--text)]/70 leading-relaxed">
                Detects vulnerabilities that regex scanners miss by understanding data flow and taint analysis.
              </p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.5, delay: 0.3 }}
               className="md:col-span-2 p-10 rounded-[2rem] bg-white border border-[var(--text)]/10 shadow-lg hover:shadow-2xl transition-all duration-500 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--background)] to-white opacity-50" />
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                <div className="flex-1">
                  <div className="w-14 h-14 bg-[var(--accent)]/10 rounded-2xl flex items-center justify-center mb-6 text-[var(--accent)]">
                    <Code2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-[var(--text)]">Semantic Search</h3>
                  <p className="text-[var(--text)]/70 leading-relaxed mb-6">
                    "Where do we handle auth?" — Stop grep-ing. Start asking.
                    Query your codebase with natural language.
                  </p>
                  <Button variant="outline" className="text-[var(--text)] border-[var(--text)]/30 hover:bg-[var(--text)]/5">
                    Try a query demo
                  </Button>
                </div>
                <div className="flex-1 w-full p-4 bg-[var(--text)] rounded-xl shadow-2xl border border-[var(--text)]/70 transform rotate-1 group-hover:rotate-0 transition-transform duration-500">
                   <div className="flex gap-1.5 mb-3">
                     <div className="w-3 h-3 rounded-full bg-red-500" />
                     <div className="w-3 h-3 rounded-full bg-yellow-500" />
                     <div className="w-3 h-3 rounded-full bg-green-500" />
                   </div>
                   <div className="space-y-2 font-mono text-xs">
                      <div className="text-[var(--accent)]">$ find functions using deprecated auth</div>
                      <div className="text-[var(--background)]">Found 3 matches in 2 files...</div>
                      <div className="text-[var(--primary)] pl-4">→ src/auth/login.ts:42</div>
                      <div className="text-[var(--primary)] pl-4">→ src/api/user.ts:15</div>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-32 bg-[var(--text)] text-white relative overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[var(--primary)]/20 to-transparent pointer-events-none" />
        
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              From Install to Insight in Minutes
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              We've removed all the friction. You focus on coding, we handle the infrastructure.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {[
              { num: 1, title: "1-Click Install", desc: "Install the GitHub App. Choose 'All Repos' or select specific ones.", icon: Github },
              { num: 2, title: "Auto-Index", desc: "We clone and build knowledge graphs and vector embeddings instantly.", icon: Network },
              { num: 3, title: "Open PR", desc: "Normal workflow. Just open a Pull Request as you always do.", icon: GitPullRequest },
              { num: 4, title: "Get Reviewed", desc: "AI posts high-context comments directly on your PR lines.", icon: Check },
            ].map((step, i) => (
              <motion.div 
                key={step.num} 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center group"
              >
                <div className="relative mb-8 inline-block">
                  <div className="absolute inset-0 bg-[var(--primary)] blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                  <div className="w-20 h-20 bg-[var(--text)]/70 border border-white/10 rounded-2xl flex items-center justify-center text-3xl font-bold relative z-10 group-hover:scale-110 transition-transform duration-300">
                    <step.icon className="w-8 h-8 text-[var(--primary)]" />
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-[var(--primary)] rounded-full flex items-center justify-center text-sm font-bold text-[var(--text)] border-4 border-[var(--text)]">
                      {step.num}
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-white/70 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 bg-[var(--background)]">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[var(--text)]">
              Fair Pricing for Every Team
            </h2>
            <p className="text-xl text-[var(--text)]/70 max-w-2xl mx-auto">
              Start for free. Scale when you need more power.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
            {/* Free Plan */}
            <motion.div 
               initial={{ opacity: 0, x: -20 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               className="p-8 rounded-3xl bg-white border border-[var(--text)]/10 hover:shadow-xl transition-all"
            >
              <h3 className="text-2xl font-bold mb-2 text-[var(--text)]">Hobby</h3>
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-[var(--text)]">$0</span>
                <span className="text-[var(--text)]/60">/month</span>
              </div>
              <p className="text-[var(--text)]/70 mb-8 text-sm">Perfect for personal projects and experimentation.</p>
              <ul className="space-y-4 mb-8">
                {["5 repositories", "100 reviews/month", "Community support", "Basic graph analysis"].map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-[var(--text)]/80">
                    <Check className="w-5 h-5 text-[var(--primary)] shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button href="/login" variant="outline" className="w-full border-[var(--text)]/30 text-[var(--text)]">Start Free</Button>
            </motion.div>

            {/* Pro Plan */}
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true }}
               className="p-10 rounded-[2rem] bg-[var(--text)] text-white shadow-2xl relative z-10"
            >
              <div className="absolute top-0 right-0 p-8">
                <div className="px-3 py-1 bg-[var(--primary)] text-[var(--text)] text-xs font-bold uppercase tracking-wide rounded-full">Popular</div>
              </div>
              <h3 className="text-3xl font-bold mb-2">Pro</h3>
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-5xl font-bold">$29</span>
                <span className="text-white/70">/mo</span>
              </div>
              <p className="text-white/80 mb-10">For serious developers and small teams shipping fast.</p>
              <ul className="space-y-4 mb-10">
                {["Unlimited repositories", "Unlimited reviews", "Priority graph processing", "Security analysis", "Slack/Email alerts"].map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-white/90">
                    <div className="w-5 h-5 rounded-full bg-[var(--primary)] flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-[var(--text)]" />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button href="/login" size="lg" className="w-full bg-[var(--primary)] hover:bg-[var(--primary)]/90 border-none text-[var(--text)]">
                   Start 14-Day Trial
              </Button>
            </motion.div>
            
            {/* Enterprise Plan */}
            <motion.div 
               initial={{ opacity: 0, x: 20 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               className="p-8 rounded-3xl bg-white border border-[var(--text)]/10 hover:shadow-xl transition-all"
            >
              <h3 className="text-2xl font-bold mb-2 text-[var(--text)]">Enterprise</h3>
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-[var(--text)]">Custom</span>
              </div>
              <p className="text-[var(--text)]/70 mb-8 text-sm">For organizations requiring compliance and security.</p>
              <ul className="space-y-4 mb-8">
                {["Everything in Pro", "Single Sign-On (SSO)", "Self-hosted deployment", "Custom SLA", "Audit logs"].map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-[var(--text)]/80">
                    <Check className="w-5 h-5 text-[var(--primary)] shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full border-[var(--text)]/30 text-[var(--text)]">Contact Sales</Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[var(--primary)]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
        
        <div className="container mx-auto px-6 lg:px-8 relative z-10 text-center text-white">
          <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             className="max-w-3xl mx-auto space-y-8"
          >
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to stop guessing?
            </h2>
            <p className="text-xl text-white/90 font-medium">
              Join thousands of developers who trust their code quality to Graph Bug.
            </p>
            <Button href="/login" size="lg" className="bg-white text-[var(--text)] hover:bg-white/90 px-12 py-8 text-xl rounded-2xl shadow-xl">
                 Get Instant Access
                 <ArrowRight className="w-6 h-6 ml-2" />
            </Button>
            <p className="text-sm text-white/80 opacity-80">
              No credit card required · Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>
      <footer className="bg-white border-t border-[var(--text)]/10 pt-16 pb-8">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <img 
                  src="/logo.png" 
                  alt="Graph Bug Logo" 
                  className="w-8 h-8 rounded-lg"
                />
                <span className="font-bold text-xl text-[var(--text)]">Graph Bug</span>
              </div>
              <p className="text-sm text-[var(--text)]/60 leading-relaxed">
                The first AI code reviewer that understands context through Knowledge Graphs.
                <br /><br />
                San Francisco, CA
              </p>
            </div>
            <div>
              <h4 className="font-bold text-[var(--text)] mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-[var(--text)]/70">
                <li><Link href="#features" className="hover:text-[var(--primary)]">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-[var(--primary)]">Pricing</Link></li>
                <li><Link href="/docs" className="hover:text-[var(--primary)]">Documentation</Link></li>
                <li><Link href="/changelog" className="hover:text-[var(--primary)]">Changelog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-[var(--text)] mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-[var(--text)]/70">
                <li><Link href="/about" className="hover:text-[var(--primary)]">About</Link></li>
                <li><Link href="/blog" className="hover:text-[var(--primary)]">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-[var(--primary)]">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-[var(--primary)]">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-[var(--text)] mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-[var(--text)]/70">
                <li><Link href="/privacy" className="hover:text-[var(--primary)]">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-[var(--primary)]">Terms</Link></li>
                <li><Link href="/security" className="hover:text-[var(--primary)]">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[var(--text)]/10 pt-8 text-center text-sm text-[var(--text)]/50">
            © 2026 Graph Bug AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
