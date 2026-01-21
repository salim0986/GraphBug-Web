import "server-only"
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google"
import Resend from "next-auth/providers/resend";
import { db } from "./db/schema";
import { sendVerificationRequest } from "./lib/email-template";
 
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db as any),
  providers: [
    Google, 
    GitHub, 
    Resend({
      from: process.env.RESEND_FROM_ADDRESS || 'Graph Bug <no-reply@graphbug.me>',
      sendVerificationRequest,
    })
  ],
  pages: {
    signIn: '/login',
    verifyRequest: '/login/verify-request',
    error: '/login/error',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow all sign-ins
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
})