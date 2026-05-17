import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Footer } from './Footer'
import { MobileNav } from './MobileNav'

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar — visible on tablet and above */}
      <div className="hidden md:flex h-full">
        <Sidebar />
      </div>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>

        {/* Footer — visible on tablet and above */}
        <div className="hidden md:block">
          <Footer />
        </div>
      </div>

      {/* Bottom navigation — mobile only */}
      <MobileNav />
    </div>
  )
}
