import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Sparkles, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/generate', label: 'Generate', icon: Sparkles, end: false },
  { to: '/calendar', label: 'Calendar', icon: Calendar, end: false },
]

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-card/95 backdrop-blur-sm pb-safe md:hidden">
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-0.5 flex-1 py-2.5 text-[10px] font-medium transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground'
            )
          }
        >
          {({ isActive }) => (
            <>
              <div className={cn('p-1.5 rounded-lg transition-colors', isActive && 'bg-primary/15')}>
                <Icon className="w-5 h-5" />
              </div>
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
