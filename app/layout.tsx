import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";

const fontHeading = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: 'swap',
});

const fontBody = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Graph Bug - AI Code Reviewer",
  description: "The only AI code reviewer powered by GraphRAG technology. Catch bugs that other tools miss with true codebase understanding.",
};


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Pass the server-side session to SessionProvider so the client hydrates
  // with the correct session state immediately — prevents the hydration
  // mismatch that triggered the "Something went wrong" error boundary on
  // first login.
  const session = await auth();

  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${fontHeading.variable} ${fontBody.variable} antialiased bg-[var(--background)] text-[var(--text)] font-body`}
      >
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
