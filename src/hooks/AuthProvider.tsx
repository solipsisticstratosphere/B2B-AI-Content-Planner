import { AuthContext, createAuthValue } from './useAuth'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const value = createAuthValue()
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
