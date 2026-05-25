import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { usePosts } from '@/hooks/usePosts'
import type { Platform, Post } from '@/lib/types'

const CHAR_LIMITS: Record<Platform, number> = {
  linkedin: 3000,
  twitter: 280,
  telegram: 4096,
}

type PostStatus = 'draft' | 'scheduled' | 'published'

const STATUS_CHIPS: {
  value: PostStatus
  label: string
  dot: string
  active: string
}[] = [
  {
    value: 'scheduled',
    label: 'Scheduled',
    dot: 'bg-primary',
    active: 'bg-primary/15 text-primary border-primary/30',
  },
  {
    value: 'draft',
    label: 'Draft',
    dot: 'bg-slate-400',
    active: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30',
  },
  {
    value: 'published',
    label: 'Published',
    dot: 'bg-emerald-400',
    active: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
  },
]

interface EditModalProps {
  post: Post | null
  onClose: () => void
}

export function EditModal({ post, onClose }: EditModalProps) {
  const { updatePost, deletePost } = usePosts()
  const [content, setContent] = useState('')
  const [platform, setPlatform] = useState<Platform>('linkedin')
  const [status, setStatus] = useState<PostStatus>('scheduled')
  const [schedDate, setSchedDate] = useState('')
  const [schedTime, setSchedTime] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (post) {
      setContent(post.content ?? '')
      setPlatform(post.platform)
      setStatus(post.status)
      const dt = parseISO(post.scheduled_for)
      setSchedDate(format(dt, 'yyyy-MM-dd'))
      setSchedTime(format(dt, 'HH:mm'))
    }
  }, [post])

  const charLimit = CHAR_LIMITS[platform]
  const charCount = content.length
  const charRatio = charCount / charLimit
  const charColorClass =
    charRatio >= 1
      ? 'text-red-500 dark:text-red-400'
      : charRatio >= 0.8
        ? 'text-amber-500 dark:text-amber-400'
        : 'text-muted-foreground/50'

  async function handleSave() {
    if (!post) return
    setSaving(true)
    try {
      await updatePost(post.id, {
        content,
        platform,
        status,
        scheduled_for: new Date(`${schedDate}T${schedTime}:00`).toISOString(),
      })
      toast.success('Post updated')
      onClose()
    } catch {
      toast.error('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!post) return
    setDeleting(true)
    try {
      await deletePost(post.id)
      toast.success('Post deleted')
      onClose()
    } catch {
      toast.error('Failed to delete post')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Sheet open={!!post} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit post</SheetTitle>
        </SheetHeader>

        <SheetBody>
          {/* Platform */}
          <div className="space-y-1.5">
            <Label>Platform</Label>
            <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="twitter">Twitter / X</SelectItem>
                <SelectItem value="telegram">Telegram</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <Label>Content</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[280px] resize-none"
              placeholder="Post content…"
            />
            <p className={cn('text-xs text-right tabular-nums', charColorClass)}>
              {charCount.toLocaleString()} / {charLimit.toLocaleString()} chars
            </p>
          </div>

          {/* Status chip group */}
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex gap-2 flex-wrap">
              {STATUS_CHIPS.map((chip) => (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setStatus(chip.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                    status === chip.value
                      ? chip.active
                      : 'border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground'
                  )}
                >
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full shrink-0',
                      status === chip.value ? chip.dot : 'bg-muted-foreground/40'
                    )}
                  />
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date + time side by side */}
          <div className="space-y-1.5">
            <Label>Scheduled for</Label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={schedDate}
                onChange={(e) => setSchedDate(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [color-scheme:dark]"
              />
              <input
                type="time"
                value={schedTime}
                onChange={(e) => setSchedTime(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [color-scheme:dark]"
              />
            </div>
          </div>
        </SheetBody>

        <SheetFooter>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleting || saving}
            className="gap-1.5"
          >
            {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={saving || deleting}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || deleting} className="gap-1.5">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save changes
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
