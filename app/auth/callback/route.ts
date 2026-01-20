import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const redirectTo = searchParams.get("redirectTo") || "/"

  // Get the origin from forwarded headers (for Docker/proxy) or fall back to request URL
  const headersList = await headers()
  const forwardedHost = headersList.get("x-forwarded-host")
  const forwardedProto = headersList.get("x-forwarded-proto") || "http"
  const host = headersList.get("host")

  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : host
      ? `http://${host}`
      : new URL(request.url).origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  }

  // Return to login page if there was an error
  return NextResponse.redirect(`${origin}/login?error=auth_error`)
}
