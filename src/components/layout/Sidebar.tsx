import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Sparkles, Calendar, LogOut, Zap, Crown } from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/hooks/useAuth'
import { useUsage } from '@/hooks/useUsage'
import { UpgradeModal } from '@/components/generate/UpgradeModal'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/generate', label: 'Generate', icon: Sparkles, end: false },
  { to: '/calendar', label: 'Calendar', icon: Calendar, end: false },
]

export function Sidebar() {
  const { user, signOut } = useAuth()
  const { tokensUsed, maxTokens, resetDate } = useUsage()
  const [showUpgrade, setShowUpgrade] = useState(false)

  const fullName =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split('@')[0] ??
    'User'

  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n: string) => n[0].toUpperCase())
    .join('')

  const isPro = maxTokens > 5

  const resetLabel = resetDate
    ? formatDistanceToNow(parseISO(resetDate), { addSuffix: true })
    : 'in 30 days'

  return (
    <aside className="flex flex-col w-60 shrink-0 border-r border-border bg-card h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20">
          <Zap className="w-4 h-4 text-primary" />
        </div>
        <span className="font-semibold text-sm tracking-tight">ContentFlow AI</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-primary/15 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User identity */}
      <div className="px-4 pt-4 pb-3 border-t border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <span className="text-xs font-semibold text-primary">{initials}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate leading-tight">{fullName}</p>
          <span
            className={cn(
              'text-[10px] font-medium px-1.5 py-0.5 rounded inline-block mt-0.5',
              isPro
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {isPro ? 'Pro' : 'Free Plan'}
          </span>
        </div>
      </div>

      {/* Token usage meter */}
      <div className="px-4 pb-3 space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>AI tokens</span>
          <span>
            {tokensUsed} / {maxTokens}
          </span>
        </div>
        <Progress
          value={(tokensUsed / maxTokens) * 100}
          className={cn(
            'h-1.5',
            tokensUsed >= maxTokens
              ? '[&>div]:bg-red-500'
              : tokensUsed / maxTokens >= 0.8
                ? '[&>div]:bg-amber-500'
                : ''
          )}
        />
        {tokensUsed >= maxTokens ? (
          <p className="text-xs text-red-400">Limit reached · Upgrade for more</p>
        ) : tokensUsed / maxTokens >= 0.8 ? (
          <p className="text-xs text-amber-400">Almost out · Consider upgrading</p>
        ) : (
          <p className="text-xs text-muted-foreground/50">Resets {resetLabel}</p>
        )}
      </div>

      {/* Upgrade CTA for free plan */}
      {!isPro && (
        <div className="px-3 pb-3">
          <button
            type="button"
            onClick={() => setShowUpgrade(true)}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
          >
            <Crown className="w-3.5 h-3.5 shrink-0" />
            <span className="flex-1 text-left">Upgrade to Pro</span>
            <span className="text-primary/60 font-normal">$29/mo</span>
          </button>
        </div>
      )}

      {/* Sign out */}
      <div className="px-3 pb-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={() => signOut()}
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>
      </div>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </aside>
  )
}
