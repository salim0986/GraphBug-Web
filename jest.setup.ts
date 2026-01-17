/**
 * Jest Setup File
 */

import '@testing-library/jest-dom';

// Mock environment variables for tests
process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test';
process.env.AUTH_SECRET = 'test-secret';
process.env.NEXT_PUBLIC_GITHUB_APP_ID = 'test-app-id';
process.env.GITHUB_WEBHOOK_SECRET = 'test-webhook-secret';
