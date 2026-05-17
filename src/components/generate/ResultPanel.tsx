import { useState } from 'react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { Copy, CalendarPlus, ChevronDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import type { Platform } from '@/lib/types'

const CHAR_LIMITS: Record<Platform, number> = {
  linkedin: 3000,
  twitter: 280,
  telegram: 4096,
}

interface ResultPanelProps {
  text: string
  isStreaming: boolean
  isDone: boolean
  platform: Platform
  prompt: string
}

export function ResultPanel({ text, isStreaming, isDone, platform, prompt }: ResultPanelProps) {
  const { user } = useAuth()

  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined)
  const [scheduleTime, setScheduleTime] = useState('09:00')
  const [scheduleStatus, setScheduleStatus] = useState<'draft' | 'scheduled'>('scheduled')
  const [isSaving, setIsSaving] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const charLimit = CHAR_LIMITS[platform]
  const charCount = text.length
  const charRatio = charCount / charLimit
  const charColorClass =
    charRatio >= 1
      ? 'text-red-400'
      : charRatio >= 0.8
        ? 'text-amber-400'
        : 'text-muted-foreground/60'

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  async function handleSchedule() {
    if (!scheduleDate) {
      toast.error('Pick a date first')
      return
    }
    if (!user) return

    setIsSaving(true)
    try {
      const [h, m] = scheduleTime.split(':').map(Number)
      const dt = new Date(scheduleDate)
      dt.setHours(h, m, 0, 0)
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: text,
        platform,
        scheduled_for: dt.toISOString(),
        status: scheduleStatus,
        ai_prompt: prompt || null,
      })
      if (error) throw error
      toast.success('Post added to calendar!')
      setShowSchedule(false)
      setScheduleDate(undefined)
      setScheduleTime('09:00')
      setScheduleStatus('scheduled')
    } catch (err) {
      toast.error((err as Error).message ?? 'Could not save post')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Result card */}
      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Result
          </CardTitle>
          {isDone && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={handleCopy}
            >
              <Copy className="w-3.5 h-3.5" />
              Copy
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed text-foreground min-h-[120px] bg-muted/30 rounded-md p-3">
            {text}
            {isStreaming && (
              <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse align-middle" />
            )}
          </pre>
          {isDone && (
            <p className={cn('text-xs text-right tabular-nums', charColorClass)}>
              {charCount.toLocaleString()} / {charLimit.toLocaleString()} chars
              {charRatio >= 1 && ' — over limit'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Schedule accordion */}
      {isDone && (
        <Card>
          <button
            type="button"
            onClick={() => setShowSchedule((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/30 transition-colors rounded-lg"
          >
            <span className="flex items-center gap-2">
              <CalendarPlus className="w-4 h-4 text-primary" />
              Schedule to Calendar
            </span>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-muted-foreground transition-transform',
                showSchedule && 'rotate-180'
              )}
            />
          </button>

          {showSchedule && (
            <CardContent className="pt-0 pb-4 space-y-4 border-t border-border">
              <div className="grid grid-cols-2 gap-3 pt-4">
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !scheduleDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarPlus className="mr-2 h-4 w-4 shrink-0" />
                        {scheduleDate ? format(scheduleDate, 'MMM d, yyyy') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={scheduleDate}
                        onSelect={(date) => {
                          setScheduleDate(date)
                          setCalendarOpen(false)
                        }}
                        disabled={{ before: new Date() }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sched-time">Time</Label>
                  <input
                    id="sched-time"
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={scheduleStatus}
                  onValueChange={(v) => setScheduleStatus(v as 'draft' | 'scheduled')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="draft">Save as Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSchedule} disabled={isSaving} className="w-full gap-2">
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CalendarPlus className="w-4 h-4" />
                )}
                {isSaving ? 'Saving…' : 'Save to Calendar'}
              </Button>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  )
}
