'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error for monitoring
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-red-100 rounded-full">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-[var(--text)] mb-2 font-heading">
          Something went wrong
        </h1>
        <p className="text-[var(--text)]/70 mb-2 text-lg">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200 text-left">
            <p className="text-xs font-mono text-red-700 break-words">
              {error.message}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-8 flex-col sm:flex-row">
          <Button
            onClick={reset}
            className="flex-1 bg-[var(--primary)] text-[var(--text)] hover:bg-[var(--primary)]/90"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try again
          </Button>
          <Button
            href="/"
            variant="outline"
            className="flex-1 border-[var(--text)]/30 text-[var(--text)]"
          >
            <Home className="w-4 h-4 mr-2" />
            Go home
          </Button>
        </div>

        {/* Support Info */}
        <p className="text-xs text-[var(--text)]/50 mt-6">
          Error ID: {error.digest || 'unknown'}
        </p>
      </div>
    </div>
  )
}
