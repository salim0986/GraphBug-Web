import Link from 'next/link';
import { Calendar, ArrowRight } from 'lucide-react';

export default function BlogPage() {
  const posts = [
    {
      title: "Introducing Graph Bug: AI Code Review Powered by Knowledge Graphs",
      excerpt: "Learn how Graph Bug uses Neo4j and vector search to provide context-aware code reviews that catch bugs other tools miss.",
      date: "January 15, 2026",
      readTime: "5 min read",
      category: "Product"
    },
    {
      title: "Why Traditional Code Review Tools Fall Short",
      excerpt: "Most AI code reviewers analyze files in isolation. Discover why understanding code relationships is crucial for catching real bugs.",
      date: "January 10, 2026",
      readTime: "7 min read",
      category: "Engineering"
    },
    {
      title: "Building a Knowledge Graph for Code Understanding",
      excerpt: "A deep dive into how we use tree-sitter and Neo4j to map your entire codebase and its relationships.",
      date: "January 5, 2026",
      readTime: "10 min read",
      category: "Technical"
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[var(--text)] mb-4 font-heading">Blog</h1>
          <p className="text-lg text-[var(--text)]/70">Insights on AI, code review, and software engineering</p>
        </div>

        <div className="space-y-6">
          {posts.map((post, index) => (
            <article key={index} className="bg-white rounded-xl p-6 border border-[var(--text)]/10 hover:border-[var(--primary)]/30 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-semibold px-3 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full">
                  {post.category}
                </span>
                <div className="flex items-center gap-4 text-xs text-[var(--text)]/60">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {post.date}
                  </span>
                  <span>{post.readTime}</span>
                </div>
              </div>
              <h2 className="text-xl font-bold text-[var(--text)] mb-2 font-heading group-hover:text-[var(--primary)] transition-colors">
                {post.title}
              </h2>
              <p className="text-sm text-[var(--text)]/70 mb-4">
                {post.excerpt}
              </p>
              <button className="text-sm font-medium text-[var(--primary)] flex items-center gap-1 group-hover:gap-2 transition-all">
                Read more <ArrowRight className="w-4 h-4" />
              </button>
            </article>
          ))}
        </div>

        <div className="text-center mt-12 p-8 bg-white rounded-xl border border-[var(--text)]/10">
          <p className="text-[var(--text)]/60 mb-4">Want to stay updated with our latest posts?</p>
          <div className="flex gap-3 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="flex-1 px-4 py-2 border border-[var(--text)]/20 rounded-lg focus:outline-none focus:border-[var(--primary)]" 
            />
            <button className="px-6 py-2 bg-[var(--primary)] text-[var(--text)] font-medium rounded-lg hover:bg-[var(--primary)]/90 transition-colors">
              Subscribe
            </button>
          </div>
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
