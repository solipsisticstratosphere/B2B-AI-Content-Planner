export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  subscription_tier: 'free' | 'pro'
  created_at: string
}

export interface UsageLimit {
  user_id: string
  tokens_used: number
  max_tokens: number
  reset_date: string
}

export interface Post {
  id: string
  user_id: string
  content: string
  platform: Platform
  scheduled_for: string
  status: 'draft' | 'scheduled' | 'published'
  ai_prompt: string | null
  created_at: string
}

export interface GenerationHistory {
  id: string
  user_id: string
  prompt: string
  result: string
  platform: Platform
  tone: Tone
  created_at: string
}

export type Platform = 'linkedin' | 'twitter' | 'telegram'
export type Tone = 'professional' | 'casual' | 'witty'
