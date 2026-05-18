import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Loader2, Sparkles, AlertTriangle, Info, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useUsage } from '@/hooks/useUsage'
import { supabase } from '@/lib/supabase'
import type { GenerationHistory, Platform, Tone } from '@/lib/types'

const PLATFORM_TIPS: Record<Platform, string> = {
  linkedin: 'Aim for 1,200–1,500 chars for best reach',
  twitter: 'Hard limit: 280 chars — keep it punchy',
  telegram: 'Markdown supported — **bold**, _italic_, `code`',
}

const PLATFORM_ICONS: Record<Platform, string> = {
  linkedin: '💼',
  twitter: '𝕏',
  telegram: '✈️',
}

interface AIPanelProps {
  onShowUpgrade: () => void
  restoreItem?: GenerationHistory | null
  onGenerated?: () => void
  onResultChange: (text: string, isStreaming: boolean, isDone: boolean, platform: Platform, prompt: string) => void
}

export function AIPanel({ onShowUpgrade, restoreItem, onGenerated, onResultChange }: AIPanelProps) {
  const { user } = useAuth()
  const { canGenerate, deductToken, tokensUsed, maxTokens } = useUsage()
  const [prompt, setPrompt] = useState('')
  const [tone, setTone] = useState<Tone>('professional')
  const [platform, setPlatform] = useState<Platform>('linkedin')
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const isPro = maxTokens > 5
  const tokenRatio = tokensUsed / maxTokens
  const isNearLimit = tokenRatio >= 0.8 && tokenRatio < 1

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (!restoreItem) return
    setPrompt(restoreItem.prompt)
    setPlatform(restoreItem.platform)
    setTone(restoreItem.tone)
    onResultChange(restoreItem.result, false, true, restoreItem.platform, restoreItem.prompt)
    abortRef.current?.abort()
  }, [restoreItem]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGenerate() {
    if (!canGenerate) {
      onShowUpgrade()
      return
    }
    if (!prompt.trim()) {
      toast.error('Enter a prompt first')
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    onResultChange('', true, false, platform, prompt.trim())
    setIsStreaming(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/groq-generate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: prompt.trim(), platform, tone }),
          signal: controller.signal,
        }
      )

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Generation failed' }))
        throw new Error(err.error ?? 'Generation failed')
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta?.content
            if (delta) {
              fullText += delta
              onResultChange(fullText, true, false, platform, prompt.trim())
            }
          } catch {
            // skip malformed chunks
          }
        }
      }

      setIsStreaming(false)
      onResultChange(fullText, false, true, platform, prompt.trim())

      if (user) {
        await supabase.from('generation_history').insert({
          user_id: user.id,
          prompt: prompt.trim(),
          result: fullText,
          platform,
          tone,
        })
      }
      await deductToken()
      toast.success('Content generated!')
      onGenerated?.()
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setIsStreaming(false)
      onResultChange('', false, false, platform, prompt.trim())
      toast.error((err as Error).message ?? 'Generation failed')
    }
  }

  return (
    <div className="space-y-4">
      {/* Compose */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Compose
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="prompt">Topic / brief</Label>
            <Textarea
              id="prompt"
              placeholder="e.g. Share our Q2 content strategy results — highlight the 60% time reduction"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[96px] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Platform</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linkedin">{PLATFORM_ICONS.linkedin} LinkedIn</SelectItem>
                  <SelectItem value="twitter">{PLATFORM_ICONS.twitter} Twitter / X</SelectItem>
                  <SelectItem value="telegram">{PLATFORM_ICONS.telegram} Telegram</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="witty">Witty</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground/70 bg-muted/40 border border-border/50 rounded-md px-3 py-2">
            <Info className="w-3.5 h-3.5 shrink-0 text-muted-foreground/50" />
            {PLATFORM_TIPS[platform]}
          </div>
        </CardContent>
      </Card>

      {/* Generate */}
      <Card>
        <CardContent className="pt-4 pb-4 space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <TrendingUp className="w-3.5 h-3.5" />
                Token usage
              </span>
              <span
                className={cn(
                  'font-medium tabular-nums',
                  !canGenerate
                    ? 'text-red-400'
                    : isNearLimit
                      ? 'text-amber-400'
                      : 'text-muted-foreground'
                )}
              >
                {tokensUsed} / {maxTokens}
              </span>
            </div>
            <Progress
              value={(tokensUsed / maxTokens) * 100}
              className={cn(
                'h-1.5',
                !canGenerate
                  ? '[&>div]:bg-red-500'
                  : isNearLimit
                    ? '[&>div]:bg-amber-500'
                    : ''
              )}
            />
          </div>

          {!canGenerate && (
            <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-md px-3 py-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                All {maxTokens} free tokens used.{' '}
                <button
                  type="button"
                  onClick={onShowUpgrade}
                  className="underline font-medium hover:no-underline"
                >
                  Upgrade to Pro
                </button>{' '}
                for unlimited generation.
              </span>
            </div>
          )}

          {isNearLimit && (
            <div className="flex items-center gap-2 text-xs text-amber-400/80 bg-amber-400/5 border border-amber-400/15 rounded-md px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>
                Almost out of tokens.{' '}
                <button
                  type="button"
                  onClick={onShowUpgrade}
                  className="underline font-medium hover:no-underline"
                >
                  Upgrade now
                </button>{' '}
                to keep generating.
              </span>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={isStreaming || !canGenerate}
            className="w-full gap-2"
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isStreaming ? 'Generating…' : 'Generate Content'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
