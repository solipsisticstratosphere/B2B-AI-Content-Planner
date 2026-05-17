import { useState } from 'react'
import { AIPanel } from '@/components/generate/AIPanel'
import { GenerationHistory } from '@/components/generate/GenerationHistory'
import { ResultPanel } from '@/components/generate/ResultPanel'
import { UpgradeModal } from '@/components/generate/UpgradeModal'
import { useGenerationHistory } from '@/hooks/useGenerationHistory'
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
  )
}
