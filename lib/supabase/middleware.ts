import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

type CookieToSet = { name: string; value: string; options?: CookieOptions }

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refreshing the auth token
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes that require authentication
  const protectedPaths = [
    "/profile",
    "/projects",
    "/admin",
  ]

  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("redirectTo", request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Admin routes require admin or facilitator role
  if (request.nextUrl.pathname.startsWith("/admin") && user) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    const profile = profileData as { role: string } | null

    if (!profile || !["admin", "facilitator"].includes(profile.role)) {
      const url = request.nextUrl.clone()
      url.pathname = "/"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
