import "server-only"
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google"
import Resend from "next-auth/providers/resend";
import { db } from "./db/schema";
 
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db as any),
  providers: [Google, GitHub, Resend]
})