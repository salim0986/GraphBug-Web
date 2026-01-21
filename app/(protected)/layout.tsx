import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/sidebar'

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
    <div className="min-h-screen flex bg-[var(--background)]">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-[var(--background)]">
        <div className="container mx-auto px-8 py-8">
            {/* Header Area */}
            <header className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold font-heading text-[var(--text)]">
                        Welcome back, {session.user.name?.split(' ')[0]}
                    </h1>
                    <p className="text-[var(--text)]/60 text-sm">
                        Here's what's happening with your repositories today.
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                   {session.user.image && (
                      <img 
                        src={session.user.image} 
                        alt={session.user.name || 'User'} 
                        className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                      />
                    )}
                </div>
            </header>
            
            {children}
        </div>
      </main>
    </div>
  )
}
