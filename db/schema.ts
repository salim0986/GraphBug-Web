import {
  boolean,
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
} from "drizzle-orm/pg-core"
import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import type { AdapterAccountType } from "next-auth/adapters"
 
// Note: server-only should be imported in auth.ts and API routes, not here
// to allow drizzle-kit to work properly

const connectionString = process.env.DATABASE_URL!
const pool = postgres(connectionString, { max: 1 })

// Stores user profile information
export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  
})
 
// Links users to their OAuth providers
export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    {
      compoundKey: primaryKey({
        columns: [account.provider, account.providerAccountId],
      }),
    },
  ]
)
 
// Tracks active sessions
export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})
 
// For magic link emails (Resend provider)
export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => [
    {
      compositePk: primaryKey({
        columns: [verificationToken.identifier, verificationToken.token],
      }),
    },
  ]
)
 
export const authenticators = pgTable(
  "authenticator",
  {
    credentialID: text("credentialID").notNull().unique(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: boolean("credentialBackedUp").notNull(),
    transports: text("transports"),
  },
  (authenticator) => [
    {
      compositePK: primaryKey({
        columns: [authenticator.userId, authenticator.credentialID],
      }),
    },
  ]
)

// Track GitHub App installations
export const githubInstallations = pgTable("github_installation", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .references(() => users.id, { onDelete: "cascade" }),
  installationId: integer("installationId").notNull().unique(), // GitHub's installation ID
  accountLogin: text("accountLogin").notNull(), // GitHub username or org name
  accountType: text("accountType").notNull(), // "User" or "Organization"
  targetType: text("targetType").notNull(), // What they installed on
  permissions: text("permissions"), // JSON string of permissions
  repositorySelection: text("repositorySelection"), // "all" or "selected"
  suspended: boolean("suspended").default(false),
  installedAt: timestamp("installedAt", { mode: "date" }).notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull(),
})

// Track individual repositories (if user selects specific repos)
export const githubRepositories = pgTable("github_repository", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  installationId: text("installationId")
    .notNull()
    .references(() => githubInstallations.id, { onDelete: "cascade" }),
  repoId: integer("repoId").notNull(), // GitHub's repo ID
  name: text("name").notNull(), // repo name
  fullName: text("fullName").notNull(), // owner/repo
  private: boolean("private").notNull(),
  addedAt: timestamp("addedAt", { mode: "date" }).notNull(),
  // Ingestion tracking
  ingestionStatus: text("ingestionStatus").default("pending"), // pending, processing, completed, failed
  ingestionStartedAt: timestamp("ingestionStartedAt", { mode: "date" }),
  ingestionCompletedAt: timestamp("ingestionCompletedAt", { mode: "date" }),
  ingestionError: text("ingestionError"),
  lastSyncedAt: timestamp("lastSyncedAt", { mode: "date" }),
}, (table) => [
  {
    // Prevent duplicate repos in the same installation
    uniqueRepoPerInstallation: { columns: [table.installationId, table.repoId] },
  },
])

export const db = drizzle(pool, {
  schema: {
    users,
    accounts,
    sessions,
    verificationTokens,
    authenticators,
    githubInstallations,
    githubRepositories,
  },
})