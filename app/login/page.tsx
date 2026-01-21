import SignIn from '@/components/auth/sign-in'
import Link from 'next/link'
import React from 'react'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--primary)] p-12 flex-col justify-between">
        <Link href="/" className="flex items-center gap-2 text-white">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl"></div>
          <span className="text-2xl font-bold">Graph Bug</span>
        </Link>
        
        <div className="space-y-6 text-white">
          <h1 className="text-5xl font-bold leading-tight">
            Code Review<br />Powered by AI
          </h1>
          <p className="text-xl text-white/90 max-w-md">
            Join developers who trust Graph Bug to catch bugs before they reach production.
          </p>
          
          {/* Stats */}
          <div className="flex gap-8 pt-8">
            <div>
              <div className="text-3xl font-bold">10K+</div>
              <div className="text-white/80 text-sm">Reviews</div>
            </div>
            <div>
              <div className="text-3xl font-bold">500+</div>
              <div className="text-white/80 text-sm">Repositories</div>
            </div>
            <div>
              <div className="text-3xl font-bold">99%</div>
              <div className="text-white/80 text-sm">Accuracy</div>
            </div>
          </div>
        </div>

        <div className="text-white/60 text-sm">
          © 2026 Graph Bug. All rights reserved.
        </div>
      </div>

      {/* Right Side - Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Back to Home - Mobile */}
          <div className="lg:hidden mb-8">
            <Link href="/" className="flex items-center gap-2 text-[var(--text)]">
              <div className="w-8 h-8 bg-[var(--primary)] rounded-lg"></div>
              <span className="text-xl font-bold">Graph Bug</span>
            </Link>
          </div>

          <SignIn />
        </div>
      </div>
    </div>
  )
}