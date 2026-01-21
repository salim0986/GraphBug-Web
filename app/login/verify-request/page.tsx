import Link from "next/link";

/**
 * Verify Request Page - Shown after user submits email for magic link
 * Provides clear feedback that email has been sent
 */
export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-lg border border-border p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-center text-text mb-3">
            Check your email
          </h1>
          
          {/* Message */}
          <p className="text-center text-text/70 mb-6">
            We&apos;ve sent you a magic link! Check your inbox and click the link to sign in to Graph Bug.
          </p>

          {/* Info Box */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-text/80">
              <strong className="text-text">Tip:</strong> The link will expire in 24 hours. If you don&apos;t see the email, check your spam folder.
            </p>
          </div>

          {/* Back to Sign In */}
          <div className="text-center">
            <Link
              href="/login"
              className="text-primary hover:text-primary/80 font-medium transition-colors inline-flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to sign in
            </Link>
          </div>
        </div>

        {/* Additional Help */}
        <div className="mt-6 text-center">
          <p className="text-sm text-text/60">
            Having trouble? Make sure you&apos;re checking the email address you entered.
          </p>
        </div>
      </div>
    </div>
  );
}
