import Stripe from 'npm:stripe@14'
import { createClient } from 'npm:@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
})

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  // Stripe requires the raw body string for signature verification — read before parsing
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Verification failed'
    console.error('Webhook signature error:', msg)
    return new Response(`Webhook error: ${msg}`, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.user_id

    if (!userId) {
      console.error('checkout.session.completed received without user_id in metadata')
      return new Response('Missing user_id in metadata', { status: 400 })
    }

    // Service role key is required to bypass RLS for the update
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const [profileResult, usageResult] = await Promise.all([
      supabase
        .from('profiles')
        .update({ subscription_tier: 'pro' })
        .eq('id', userId),
      supabase
        .from('usage_limits')
        .update({ max_tokens: 50 })
        .eq('user_id', userId),
    ])

    if (profileResult.error) {
      console.error('Failed to update profile:', profileResult.error)
      return new Response('Failed to update profile', { status: 500 })
    }
    if (usageResult.error) {
      console.error('Failed to update usage limits:', usageResult.error)
      return new Response('Failed to update usage limits', { status: 500 })
    }

    console.log(`Upgraded user ${userId} to Pro`)
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
