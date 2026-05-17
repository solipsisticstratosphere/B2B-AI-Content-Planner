import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { GenerationHistory } from '@/lib/types'
import { useAuth } from './useAuth'

export function useGenerationHistory() {
  const { user } = useAuth()
  const [history, setHistory] = useState<GenerationHistory[]>([])
  const [count, setCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  const fetchHistory = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const [{ data }, { count: total }] = await Promise.all([
      supabase
        .from('generation_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('generation_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
    ])

    setHistory((data as GenerationHistory[]) ?? [])
    setCount(total ?? 0)
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  return { history, count, loading, refetch: fetchHistory }
}
