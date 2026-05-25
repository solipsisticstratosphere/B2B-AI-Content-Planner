import { formatDistanceToNow, parseISO } from 'date-fns'
import { Clock, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { GenerationHistory as HistoryItem } from '@/lib/types'

const PLATFORM_BADGE: Record<string, string> = {
  linkedin: 'bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30',
  twitter: 'bg-sky-400/20 text-sky-600 dark:text-sky-300 border border-sky-400/30',
  telegram: 'bg-indigo-400/20 text-indigo-600 dark:text-indigo-300 border border-indigo-400/30',
}

const PLATFORM_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  twitter: 'Twitter',
  telegram: 'Telegram',
}

interface GenerationHistoryProps {
  history: HistoryItem[]
  loading: boolean
  onRestore: (item: HistoryItem) => void
}

export function GenerationHistory({ history, loading, onRestore }: GenerationHistoryProps) {
  return (
    <div className="h-full">
      <Card className="h-full">
        <CardHeader className="pb-2 pt-4 px-4">
          <p className="text-sm font-medium">Recent generations</p>
        </CardHeader>
        <CardContent className="px-2 pb-2 pt-0 space-y-0.5">
          {loading ? (
            <p className="text-sm text-muted-foreground px-2 py-3">Loading…</p>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-4 py-8 text-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary/50" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">No generations yet</p>
                <p className="text-xs text-muted-foreground/55 mt-0.5 leading-relaxed">
                  Your AI-generated posts will appear here
                </p>
              </div>
            </div>
          ) : (
            history.map((item) => (
              <button
                key={item.id}
                onClick={() => onRestore(item)}
                className="w-full text-left rounded-md px-3 py-2.5 hover:bg-accent transition-colors group"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span
                    className={cn(
                      'text-[10px] font-medium px-1.5 py-0.5 rounded',
                      PLATFORM_BADGE[item.platform]
                    )}
                  >
                    {PLATFORM_LABELS[item.platform]}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(parseISO(item.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors truncate">
                  {item.result.length > 60 ? `${item.result.slice(0, 60)}…` : item.result}
                </p>
              </button>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
