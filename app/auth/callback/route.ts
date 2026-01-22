import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

type CookieToSet = { name: string; value: string; options?: CookieOptions }

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const redirectTo = searchParams.get("redirectTo") || "/"
  const errorParam = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  // Get the origin from forwarded headers (for Vercel/Docker/proxy) or fall back to request URL
  // On Vercel, x-forwarded-proto tells us the actual protocol used by the client
  const forwardedHost = request.headers.get("x-forwarded-host")
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https"
  const host = request.headers.get("host")

  // Prefer forwarded headers (Vercel sets these), fall back to host header with https
  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : host
      ? `https://${host}`
      : request.nextUrl.origin

  // Handle OAuth errors from Supabase/Google
  if (errorParam) {
    console.error("OAuth error:", errorParam, errorDescription)
    const errorMessage = encodeURIComponent(errorDescription || errorParam)
    return NextResponse.redirect(`${origin}/login?error=${errorMessage}`)
  }

  if (!code) {
    console.error("No code provided in callback")
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  // Create a response that we can set cookies on
  let response = NextResponse.redirect(`${origin}${redirectTo}`)

  // Create Supabase client with cookie handling that sets on our response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          // Set cookies on the response object
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error("Error exchanging code for session:", error.message)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
  }

  if (!data.session) {
    console.error("No session returned after code exchange")
    return NextResponse.redirect(`${origin}/login?error=no_session`)
  }

  // Successfully exchanged code for session, cookies are set on response
  return response
}
