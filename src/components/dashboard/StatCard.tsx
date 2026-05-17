import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  accent?: boolean
  delay?: number
}

export function StatCard({ title, value, subtitle, icon, accent, delay = 0 }: StatCardProps) {
  return (
    <Card
      className={cn(
        'animate-in fade-in-0 slide-in-from-bottom-4 duration-500 fill-mode-both',
        accent && 'border-primary/30 bg-primary/5'
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={cn('text-muted-foreground', accent && 'text-primary')}>{icon}</div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tracking-tight tabular-nums">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}
