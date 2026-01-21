import Link from 'next/link';
import { Briefcase, Heart, Zap, Users } from 'lucide-react';

export default function CareersPage() {
  const openings = [
    {
      title: "Senior Full-Stack Engineer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time"
    },
    {
      title: "Machine Learning Engineer",
      department: "AI/ML",
      location: "Remote",
      type: "Full-time"
    },
    {
      title: "Developer Advocate",
      department: "Developer Relations",
      location: "Remote",
      type: "Full-time"
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[var(--text)] mb-4 font-heading">Join Our Team</h1>
          <p className="text-lg text-[var(--text)]/70">Help us revolutionize code review with AI and knowledge graphs</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-xl border border-[var(--text)]/10 text-center">
            <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Zap className="w-6 h-6 text-[var(--primary)]" />
            </div>
            <h3 className="text-base font-semibold text-[var(--text)] mb-2 font-heading">Innovation</h3>
            <p className="text-sm text-[var(--text)]/70">Work on cutting-edge AI and graph technology</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[var(--text)]/10 text-center">
            <div className="w-12 h-12 bg-[var(--secondary)]/10 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-[var(--secondary)]" />
            </div>
            <h3 className="text-base font-semibold text-[var(--text)] mb-2 font-heading">Great Team</h3>
            <p className="text-sm text-[var(--text)]/70">Collaborate with passionate engineers</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[var(--text)]/10 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Heart className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-base font-semibold text-[var(--text)] mb-2 font-heading">Work-Life Balance</h3>
            <p className="text-sm text-[var(--text)]/70">Flexible hours and remote-first culture</p>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-[var(--text)] mb-6 font-heading">Open Positions</h2>
          <div className="space-y-4">
            {openings.map((job, index) => (
              <div key={index} className="bg-white p-6 rounded-xl border border-[var(--text)]/10 hover:border-[var(--primary)]/30 transition-all flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-[var(--primary)]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text)] font-heading">{job.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-[var(--text)]/60 mt-1">
                      <span>{job.department}</span>
                      <span>•</span>
                      <span>{job.location}</span>
                      <span>•</span>
                      <span>{job.type}</span>
                    </div>
                  </div>
                </div>
                <button className="px-6 py-2 bg-[var(--primary)] text-[var(--text)] font-medium rounded-lg hover:bg-[var(--primary)]/90 transition-colors opacity-0 group-hover:opacity-100">
                  Apply
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[var(--primary)]/5 rounded-xl p-8 border border-[var(--primary)]/10 text-center">
          <h3 className="text-xl font-bold text-[var(--text)] mb-2 font-heading">Don't see a fit?</h3>
          <p className="text-[var(--text)]/70 mb-4">
            We're always looking for talented people. Send us your resume and tell us how you can contribute.
          </p>
          <a href="mailto:careers@graphbug.dev" className="inline-block px-6 py-3 bg-[var(--primary)] text-[var(--text)] font-medium rounded-lg hover:bg-[var(--primary)]/90 transition-colors">
            Get in Touch
          </a>
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
