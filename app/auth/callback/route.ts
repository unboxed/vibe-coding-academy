import { NextResponse } from "next/server"
import { headers, cookies } from "next/headers"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import type { Database } from "@/types/database"

type CookieToSet = { name: string; value: string; options?: CookieOptions }

// Cookie chunk size limit (4096 bytes minus some overhead for name and attributes)
const CHUNK_SIZE = 3500

function chunkString(str: string, size: number): string[] {
  const chunks: string[] = []
  for (let i = 0; i < str.length; i += size) {
    chunks.push(str.slice(i, i + size))
  }
  return chunks
}

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

  console.log("Auth callback:", { code: code ? "present" : "missing", origin, redirectTo })

  if (code) {
    const cookieStore = await cookies()
    const cookiesToSetOnResponse: CookieToSet[] = []

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: CookieToSet[]) {
            console.log("Auth callback setAll called with", cookiesToSet.length, "cookies")
            cookiesToSetOnResponse.push(...cookiesToSet)
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !data.session) {
      console.error("Auth callback error:", error)
      return NextResponse.redirect(`${origin}/login?error=auth_error`)
    }

    console.log("Auth callback: session obtained for user", data.session.user.id)

    // Force session to be set, which should trigger setAll synchronously
    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    })

    console.log("Auth callback: cookies collected:", cookiesToSetOnResponse.length)

    const response = NextResponse.redirect(`${origin}${redirectTo}`)

    // Set all collected cookies on the response
    if (cookiesToSetOnResponse.length > 0) {
      cookiesToSetOnResponse.forEach(({ name, value, options }) => {
        console.log("Auth callback: setting cookie", name)
        response.cookies.set(name, value, options)
      })
    } else {
      // Fallback: manually construct cookies
      console.log("Auth callback: no cookies collected, using fallback")
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1] || "supabase"
      const cookieName = `sb-${projectRef}-auth-token`

      response.cookies.set(`${cookieName}-code-verifier`, "", {
        path: "/",
        maxAge: 0,
      })

      const sessionData = JSON.stringify({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in,
        token_type: data.session.token_type,
        user: data.session.user,
      })

      const chunks = chunkString(sessionData, CHUNK_SIZE)
      chunks.forEach((chunk, index) => {
        const name = chunks.length === 1 ? cookieName : `${cookieName}.${index}`
        response.cookies.set(name, chunk, {
          path: "/",
          sameSite: "lax",
          httpOnly: false,
          maxAge: 34560000,
        })
      })
    }

    console.log("Auth callback: redirecting to", `${origin}${redirectTo}`)
    return response
  }

  // Return to login page if there was an error
  return NextResponse.redirect(`${origin}/login?error=auth_error`)
}
