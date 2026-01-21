import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

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


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${fontHeading.variable} ${fontBody.variable} antialiased bg-[var(--background)] text-[var(--text)] font-body`}
      >
        <SessionProvider>
        {children}
        </SessionProvider>
      </body>
    </html>
  );
}
