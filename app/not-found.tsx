import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion, Home, SearchX } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-blue-100 rounded-full">
            <FileQuestion className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        {/* 404 Message */}
        <h1 className="text-4xl font-bold text-[var(--text)] mb-2 font-heading">
          404
        </h1>
        <p className="text-xl font-semibold text-[var(--text)] mb-2">
          Page not found
        </p>
        <p className="text-[var(--text)]/70 mb-8">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>

        {/* Search Tips */}
        <div className="bg-[var(--text)]/5 rounded-lg p-4 mb-8 text-left">
          <p className="text-sm font-semibold text-[var(--text)] mb-2 flex items-center gap-2">
            <SearchX className="w-4 h-4" />
            Quick tips
          </p>
          <ul className="text-sm text-[var(--text)]/70 space-y-1">
            <li>• Check the URL for typos</li>
            <li>• Try using the navigation menu</li>
            <li>• Search from the home page</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 flex-col sm:flex-row">
          <Button
            href="/"
            className="flex-1 bg-[var(--primary)] text-[var(--text)] hover:bg-[var(--primary)]/90"
          >
            <Home className="w-4 h-4 mr-2" />
            Go to home
          </Button>
          <Button
            href="/contact"
            variant="outline"
            className="flex-1 border-[var(--text)]/30 text-[var(--text)]"
          >
            Report issue
          </Button>
        </div>
      </div>
    </div>
  )
}
