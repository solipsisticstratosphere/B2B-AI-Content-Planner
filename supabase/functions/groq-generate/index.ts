import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.1-8b-instant'

type Platform = 'linkedin' | 'twitter' | 'telegram'
type Tone = 'professional' | 'casual' | 'witty'

function buildSystemPrompt(platform: Platform, tone: Tone): string {
  const platformRules: Record<Platform, string> = {
    linkedin:
      'Write a LinkedIn post (150–250 words). LinkedIn is a professional network — use line breaks between paragraphs, bullet points where helpful, and end with a call to action or question.',
    twitter:
      'Write a Twitter/X post. Keep it under 280 characters for a single tweet, or use a short thread format (2–4 tweets separated by two newlines, each numbered like "1/").',
    telegram:
      'Write a Telegram channel post (100–200 words). You can use emoji, bold (**text**), and short paragraphs. Keep it conversational and direct.',
  }

  const toneRules: Record<Tone, string> = {
    professional:
      'Use a professional, authoritative tone. Be clear, confident, and business-focused. Avoid slang.',
    casual:
      'Use a casual, friendly, conversational tone. Write like you\'re talking to a colleague. Short sentences are fine.',
    witty:
      'Use a witty, clever tone with light humor. Be engaging and a little surprising — but keep it professional enough for the platform.',
  }

  return `You are an expert social media copywriter.
${platformRules[platform]}
${toneRules[tone]}
Write ONLY the post content. No preamble like "Here's a post:", no explanations, no meta-commentary. Just the post.`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const { prompt, platform, tone } = await req.json() as {
      prompt: string
      platform: Platform
      tone: Tone
    }

    if (!prompt || !platform || !tone) {
      return new Response(JSON.stringify({ error: 'Missing prompt, platform, or tone' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const groqKey = Deno.env.get('GROQ_API_KEY')
    if (!groqKey) {
      return new Response(JSON.stringify({ error: 'GROQ_API_KEY not configured' }), {
        status: 500,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const groqResponse = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: buildSystemPrompt(platform, tone) },
          { role: 'user', content: prompt },
        ],
        stream: true,
        max_tokens: 400,
        temperature: 0.8,
      }),
    })

    if (!groqResponse.ok) {
      const err = await groqResponse.text()
      return new Response(JSON.stringify({ error: `Groq error: ${err}` }), {
        status: groqResponse.status,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // Proxy the SSE stream directly to the client
    return new Response(groqResponse.body, {
      headers: {
        ...CORS,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
