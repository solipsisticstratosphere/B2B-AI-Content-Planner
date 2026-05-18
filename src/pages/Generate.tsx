import { useState } from 'react'
import { Crown } from 'lucide-react'
import { AIPanel } from '@/components/generate/AIPanel'
import { GenerationHistory } from '@/components/generate/GenerationHistory'
import { ResultPanel } from '@/components/generate/ResultPanel'
import { UpgradeModal } from '@/components/generate/UpgradeModal'
import { useGenerationHistory } from '@/hooks/useGenerationHistory'
import { useUsage } from '@/hooks/useUsage'
import type { GenerationHistory as HistoryItem, Platform } from '@/lib/types'

interface ResultState {
  text: string
  isStreaming: boolean
  isDone: boolean
  platform: Platform
  prompt: string
}

export default function Generate() {
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [restoreItem, setRestoreItem] = useState<HistoryItem | null>(null)
  const [result, setResult] = useState<ResultState | null>(null)
  const { history, loading: historyLoading, refetch: refetchHistory } = useGenerationHistory()
  const { maxTokens } = useUsage()
  const isPro = maxTokens > 5

  function handleRestore(item: HistoryItem) {
    setRestoreItem({ ...item })
  }

  function handleResultChange(
    text: string,
    isStreaming: boolean,
    isDone: boolean,
    platform: Platform,
    prompt: string
  ) {
    if (!text && !isStreaming && !isDone) {
      setResult(null)
    } else {
      setResult({ text, isStreaming, isDone, platform, prompt })
    }
  }

  const showResult = result && (result.text || result.isStreaming)

  return (
    <div className="space-y-5">
      {/* Page header — above the grid so both columns start at the same level */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Generate</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Describe your topic and let AI draft your post
          </p>
        </div>
        {!isPro && (
          <button
            type="button"
            onClick={() => setShowUpgrade(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-amber-300 bg-amber-400/10 border border-amber-400/20 rounded-full px-3 py-1.5 hover:bg-amber-400/20 transition-colors shrink-0"
          >
            <Crown className="w-3.5 h-3.5" />
            Upgrade to Pro
          </button>
        )}
      </div>

    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 items-start">
      {/* Left: compose + generate form */}
      <AIPanel
        onShowUpgrade={() => setShowUpgrade(true)}
        restoreItem={restoreItem}
        onGenerated={refetchHistory}
        onResultChange={handleResultChange}
      />

      {/* Right: result (when active) + history */}
      <div className="space-y-5">
        {showResult && (
          <ResultPanel
            text={result.text}
            isStreaming={result.isStreaming}
            isDone={result.isDone}
            platform={result.platform}
            prompt={result.prompt}
          />
        )}
        <GenerationHistory
          history={history}
          loading={historyLoading}
          onRestore={handleRestore}
        />
      </div>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
    </div>
  )
}
