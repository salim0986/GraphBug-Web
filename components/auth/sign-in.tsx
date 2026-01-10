"use client"

import { signIn } from "next-auth/react"
 
export default function SignIn() {
   const resendAction = (formData: FormData) => {
    const email = formData.get("email") as string
    signIn("resend", { email })
  }

  return (
    <div className="w-full max-w-md space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] rounded-2xl"></div>
        </div>
        <h2 className="text-3xl font-bold">Welcome Back</h2>
        <p className="text-[var(--text)]/70">Sign in to your account to continue</p>
      </div>

      {/* OAuth Providers */}
      <div className="space-y-3">
        <button 
          onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-black hover:bg-black/90 text-white rounded-xl transition-all shadow-sm hover:shadow-md font-medium"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
          </svg>
          Continue with GitHub
        </button>

        <button 
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white hover:bg-gray-50 border-2 border-[var(--text)]/10 rounded-xl transition-all shadow-sm hover:shadow-md font-medium"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--text)]/10"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-[var(--background)] text-[var(--text)]/60">Or continue with email</span>
        </div>
      </div>

      {/* Email Form */}
      <form action={resendAction} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email-resend" className="text-sm font-medium">
            Email Address
          </label>
          <input 
            type="email" 
            id="email-resend" 
            name="email" 
            placeholder="you@example.com"
            required
            className="w-full px-4 py-3 bg-white border border-[var(--text)]/20 rounded-xl focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
          />
        </div>
        <button 
          type="submit" 
          className="w-full px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary)]/90 rounded-xl transition-all shadow-sm hover:shadow-md font-medium"
        >
          Send Magic Link
        </button>
      </form>

      {/* Footer */}
      <p className="text-center text-sm text-[var(--text)]/60">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  )
}
