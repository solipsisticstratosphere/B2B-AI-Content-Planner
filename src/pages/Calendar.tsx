import { useState } from 'react'
import { addWeeks, format, startOfWeek, subWeeks } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { WeeklyGrid } from '@/components/calendar/WeeklyGrid'
import { usePosts } from '@/hooks/usePosts'

export default function Calendar() {
  const { posts, loading, movePost, updatePost } = usePosts()
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )

  const weekLabel = `${format(weekStart, 'MMM d')} – ${format(addWeeks(weekStart, 1), 'MMM d, yyyy')}`

  async function handleStatusChange(id: string, status: 'published' | 'scheduled') {
    await updatePost(id, { status })
    toast.success(status === 'published' ? 'Marked as published' : 'Marked as scheduled')
  }

  return (
    <div className="space-y-4">
      {/* Header — stacks vertically on mobile */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Content Calendar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Plan and manage your scheduled posts
          </p>
        </div>

        {/* Week navigation */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setWeekStart((w) => subWeeks(w, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[140px] sm:min-w-[160px] text-center">
            {weekLabel}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setWeekStart((w) => addWeeks(w, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-8"
            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
          >
            Today
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          Loading posts…
        </div>
      ) : (
        <WeeklyGrid
          weekStart={weekStart}
          posts={posts}
          movePost={movePost}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}
