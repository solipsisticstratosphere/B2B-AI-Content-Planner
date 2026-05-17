import { useEffect, useState } from 'react'
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
import { supabase } from '@/lib/supabase'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getWeekStart(): Date {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

type DayData = { day: string; 'This week': number; 'Last week': number }

export function TokenUsageChart() {
  const [data, setData] = useState<DayData[]>(
    DAYS.map((day) => ({ day, 'This week': 0, 'Last week': 0 }))
  )

  useEffect(() => {
    async function load() {
      const weekStart = getWeekStart()
      const twoWeeksAgo = new Date(weekStart)
      twoWeeksAgo.setDate(weekStart.getDate() - 7)

      const { data: rows } = await supabase
        .from('generation_history')
        .select('created_at')
        .gte('created_at', twoWeeksAgo.toISOString())

      const thisWeek = new Array(7).fill(0)
      const lastWeek = new Array(7).fill(0)

      rows?.forEach((row) => {
        const d = new Date(row.created_at)
        const dayIdx = d.getDay()
        const monIdx = dayIdx === 0 ? 6 : dayIdx - 1
        if (d >= weekStart) {
          thisWeek[monIdx]++
        } else {
          lastWeek[monIdx]++
        }
      })

      setData(
        DAYS.map((day, i) => ({
          day,
          'This week': thisWeek[i],
          'Last week': lastWeek[i],
        }))
      )
    }
    load()
  }, [])

  return (
    <Card className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 fill-mode-both delay-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          AI Token Usage — This Week
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="day"
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
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: 12,
              }}
              labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 500 }}
              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }} />
            <Bar
              dataKey="Last week"
              fill="#7F5AF0"
              fillOpacity={0.25}
              radius={[3, 3, 0, 0]}
              maxBarSize={14}
              isAnimationActive
              animationDuration={700}
              animationEasing="ease-out"
              animationBegin={350}
            />
            <Bar
              dataKey="This week"
              fill="#7F5AF0"
              radius={[3, 3, 0, 0]}
              maxBarSize={14}
              isAnimationActive
              animationDuration={700}
              animationEasing="ease-out"
              animationBegin={450}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
