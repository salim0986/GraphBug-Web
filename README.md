# Graph Bug - Frontend

AI-powered code review platform powered by GitHub Apps and Graph RAG technology.

## Overview

**Graph Bug** is a Next.js web application that integrates with GitHub as a GitHub App to provide automated AI-powered code reviews on pull requests. It uses a graph-based Retrieval Augmented Generation (RAG) system to understand code context and provide intelligent feedback.

## Features

- ✅ **GitHub App Integration** - Seamless installation and repository access
- 🔐 **Multi-provider Authentication** - GitHub OAuth, Google, Magic Links (Resend)
- 📊 **Dashboard** - Manage repository connections and settings
- 🤖 **Automated PR Reviews** - AI comments on pull requests
- 🗄️ **PostgreSQL Database** - Track users, installations, and repositories
- ⚡ **Modern Stack** - Next.js 16, React 19, Turbopack, Tailwind CSS 4

## Architecture

### Tech Stack

- **Framework:** Next.js 16.1.1 (App Router)
- **UI:** React 19, Tailwind CSS 4
- **Auth:** NextAuth.js 5.0 (beta)
- **Database:** PostgreSQL + Drizzle ORM
- **GitHub:** Octokit, GitHub App webhooks
- **Package Manager:** pnpm

### Database Schema

**Users Table:**
- Stores user profiles (id, name, email, image)

**Accounts Table:**
- Links users to OAuth providers (GitHub, Google)
- Stores access tokens for GitHub API access

**Sessions Table:**
- Tracks active user sessions

**GitHub Installations Table:**
- Records which users installed the GitHub App
- Stores installation metadata (permissions, repository selection)

**GitHub Repositories Table:**
- Tracks individual repositories user selected

### Key Files

- [auth.ts](auth.ts) - NextAuth.js configuration
- [db/schema.ts](db/schema.ts) - Drizzle ORM schema definitions
- [lib/github.ts](lib/github.ts) - GitHub App authentication utilities
- [app/api/webhooks/github/route.ts](app/api/webhooks/github/route.ts) - GitHub webhook handler
- [app/api/github/setup/route.ts](app/api/github/setup/route.ts) - GitHub App setup callback
- [app/api/review/route.ts](app/api/review/route.ts) - Trigger AI code reviews

## Setup Instructions

### Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database
- GitHub App credentials
- Google OAuth credentials (optional)
- Resend API key (optional, for magic links)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Database Setup

Create a PostgreSQL database:

```bash
createdb graphbug
```

Run migrations:

```bash
pnpm drizzle-kit push
```

### 3. Create GitHub App

1. Go to GitHub Settings → Developer Settings → GitHub Apps
2. Click "New GitHub App"
3. Fill in:
   - **Name:** your-app-name
   - **Homepage URL:** `http://localhost:3000`
   - **Callback URL:** `http://localhost:3000/api/auth/callback/github`
   - **Setup URL:** `http://localhost:3000/api/github/setup`
   - **Webhook URL:** `http://localhost:3000/api/webhooks/github`
   - **Webhook Secret:** Generate a random secret
   - **Permissions:**
     - Repository permissions: Pull requests (Read & Write), Contents (Read)
     - Subscribe to events: Pull request
4. Generate a private key (download the `.pem` file)
5. Note your App ID and Client Secret

### 4. Configure Environment Variables

Create a `.env` file:

```bash
# NextAuth
AUTH_SECRET="generate-with: openssl rand -base64 32"

# GitHub App
NEXT_PUBLIC_GITHUB_APP_ID=your-app-id
NEXT_PUBLIC_GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
...paste your private key here...
-----END RSA PRIVATE KEY-----"
NEXT_PUBLIC_GITHUB_WEBHOOK_SECRET=your-webhook-secret

# GitHub OAuth (for user login)
AUTH_GITHUB_ID=your-oauth-client-id
AUTH_GITHUB_SECRET=your-oauth-client-secret

# Google OAuth (optional)
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret

# Resend (optional, for magic links)
AUTH_RESEND_KEY=your-resend-api-key

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/graphbug
```

