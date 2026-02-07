"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { useState, useEffect, useCallback } from "react";
import { AlignLeft } from "lucide-react";

export default function ProtectedLayout({
  children
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect('/login');
    }
  }, [status]);

  if (status === "loading") {
    return null;
  }

  if (!session?.user) {
    return null;
  }

  const handleClose = useCallback(() => setIsMobileSidebarOpen(false), []);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--background)]">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isMobileSidebarOpen}
        onClose={handleClose}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen bg-[var(--background)] relative overflow-hidden">
        {/* Animated Background Elements (Subtle) */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--primary)]/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[var(--secondary)]/5 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/2" />

        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-[var(--text)]/10 bg-[var(--background)]/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Graph Bug Logo"
              className="w-8 h-8 rounded-lg"
            />
            <span className="font-bold text-[var(--text)]">Graph Bug</span>
          </div>
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2.5 text-[var(--text)] hover:bg-[var(--text)]/5 rounded-xl active:scale-95 transition-all text-[var(--primary)] hover:text-[var(--primary)]/80"
          >
            <AlignLeft size={28} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-8 relative z-10">
          {/* Header Area */}
          <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-heading text-[var(--text)] flex items-center gap-2">
                Welcome back, {session.user.name?.split(' ')[0]}
                <span className="text-2xl">👋</span>
              </h1>
              <p className="text-[var(--text)]/60 text-sm md:text-base mt-1">
                Here's what's happening with your repositories today.
              </p>
            </div>

            <div className="flex items-center gap-3 self-end md:self-auto">
              {session.user.image && (
                <div className="relative group cursor-pointer">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] rounded-full opacity-75 group-hover:opacity-100 blur transition duration-200"></div>
                  <img
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    className="relative w-10 h-10 rounded-full border-2 border-[var(--background)] shadow-sm"
                  />
                </div>
              )}
            </div>
          </header>

          {children}
        </div>
      </main>
    </div>
  )
}
