"use client"

import { signIn } from "next-auth/react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Github, Mail, ArrowRight } from "lucide-react"

export default function SignIn() {
  const resendAction = (formData: FormData) => {
    const email = formData.get("email") as string
    signIn("resend", { email, callbackUrl: "/dashboard" })
  }

  return (
    <div className="w-full max-w-md space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-4"
      >
        <div className="flex justify-center">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-16 h-16 rounded-2xl shadow-xl shadow-[var(--primary)]/20 flex items-center justify-center"
          >
             <img 
               src="/logo.png" 
               alt="Graph Bug Logo" 
               className="w-16 h-16 rounded-2xl"
             />
          </motion.div>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-[var(--text)]">Welcome to Graph Bug</h2>
        <p className="text-[var(--text)]/60 text-lg">Sign in to start reviewing code intelligently</p>
      </motion.div>

      {/* OAuth Providers */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="space-y-4"
      >
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#24292F] hover:bg-[#24292F]/90 text-white rounded-xl transition-all shadow-lg hover:shadow-xl font-medium text-lg"
        >
          <Github className="w-6 h-6" />
          <span>Continue with GitHub</span>
          <ArrowRight className="w-5 h-5 ml-auto opacity-50" />
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white hover:bg-[var(--background)] border border-[var(--text)]/20 text-[var(--text)] rounded-xl transition-all shadow-md hover:shadow-lg font-medium text-lg relative group"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Continue with Google</span>
          <ArrowRight className="w-5 h-5 ml-auto opacity-50 text-slate-400 group-hover:text-slate-600" />
        </motion.button>
      </motion.div>

      {/* Divider */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="relative py-2"
      >
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-slate-50 text-slate-500 font-medium">Or log in via email</span>
        </div>
      </motion.div>

      {/* Email Form */}
      <motion.form 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        action={resendAction} 
        className="space-y-5"
      >
        <div className="space-y-2">
          <label htmlFor="email-resend" className="text-sm font-semibold text-slate-700 ml-1">
            Work Email
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text)]/40" />
            <input 
              type="email" 
              id="email-resend" 
              name="email" 
              placeholder="name@company.com"
              required
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-[var(--text)]/20 rounded-xl focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all font-medium text-[var(--text)] placeholder:text-[var(--text)]/40 shadow-sm"
            />
          </div>
        </div>
        <Button 
          type="submit" 
          size="lg"
          className="w-full font-bold tracking-wide"
        >
          Email Me a Login Link
        </Button>
      </motion.form>

      {/* Footer */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center text-sm text-slate-500"
      >
        By continuing, you agree to our <a href="#" className="underline hover:text-[var(--primary)]">Terms</a> and <a href="#" className="underline hover:text-[var(--primary)]">Privacy Policy</a>
      </motion.p>
    </div>
  )
}