### 5. Run Development Server

```bash
pnpm dev
```

Visit http://localhost:3000

### 6. Test Webhook Locally (Optional)

For local webhook testing, use [smee.io](https://smee.io):

```bash
# Install smee client
npm install -g smee-client

# Start smee proxy
smee --url https://smee.io/YOUR_CHANNEL --path /api/webhooks/github --port 3000
```

Update your GitHub App webhook URL to the smee.io URL.

## User Flow

1. **Sign In** - User authenticates via GitHub/Google/Email
2. **Install GitHub App** - User clicks "Install GitHub App" on dashboard
3. **Select Repositories** - User chooses which repos to enable
4. **Setup Callback** - GitHub redirects to `/api/github/setup` which links user to installation
5. **Webhook Registration** - Installation data saved via webhook
6. **PR Opened** - When user opens PR, webhook triggers AI review
7. **Review Posted** - AI analysis posted as PR comment

## API Routes

### `GET /api/github/setup`

Handles GitHub App setup callback. Links the installation to the authenticated user.

**Query Params:**
- `installation_id` - GitHub installation ID
- `setup_action` - Install/update

**Returns:** Redirects to `/dashboard?setup=success`

### `POST /api/webhooks/github`

Receives GitHub webhooks for installation and PR events.

**Events Handled:**
- `installation.created` - Save installation to database
- `pull_request.opened` - Trigger AI code review

**Security:** Verifies webhook signature using `WEBHOOK_SECRET`

### `POST /api/review`

Triggers an AI code review comment on a pull request.

**Body:**
```json
{
  "installationId": "123456",
  "owner": "username",
  "repo": "repository",
  "prNumber": 42
}
```

**Returns:** `{ "success": true }`

## Database Migrations

Generate migration:
```bash
pnpm drizzle-kit generate
```

Push to database:
```bash
pnpm drizzle-kit push
```

Open Drizzle Studio:
```bash
pnpm drizzle-kit studio
```

## Troubleshooting

### Module not found: Can't resolve 'fs', 'net', 'tls'

✅ **Fixed!** Added `import "server-only"` to [db/schema.ts](db/schema.ts) and [auth.ts](auth.ts) to prevent client-side bundling of Node.js modules.

### Webhook not receiving events

1. Check GitHub App webhook settings
2. Verify webhook secret matches `.env`
3. Check server logs for errors
4. Use smee.io for local testing

### Database connection errors

1. Verify PostgreSQL is running
2. Check `DATABASE_URL` format
3. Ensure database exists
4. Run migrations

### GitHub App permissions issues

1. Check GitHub App permissions in settings
2. Re-install app to update permissions
3. Verify installation has correct access

## Integration with AI Service

This frontend connects to the AI service (in `../ai-service`) for actual code analysis:

1. Webhook receives PR event
2. Frontend extracts repo info
3. Calls AI service at `/ingest` to process repo
4. AI service parses code → builds graph → creates embeddings
5. Frontend calls AI service at `/query` for code insights
6. Frontend posts review comment via GitHub API

## Production Deployment

### Environment Setup

1. Set all environment variables in your hosting platform
2. Use production database URL
3. Update GitHub App URLs to production domain
4. Set `NODE_ENV=production`

### Recommended Platforms

- **Vercel** - Zero-config Next.js deployment
- **Railway** - Full-stack with PostgreSQL
- **Fly.io** - Docker-based deployment

### Deploy to Vercel

```bash
pnpm vercel
```

Or connect your Git repository in Vercel dashboard.

## Security Notes

⚠️ **Never commit `.env` file to version control**

⚠️ **Rotate secrets regularly**, especially:
- `AUTH_SECRET`
- `NEXT_PUBLIC_GITHUB_WEBHOOK_SECRET`
- GitHub Private Key

⚠️ **Use GitHub App permissions** - Request only what you need

⚠️ **Validate webhook signatures** - Always verify in production

## License

MIT

## Support

For issues or questions:
- Check existing issues on GitHub
- Review documentation
- Contact support team
