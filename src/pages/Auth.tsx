import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Zap, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthForm } from '@/components/auth/AuthForm'
import { useAuth } from '@/hooks/useAuth'

export default function Auth() {
  const { user, loading } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  if (loading) return null
  if (user) return <Navigate to="/" replace />

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Portfolio demo banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <p className="text-xs text-amber-300 text-center">
          Portfolio demo — built to showcase architecture and UX. Functionality is real; branding is
          fictional.
        </p>
      </div>

      {/* Auth card */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Brand */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/20 mb-2">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">ContentFlow AI</h1>
            <p className="text-muted-foreground text-sm">Schedule smarter. Publish faster.</p>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">
                {mode === 'signin' ? 'Sign in to your account' : 'Create an account'}
              </CardTitle>
              <CardDescription>
                {mode === 'signin'
                  ? 'Enter your credentials to continue'
                  : 'Start managing your content today'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuthForm mode={mode} onToggle={() => setMode(mode === 'signin' ? 'signup' : 'signin')} />
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            ContentFlow AI · Demo build
          </p>
        </div>
      </div>
    </div>
  )
}
