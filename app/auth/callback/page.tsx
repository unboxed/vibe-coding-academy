"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient()
      const code = searchParams.get("code")
      const errorParam = searchParams.get("error")
      const errorDescription = searchParams.get("error_description")
      const redirectTo = searchParams.get("redirectTo") || "/"

      // Handle OAuth errors
      if (errorParam) {
        console.error("OAuth error:", errorParam, errorDescription)
        router.push(`/login?error=${encodeURIComponent(errorDescription || errorParam)}`)
        return
      }

      if (!code) {
        router.push("/login?error=missing_code")
        return
      }

      try {
        // Exchange the code for a session using the browser client
        // This works because the browser client has access to the PKCE code verifier
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          console.error("Error exchanging code:", error.message)
          router.push(`/login?error=${encodeURIComponent(error.message)}`)
          return
        }

        // Success! Redirect to the intended destination
        router.push(redirectTo)
        router.refresh() // Refresh to update server components with new auth state
      } catch (err) {
        console.error("Callback error:", err)
        const message = err instanceof Error ? err.message : "Authentication failed"
        router.push(`/login?error=${encodeURIComponent(message)}`)
      }
    }

    handleCallback()
  }, [router, searchParams])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">{error}</p>
          <p className="mt-2 text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-muted-foreground">Completing sign in...</p>
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
