import { useState } from 'react'
import { Sparkles, Zap, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
}

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session')
      if (error) throw error
      if (data?.url) {
        // Redirect to Stripe-hosted Checkout — no card data ever touches our app
        window.location.href = data.url
        // Don't setLoading(false); the page is navigating away
        return
      }
      throw new Error('No checkout URL returned')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      toast.error(`Could not start checkout: ${msg}`)
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={loading ? undefined : onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/20 mx-auto mb-2">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center">You've used all your free tokens</DialogTitle>
          <DialogDescription className="text-center">
            Upgrade to Pro for unlimited AI generation, priority access, and advanced tone
            controls.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Pro Plan</span>
            <span className="font-bold text-primary">$29 / mo</span>
          </div>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-primary" /> Unlimited AI tokens
            </li>
            <li className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-primary" /> All 3 platforms
            </li>
            <li className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-primary" /> Advanced tone profiles
            </li>
            <li className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-primary" /> Priority generation
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <Button
            className="w-full bg-primary hover:bg-primary/90 gap-2"
            onClick={handleUpgrade}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Redirecting to checkout…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Upgrade to Pro
              </>
            )}
          </Button>
          <Button variant="ghost" className="w-full" onClick={onClose} disabled={loading}>
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
