import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Use default cookie handling but ensure proper settings
        get(name: string) {
          if (typeof document === "undefined") return undefined
          const cookies = document.cookie.split("; ")
          const cookie = cookies.find((c) => c.startsWith(`${name}=`))
          return cookie ? decodeURIComponent(cookie.split("=")[1]) : undefined
        },
        set(name: string, value: string, options?: { path?: string; maxAge?: number; domain?: string; sameSite?: string; secure?: boolean }) {
          if (typeof document === "undefined") return
          let cookieStr = `${name}=${encodeURIComponent(value)}`
          cookieStr += `; path=${options?.path || "/"}`
          if (options?.maxAge) cookieStr += `; max-age=${options.maxAge}`
          if (options?.sameSite) cookieStr += `; samesite=${options.sameSite}`
          // Always use secure on HTTPS
          if (window.location.protocol === "https:") cookieStr += "; secure"
          document.cookie = cookieStr
        },
        remove(name: string, options?: { path?: string }) {
          if (typeof document === "undefined") return
          document.cookie = `${name}=; path=${options?.path || "/"}; expires=Thu, 01 Jan 1970 00:00:00 GMT`
        },
      },
    }
  )
}
