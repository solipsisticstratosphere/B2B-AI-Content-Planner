import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { CalendarDays, Sparkles, FileText, Download, FileEdit, Cpu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/dashboard/StatCard'
import { TokenUsageChart } from '@/components/dashboard/TokenUsageChart'
import { PostsStatusChart } from '@/components/dashboard/PostsStatusChart'
import { UpcomingPosts } from '@/components/dashboard/UpcomingPosts'
import { useAuth } from '@/hooks/useAuth'
import { usePosts } from '@/hooks/usePosts'
import { useUsage } from '@/hooks/useUsage'
import { useGenerationHistory } from '@/hooks/useGenerationHistory'
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter'
import { seedPostsIfEmpty } from '@/lib/seedData'

export default function Dashboard() {
  const { user } = useAuth()
  const { posts, loading: postsLoading } = usePosts()
  const { tokensUsed, maxTokens, refetch: refetchUsage } = useUsage()
  const { count: generationsCount } = useGenerationHistory()
  const checkedCheckout = useRef(false)

  useEffect(() => {
    if (user) seedPostsIfEmpty(user.id)
  }, [user])

  useEffect(() => {
    if (checkedCheckout.current) return
    checkedCheckout.current = true
    const params = new URLSearchParams(window.location.search)
    if (params.get('checkout') === 'success') {
      toast.success("You're now on Pro!", { duration: 5000 })
      window.history.replaceState({}, '', window.location.pathname)
      setTimeout(() => refetchUsage(), 1500)
    }
  }, [refetchUsage])

  const scheduledCount = posts.filter((p) => p.status === 'scheduled').length
  const publishedCount = posts.filter((p) => p.status === 'published').length
  const draftCount = posts.filter((p) => p.status === 'draft').length

  const animatedScheduled = useAnimatedCounter(postsLoading ? 0 : scheduledCount)
  const animatedPublished = useAnimatedCounter(postsLoading ? 0 : publishedCount)
  const animatedDraft = useAnimatedCounter(postsLoading ? 0 : draftCount)
  const animatedTokensLeft = useAnimatedCounter(maxTokens - tokensUsed)
  const animatedGenerations = useAnimatedCounter(generationsCount)

  function exportCSV() {
    if (posts.length === 0) {
      toast('No posts to export', { icon: '📭' })
      return
    }
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
    const header = 'platform,content,scheduled_for,status'
    const rows = posts.map((p) =>
      [escape(p.platform), escape(p.content ?? ''), escape(p.scheduled_for ?? ''), escape(p.status)].join(',')
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'posts.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${posts.length} post${posts.length === 1 ? '' : 's'}`)
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Your content at a glance</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs shrink-0 mt-1"
          onClick={exportCSV}
          disabled={postsLoading}
        >
          <Download className="w-3.5 h-3.5" />
          Export posts
        </Button>
      </div>

      {/* Stat cards — 5 across on large screens */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Scheduled"
          value={postsLoading ? '—' : animatedScheduled}
          subtitle="Upcoming"
          icon={<CalendarDays className="w-4 h-4" />}
          accent
          delay={0}
        />
        <StatCard
          title="Published"
          value={postsLoading ? '—' : animatedPublished}
          subtitle="All time"
          icon={<FileText className="w-4 h-4" />}
          delay={80}
        />
        <StatCard
          title="Drafts"
          value={postsLoading ? '—' : animatedDraft}
          subtitle="Needs review"
          icon={<FileEdit className="w-4 h-4" />}
          delay={160}
        />
        <StatCard
          title="AI generations"
          value={animatedGenerations}
          subtitle="All time"
          icon={<Cpu className="w-4 h-4" />}
          delay={240}
        />
        <StatCard
          title="Tokens left"
          value={`${animatedTokensLeft} / ${maxTokens}`}
          subtitle="This period"
          icon={<Sparkles className="w-4 h-4" />}
          delay={320}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TokenUsageChart />
        <PostsStatusChart posts={posts} />
      </div>

      {/* Upcoming posts list */}
      <UpcomingPosts posts={posts} loading={postsLoading} />
    </div>
  )
}
