import { isFuture, parseISO, format } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Post } from '@/lib/types'

const PLATFORM_BADGE: Record<string, string> = {
  linkedin: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  twitter: 'bg-sky-400/20 text-sky-300 border-sky-400/30',
  telegram: 'bg-indigo-400/20 text-indigo-300 border-indigo-400/30',
}

const PLATFORM_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  twitter: 'Twitter',
  telegram: 'Telegram',
}

const STATUS_PILL: Record<string, string> = {
  scheduled: 'bg-primary/10 text-primary/80',
  draft: 'bg-muted text-muted-foreground',
  published: 'bg-emerald-500/15 text-emerald-400',
}

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Scheduled',
  draft: 'Draft',
  published: 'Published',
}

interface UpcomingPostsProps {
  posts: Post[]
  loading?: boolean
}

export function UpcomingPosts({ posts, loading }: UpcomingPostsProps) {
  const upcoming = posts.filter((p) => isFuture(parseISO(p.scheduled_for))).slice(0, 5)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Upcoming posts</p>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <p className="text-sm text-muted-foreground py-2">Loading…</p>
        ) : upcoming.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">No upcoming posts</p>
            <p className="text-xs text-muted-foreground/55 mt-0.5">
              Head to Calendar to schedule some
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {upcoming.map((post) => (
              <div
                key={post.id}
                className="flex items-center gap-3 py-2.5 border-b border-border/40 last:border-0"
              >
                <Badge
                  variant="outline"
                  className={cn('text-[10px] px-1.5 py-0 h-4 shrink-0', PLATFORM_BADGE[post.platform])}
                >
                  {PLATFORM_LABELS[post.platform]}
                </Badge>
                <p className="text-xs text-muted-foreground shrink-0 w-28 tabular-nums">
                  {format(parseISO(post.scheduled_for), 'MMM d, h:mm a')}
                </p>
                <p className="text-xs truncate flex-1 text-foreground/70">
                  {post.content.length > 48 ? `${post.content.slice(0, 48)}…` : post.content}
                </p>
                <span
                  className={cn(
                    'text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0',
                    STATUS_PILL[post.status]
                  )}
                >
                  {STATUS_LABEL[post.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
