import { useEffect, useRef, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { addDays, format, isSameDay, parse, parseISO } from 'date-fns'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { PostCard } from './PostCard'
import { EditModal } from './EditModal'
import { cn } from '@/lib/utils'
import type { Post } from '@/lib/types'

// ─── DraggableCard ────────────────────────────────────────────────────────────
function DraggableCard({
  post,
  onClick,
  onStatusChange,
}: {
  post: Post
  onClick: () => void
  onStatusChange?: (status: 'published' | 'scheduled') => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: post.id })
  const hasDragged = useRef(false)

  useEffect(() => {
    if (isDragging) hasDragged.current = true
  }, [isDragging])

  function handleClick() {
    if (hasDragged.current) {
      hasDragged.current = false
      return
    }
    onClick()
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn('touch-none select-none', isDragging && 'opacity-0')}
    >
      <PostCard post={post} onClick={handleClick} onStatusChange={onStatusChange} />
    </div>
  )
}

// ─── DroppableDay ─────────────────────────────────────────────────────────────
function DroppableDay({
  dayId,
  isEmpty,
  children,
}: {
  dayId: string
  isEmpty: boolean
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dayId })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'space-y-1.5 min-h-[120px] rounded-md p-0.5 transition-colors duration-150',
        isOver && 'bg-primary/10 ring-1 ring-inset ring-primary/30'
      )}
    >
      {children}
      {isEmpty && !isOver && (
        <div className="flex flex-col items-center justify-center gap-1 pt-6 opacity-20 pointer-events-none select-none">
          <Plus className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">No posts</span>
        </div>
      )}
    </div>
  )
}

// ─── MobileDayList ────────────────────────────────────────────────────────────
function MobileDayList({
  postsByDay,
  onEditPost,
  onStatusChange,
}: {
  postsByDay: { date: Date; dayId: string; posts: Post[] }[]
  onEditPost: (post: Post) => void
  onStatusChange?: (id: string, status: 'published' | 'scheduled') => Promise<void>
}) {
  const today = new Date()

  return (
    <div className="space-y-3">
      {postsByDay.map(({ date, dayId, posts: dayPosts }) => {
        const isToday = isSameDay(date, today)
        const hasPost = dayPosts.length > 0
        return (
          <div key={dayId} className="rounded-lg border border-border overflow-hidden">
            {/* Day header */}
            <div
              className={cn(
                'flex items-center justify-between px-3 py-2',
                isToday ? 'bg-primary/15' : 'bg-muted/30'
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-xs font-semibold uppercase tracking-wide',
                    isToday ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {format(date, 'EEE')}
                </span>
                <span
                  className={cn(
                    'text-sm font-bold',
                    isToday ? 'text-primary' : 'text-foreground'
                  )}
                >
                  {format(date, 'MMM d')}
                </span>
                {isToday && (
                  <span className="text-[10px] font-medium bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                    Today
                  </span>
                )}
              </div>
              {hasPost && (
                <span className="text-[10px] text-muted-foreground">
                  {dayPosts.length} post{dayPosts.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Posts or empty */}
            <div className="p-2 space-y-2">
              {hasPost ? (
                dayPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onClick={() => onEditPost(post)}
                    onStatusChange={
                      onStatusChange
                        ? (status) => onStatusChange(post.id, status)
                        : undefined
                    }
                  />
                ))
              ) : (
                <p className="text-xs text-muted-foreground/40 py-2 text-center">
                  No posts scheduled
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── WeeklyGrid ───────────────────────────────────────────────────────────────
interface WeeklyGridProps {
  weekStart: Date
  posts: Post[]
  movePost: (id: string, newScheduledFor: string) => Promise<void>
  onStatusChange?: (id: string, status: 'published' | 'scheduled') => Promise<void>
}

export function WeeklyGrid({ weekStart, posts, movePost, onStatusChange }: WeeklyGridProps) {
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [activePost, setActivePost] = useState<Post | null>(null)
  const today = new Date()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const postsByDay = days.map((day) => ({
    date: day,
    dayId: format(day, 'yyyy-MM-dd'),
    posts: posts.filter((post) => isSameDay(parseISO(post.scheduled_for), day)),
  }))

  function handleDragStart(event: DragStartEvent) {
    const post = posts.find((p) => p.id === event.active.id)
    setActivePost(post ?? null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActivePost(null)
    const { active, over } = event
    if (!over) return

    const post = posts.find((p) => p.id === active.id)
    if (!post) return

    const targetDate = parse(over.id as string, 'yyyy-MM-dd', new Date())
    const original = parseISO(post.scheduled_for)

    if (isSameDay(original, targetDate)) return

    const newDate = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
      original.getHours(),
      original.getMinutes(),
      original.getSeconds()
    )

    try {
      await movePost(post.id, newDate.toISOString())
    } catch {
      toast.error('Could not move post — changes reverted')
    }
  }

  return (
    <>
      {/* ── Mobile: day-by-day list (< md) ── */}
      <div className="md:hidden">
        <MobileDayList
          postsByDay={postsByDay}
          onEditPost={setEditingPost}
          onStatusChange={onStatusChange}
        />
      </div>

      {/* ── Tablet / Desktop: 7-column drag-and-drop grid (≥ md) ── */}
      <div className="hidden md:block">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          {/* Tablet (md–lg): 4 cols first row + 3 cols second row */}
          <div className="grid grid-cols-4 lg:grid-cols-7 gap-2 mt-2">
            {postsByDay.map(({ date, dayId, posts: dayPosts }, idx) => {
              const isToday = isSameDay(date, today)
              // On tablet, hide the last 3 days in the first row and show them in a second row
              // We achieve this with CSS: just let grid-cols-4 wrap naturally
              return (
                <div key={dayId} className={cn('min-w-0', idx >= 4 && 'lg:col-auto')}>
                  <div className={cn('text-center mb-2 py-1 rounded-md', isToday && 'bg-primary/15')}>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                      {format(date, 'EEE')}
                    </p>
                    <p
                      className={cn(
                        'text-sm font-semibold',
                        isToday ? 'text-primary' : 'text-foreground'
                      )}
                    >
                      {format(date, 'd')}
                    </p>
                  </div>

                  <DroppableDay dayId={dayId} isEmpty={dayPosts.length === 0}>
                    {dayPosts.map((post) => (
                      <DraggableCard
                        key={post.id}
                        post={post}
                        onClick={() => setEditingPost(post)}
                        onStatusChange={
                          onStatusChange
                            ? (status) => onStatusChange(post.id, status)
                            : undefined
                        }
                      />
                    ))}
                  </DroppableDay>
                </div>
              )
            })}
          </div>

          <DragOverlay dropAnimation={null}>
            {activePost && (
              <div className="opacity-60 shadow-xl shadow-black/40 rotate-[0.5deg] pointer-events-none">
                <PostCard post={activePost} onClick={() => {}} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      <EditModal post={editingPost} onClose={() => setEditingPost(null)} />
    </>
  )
}
