import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Post } from '@/lib/types'

const PLATFORMS = ['linkedin', 'twitter', 'telegram'] as const

const PLATFORM_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  twitter: 'Twitter',
  telegram: 'Telegram',
}

interface PostsStatusChartProps {
  posts: Post[]
}

export function PostsStatusChart({ posts }: PostsStatusChartProps) {
  const data = PLATFORMS.map((platform) => {
    const ps = posts.filter((p) => p.platform === platform)
    return {
      name: PLATFORM_LABELS[platform],
      Draft: ps.filter((p) => p.status === 'draft').length,
      Scheduled: ps.filter((p) => p.status === 'scheduled').length,
      Published: ps.filter((p) => p.status === 'published').length,
    }
  })

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      borderRadius: '6px',
      fontSize: 12,
    },
    labelStyle: { color: 'hsl(var(--foreground))', fontWeight: 500 },
    cursor: { fill: 'hsl(var(--muted))', opacity: 0.4 },
  }

  return (
    <Card className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 fill-mode-both delay-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Posts by Platform & Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }} />
            <Bar
              dataKey="Draft"
              stackId="a"
              fill="#64748b"
              maxBarSize={40}
              isAnimationActive
              animationDuration={600}
              animationEasing="ease-out"
              animationBegin={400}
            />
            <Bar
              dataKey="Scheduled"
              stackId="a"
              fill="#7F5AF0"
              maxBarSize={40}
              isAnimationActive
              animationDuration={600}
              animationEasing="ease-out"
              animationBegin={400}
            />
            <Bar
              dataKey="Published"
              stackId="a"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
              isAnimationActive
              animationDuration={600}
              animationEasing="ease-out"
              animationBegin={400}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
