import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Post } from '@/lib/types'

const PLATFORM_COLORS: Record<string, string> = {
  linkedin: '#0A66C2',
  twitter: '#9B59B6',
  telegram: '#10B981',
}

const PLATFORM_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  twitter: 'Twitter',
  telegram: 'Telegram',
}

interface PlatformDonutChartProps {
  posts: Post[]
}

export function PlatformDonutChart({ posts }: PlatformDonutChartProps) {
  const counts = posts.reduce<Record<string, number>>((acc, post) => {
    acc[post.platform] = (acc[post.platform] ?? 0) + 1
    return acc
  }, {})

  const data = Object.entries(counts).map(([platform, value]) => ({
    name: PLATFORM_LABELS[platform] ?? platform,
    value,
    platform,
  }))

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Platform Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[180px]">
          <p className="text-xs text-muted-foreground">No posts yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Platform Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry) => (
                <Cell key={entry.platform} fill={PLATFORM_COLORS[entry.platform] ?? '#888'} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: 12,
              }}
              labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 500 }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number, name: string) => [value, name]}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: 12 }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
