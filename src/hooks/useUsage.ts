import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { UsageLimit } from '@/lib/types'
import { useAuth } from './useAuth'

async function provisionUserData(userId: string): Promise<void> {
  await supabase
    .from('profiles')
    .upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true })

  await supabase
    .from('usage_limits')
    .upsert(
      {
        user_id: userId,
        tokens_used: 0,
        max_tokens: 5,
        reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      { onConflict: 'user_id', ignoreDuplicates: true }
    )
}

export function useUsage() {
  const { user } = useAuth()
  const [usage, setUsage] = useState<UsageLimit | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUsage = useCallback(async () => {
    if (!user) return
    setLoading(true)

    let { data } = await supabase
      .from('usage_limits')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!data) {
      await provisionUserData(user.id)
      const result = await supabase
        .from('usage_limits')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      data = result.data
    }

    setUsage(data as UsageLimit | null)
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchUsage()
  }, [fetchUsage])

  async function deductToken(): Promise<void> {
    if (!user || !usage) return
    const newCount = usage.tokens_used + 1
    setUsage((prev) => (prev ? { ...prev, tokens_used: newCount } : prev))
    await supabase
      .from('usage_limits')
      .update({ tokens_used: newCount })
      .eq('user_id', user.id)
  }

  const tokensUsed = usage?.tokens_used ?? 0
  const maxTokens = usage?.max_tokens ?? 5
  const canGenerate = tokensUsed < maxTokens
  const resetDate = usage?.reset_date ?? null

  return { usage, loading, tokensUsed, maxTokens, canGenerate, resetDate, deductToken, refetch: fetchUsage }
}
