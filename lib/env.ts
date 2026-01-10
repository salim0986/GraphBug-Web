/**
 * Environment Variable Validation
 * Ensures all required env vars are present at runtime
 */

// Server-side only environment variables
export const serverEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
  AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
  AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
  AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,
  AUTH_RESEND_KEY: process.env.AUTH_RESEND_KEY,
  NEXT_PUBLIC_GITHUB_APP_ID: process.env.NEXT_PUBLIC_GITHUB_APP_ID,
  NEXT_PUBLIC_GITHUB_PRIVATE_KEY: process.env.NEXT_PUBLIC_GITHUB_PRIVATE_KEY,
  NEXT_PUBLIC_GITHUB_WEBHOOK_SECRET: process.env.NEXT_PUBLIC_GITHUB_WEBHOOK_SECRET,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
} as const;

// Client-side safe environment variables
export const clientEnv = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  NEXT_PUBLIC_GITHUB_APP_NAME: process.env.NEXT_PUBLIC_GITHUB_APP_NAME || 'graph-bug',
} as const;

// Validate server environment (only run on server)
if (typeof window === 'undefined') {
  const required = [
    'DATABASE_URL',
    'AUTH_SECRET',
    'NEXT_PUBLIC_GITHUB_APP_ID',
    'NEXT_PUBLIC_GITHUB_WEBHOOK_SECRET',
  ] as const;

  for (const key of required) {
    if (!serverEnv[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}
