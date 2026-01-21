import Link from "next/link";

/**
 * Auth Error Page - Shown when authentication fails
 * Provides user-friendly error messages and recovery options
 */
export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const error = searchParams.error;

  const errorMessages: Record<string, { title: string; description: string }> = {
    Configuration: {
      title: "Configuration Error",
      description: "There is a problem with the server configuration. Please contact support.",
    },
    AccessDenied: {
      title: "Access Denied",
      description: "You do not have permission to sign in.",
    },
    Verification: {
      title: "Verification Failed",
      description: "The sign in link is no longer valid. It may have expired or already been used.",
    },
    OAuthSignin: {
      title: "OAuth Error",
      description: "Error occurred during the OAuth sign-in process.",
    },
    OAuthCallback: {
      title: "OAuth Callback Error",
      description: "Error occurred during the OAuth callback.",
    },
    OAuthCreateAccount: {
      title: "Account Creation Failed",
      description: "Could not create your account. Please try again.",
    },
    EmailCreateAccount: {
      title: "Email Account Error",
      description: "Could not create your email account. Please try again.",
    },
    Callback: {
      title: "Callback Error",
      description: "Error occurred during the authentication callback.",
    },
    OAuthAccountNotLinked: {
      title: "Account Not Linked",
      description: "This account is already linked to another provider. Please sign in with your original provider.",
    },
    EmailSignin: {
      title: "Email Error",
      description: "The sign-in email could not be sent. Please try again.",
    },
    CredentialsSignin: {
      title: "Sign In Failed",
      description: "Sign in failed. Check the details you provided are correct.",
    },
    SessionRequired: {
      title: "Session Required",
      description: "You must be signed in to access this page.",
    },
    Default: {
      title: "Authentication Error",
      description: "An unexpected error occurred. Please try again.",
    },
  };

  const errorInfo = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-lg border border-border p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-destructive"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          {/* Error Message */}
          <h1 className="text-2xl font-bold text-center text-text mb-3">
            {errorInfo.title}
          </h1>
          
          <p className="text-center text-text/70 mb-6">
            {errorInfo.description}
          </p>

          {/* Error Code (if available) */}
          {error && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-text/80">
                <strong className="text-text">Error Code:</strong> {error}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-text font-semibold rounded-xl hover:bg-primary/90 transition-colors"
            >
              Try Again
            </Link>

            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-border text-text font-semibold rounded-xl hover:bg-accent transition-colors"
            >
              Go to Homepage
            </Link>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-text/60">
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
