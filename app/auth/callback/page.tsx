"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<string>("Processing...")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient()
      const code = searchParams.get("code")
      const errorParam = searchParams.get("error")
      const errorDescription = searchParams.get("error_description")
      const redirectTo = searchParams.get("redirectTo") || "/"

      console.log("Callback params:", { code: code?.slice(0, 10) + "...", errorParam, redirectTo })

      // Handle OAuth errors from provider
      if (errorParam) {
        const msg = errorDescription || errorParam
        console.error("OAuth error:", msg)
        setError(msg)
        setTimeout(() => router.push(`/login?error=${encodeURIComponent(msg)}`), 2000)
        return
      }

      if (!code) {
        setError("No authorization code received")
        setTimeout(() => router.push("/login?error=missing_code"), 2000)
        return
      }

      setStatus("Exchanging code for session...")

      try {
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
          console.error("Exchange error:", exchangeError.message)
          setError(exchangeError.message)
          setTimeout(() => router.push(`/login?error=${encodeURIComponent(exchangeError.message)}`), 2000)
          return
        }

        if (!data.session) {
          setError("No session returned from exchange")
          setTimeout(() => router.push("/login?error=no_session"), 2000)
          return
        }

        console.log("Session established for user:", data.session.user.email)
        setStatus(`Signed in as ${data.session.user.email}! Redirecting...`)

        // Small delay to show success message, then redirect
        setTimeout(() => {
          window.location.href = redirectTo
        }, 1000)
      } catch (err) {
        console.error("Callback error:", err)
        const message = err instanceof Error ? err.message : "Authentication failed"
        setError(message)
        setTimeout(() => router.push(`/login?error=${encodeURIComponent(message)}`), 2000)
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4 max-w-md text-center px-4">
        {error ? (
          <>
            <div className="text-destructive font-medium">Error: {error}</div>
            <p className="text-sm text-muted-foreground">Redirecting to login...</p>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-muted-foreground">{status}</p>
          </>
        )}
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  )
}
