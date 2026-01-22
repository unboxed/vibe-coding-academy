import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

type CookieToSet = { name: string; value: string; options?: CookieOptions }

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const redirectTo = searchParams.get("redirectTo") || "/"

  // Get the origin from forwarded headers (for Docker/proxy) or fall back to request URL
  const forwardedHost = request.headers.get("x-forwarded-host")
  const forwardedProto = request.headers.get("x-forwarded-proto") || "http"
  const host = request.headers.get("host")

  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : host
      ? `${request.nextUrl.protocol}//${host}`
      : request.nextUrl.origin

  // Create a response that we can set cookies on
  const redirectUrl = code
    ? `${origin}${redirectTo}`
    : `${origin}/login?error=auth_error`

  let response = NextResponse.redirect(redirectUrl)

  if (code) {
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

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Cookies are already set on response, just return it
      return response
    }

    // If there was an error, redirect to login with error
    return NextResponse.redirect(`${origin}/login?error=auth_error`)
  }

  // Return to login page if there was no code
  return NextResponse.redirect(`${origin}/login?error=missing_code`)
}
