"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/providers/auth-provider"

export default function DebugPage() {
  const { user, profile, isLoading, authError } = useAuth()
  const [sessionInfo, setSessionInfo] = useState<string>("Loading...")
  const [cookies, setCookies] = useState<string>("")

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()

      // Get session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      // Get user
      const { data: userData, error: userError } = await supabase.auth.getUser()

      setSessionInfo(JSON.stringify({
        session: sessionData.session ? {
          user_id: sessionData.session.user.id,
          email: sessionData.session.user.email,
          expires_at: sessionData.session.expires_at,
        } : null,
        sessionError: sessionError?.message,
        user: userData.user ? {
          id: userData.user.id,
          email: userData.user.email,
        } : null,
        userError: userError?.message,
      }, null, 2))
    }

    checkSession()

    // Show cookies
    if (typeof document !== "undefined") {
      setCookies(document.cookie || "(no cookies)")
    }
  }, [])

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Auth Debug Page</h1>

      <div className="space-y-6">
        <section className="p-4 bg-muted rounded-lg">
          <h2 className="font-semibold mb-2">Auth Provider State:</h2>
          <pre className="text-sm overflow-auto">
{JSON.stringify({
  isLoading,
  authError,
  user: user ? { id: user.id, email: user.email } : null,
  profile: profile ? { id: profile.id, name: profile.name, role: profile.role } : null,
}, null, 2)}
          </pre>
        </section>

        <section className="p-4 bg-muted rounded-lg">
          <h2 className="font-semibold mb-2">Supabase Client Session:</h2>
          <pre className="text-sm overflow-auto">{sessionInfo}</pre>
        </section>

        <section className="p-4 bg-muted rounded-lg">
          <h2 className="font-semibold mb-2">Browser Cookies:</h2>
          <pre className="text-sm overflow-auto whitespace-pre-wrap break-all">{cookies}</pre>
        </section>

        <section className="p-4 bg-muted rounded-lg">
          <h2 className="font-semibold mb-2">Environment:</h2>
          <pre className="text-sm overflow-auto">
{JSON.stringify({
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30) + "...",
  hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
}, null, 2)}
          </pre>
        </section>
      </div>
    </div>
  )
}
