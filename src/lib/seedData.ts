import { addDays, setHours, setMinutes, startOfWeek } from 'date-fns'
import { supabase } from './supabase'
import type { Platform } from './types'

interface SeedPost {
  content: string
  platform: Platform
  dayOffset: number
  hour: number
  minute: number
}

const SEED_POSTS: SeedPost[] = [
  {
    content:
      "Excited to share how we reduced our content production time by 60% using AI-assisted workflows. The key insight: stop treating AI as a replacement and start treating it as a first-draft partner. Here's what changed everything for our team 🧵",
    platform: 'linkedin',
    dayOffset: 0,
    hour: 9,
    minute: 0,
  },
  {
    content:
      "Hot take: most B2B content calendars are wrong before they even launch.\n\nThey optimize for quantity over signal. We flipped the model — 3 posts/week, fully researched, with a point of view.\n\nResult: 4x engagement in 90 days.",
    platform: 'twitter',
    dayOffset: 1,
    hour: 11,
    minute: 30,
  },
  {
    content:
      "We just published our Q2 Content Strategy Playbook — everything we learned building an AI-powered content engine for enterprise clients.\n\n📌 Prompt engineering for B2B tone\n📌 Multi-platform repurposing\n📌 The 3-layer review process\n\nLink in comments.",
    platform: 'linkedin',
    dayOffset: 2,
    hour: 14,
    minute: 0,
  },
  {
    content:
      "The content team that wins in 2025 isn't the one with the most writers.\n\nIt's the one that builds the best feedback loops between data, AI drafts, and human judgment.\n\nStopped chasing virality. Started building systems.",
    platform: 'twitter',
    dayOffset: 3,
    hour: 10,
    minute: 0,
  },
  {
    content:
      '📣 Weekly Content Brief — Issue #14\n\nThis week we\'re diving deep into:\n→ How to use AI prompts to match your brand voice\n→ The platform-native content matrix\n→ Why "posting consistently" is the wrong goal\n\nRead time: 5 min. Worth every second.',
    platform: 'telegram',
    dayOffset: 4,
    hour: 13,
    minute: 0,
  },
  {
    content:
      "📊 Friday Recap\n\nWhat worked this week:\n✅ LinkedIn carousel on AI workflows → 1.2k impressions\n✅ Twitter thread on content strategy → 340 reposts\n✅ Telegram briefing open rate: 74%\n\nWhat to adjust: posting window on Twitter. Moving to 8am EST next week.",
    platform: 'telegram',
    dayOffset: 5,
    hour: 15,
    minute: 0,
  },
]

export async function seedPostsIfEmpty(userId: string): Promise<void> {
  const { data: existing, error } = await supabase
    .from('posts')
    .select('id')
    .eq('user_id', userId)
    .limit(1)

  if (error || (existing && existing.length > 0)) return

  const monday = startOfWeek(new Date(), { weekStartsOn: 1 })

  const posts = SEED_POSTS.map((p) => {
    const date = setMinutes(setHours(addDays(monday, p.dayOffset), p.hour), p.minute)
    return {
      user_id: userId,
      content: p.content,
      platform: p.platform,
      scheduled_for: date.toISOString(),
      status: 'scheduled' as const,
      ai_prompt: null,
    }
  })

  await supabase.from('posts').insert(posts)
}
