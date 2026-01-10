import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ProtectedLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="bg-white border-b border-[var(--text)]/10 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] rounded-lg"></div>
              <span className="text-xl font-bold">Graph Bug</span>
            </Link>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 bg-[var(--background)] rounded-lg">
                {session.user.image && (
                  <img 
                    src={session.user.image} 
                    alt={session.user.name || 'User'} 
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div className="text-sm">
                  <div className="font-medium">{session.user.name}</div>
                  <div className="text-[var(--text)]/60 text-xs">{session.user.email}</div>
                </div>
              </div>
              
              <Link
                href="/api/auth/signout"
                className="px-4 py-2 text-sm text-[var(--text)]/70 hover:text-[var(--text)] hover:bg-black/5 rounded-lg transition-colors"
              >
                Sign Out
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--text)]/10 py-6">
        <div className="container mx-auto px-6 text-center text-sm text-[var(--text)]/60">
          © 2026 Graph Bug. All rights reserved.
        </div>
      </footer>
    </div>
  )
}