import { format, parseISO } from 'date-fns'
import { CheckCheck, RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Post } from '@/lib/types'

const PLATFORM_STYLES = {
  linkedin: 'border-l-[3px] border-blue-500 bg-blue-500/8',
  twitter: 'border-l-[3px] border-sky-400 bg-sky-400/8',
  telegram: 'border-l-[3px] border-indigo-400 bg-indigo-400/8',
}

const PLATFORM_BADGE_STYLES = {
  linkedin: 'bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/30',
  twitter: 'bg-sky-400/20 text-sky-600 dark:text-sky-300 border-sky-400/30',
  telegram: 'bg-indigo-400/20 text-indigo-600 dark:text-indigo-300 border-indigo-400/30',
}

const PLATFORM_LABELS = {
  linkedin: 'LinkedIn',
  twitter: 'Twitter',
  telegram: 'Telegram',
}

function getCardStyles(post: Post): string {
  if (post.status === 'draft') {
    return 'border-l-[3px] border-slate-500/60 bg-slate-500/5 opacity-75 hover:opacity-100'
  }
  if (post.status === 'published') {
    return 'border-l-[3px] border-emerald-500 bg-emerald-500/10'
  }
  return PLATFORM_STYLES[post.platform]
}

const STATUS_DOT: Record<Post['status'], string> = {
  scheduled: 'bg-primary/70',
  draft: 'border border-slate-400/60 bg-transparent',
  published: 'bg-emerald-400',
}

const STATUS_LABEL: Record<Post['status'], string> = {
  scheduled: 'Scheduled',
  draft: 'Draft',
  published: 'Published',
}

const STATUS_TEXT: Record<Post['status'], string> = {
  scheduled: 'text-muted-foreground/55',
  draft: 'text-slate-400/80',
  published: 'text-emerald-400/90',
}

interface PostCardProps {
  post: Post
  onClick: () => void
  onStatusChange?: (status: 'published' | 'scheduled') => void
}

export function PostCard({ post, onClick, onStatusChange }: PostCardProps) {
  const time = format(parseISO(post.scheduled_for), 'h:mm a')
  const isPublished = post.status === 'published'

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className={cn(
        'group/card relative w-full text-left rounded-md px-2.5 py-2 space-y-1.5 transition-all cursor-pointer',
        getCardStyles(post)
      )}
    >
      {/* Platform badge + time */}
      <div className="flex items-center justify-between gap-1">
        <Badge
          variant="outline"
          className={cn('text-[10px] px-1.5 py-0 h-4', PLATFORM_BADGE_STYLES[post.platform])}
        >
          {PLATFORM_LABELS[post.platform]}
        </Badge>
        <span className="text-[10px] text-muted-foreground shrink-0">{time}</span>
      </div>

      {/* Content preview */}
      <p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed">{post.content}</p>

      {/* Status indicator + quick action */}
      <div className="flex items-center justify-between min-h-[18px]">
        <span className={cn('flex items-center gap-1 text-[10px]', STATUS_TEXT[post.status])}>
          <span className={cn('w-1.5 h-1.5 rounded-full inline-block shrink-0', STATUS_DOT[post.status])} />
          {STATUS_LABEL[post.status]}
        </span>

        {onStatusChange && (
          <button
            type="button"
            aria-label={isPublished ? 'Unmark as published' : 'Mark as published'}
            onClick={(e) => {
              e.stopPropagation()
              onStatusChange(isPublished ? 'scheduled' : 'published')
            }}
            className={cn(
              'opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded',
              isPublished
                ? 'bg-slate-500/20 text-slate-600 dark:text-slate-300 hover:bg-slate-500/35'
                : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/35'
            )}
          >
            {isPublished ? (
              <>
                <RotateCcw className="w-2.5 h-2.5" />
                Unmark
              </>
            ) : (
              <>
                <CheckCheck className="w-2.5 h-2.5" />
                Done
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
