"use client"

import { createContext, useContext, useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/types/database"
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  authError: string | null
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  authError: null,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  // Fetch or create profile for user with timeout
  const fetchOrCreateProfile = async (authUser: User) => {
    console.log("AuthProvider: Fetching profile for user:", authUser.id)

    // Create a minimal fallback profile
    const fallbackProfile: Profile = {
      id: authUser.id,
      name: authUser.user_metadata?.name ||
            authUser.user_metadata?.full_name ||
            authUser.email?.split("@")[0] ||
            "User",
      email: authUser.email || "",
      role: "member",
      bio: null,
      avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null,
      github_url: null,
      slack_handle: null,
      project_idea: null,
      repo_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Profile fetch timeout")), 10000)
      })

      // First try to fetch existing profile
      const fetchPromise = supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single()

      const { data: existingProfileData, error: fetchError } = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]) as Awaited<typeof fetchPromise>

      const existingProfile = existingProfileData as Profile | null

      if (existingProfile) {
        console.log("AuthProvider: Found existing profile:", existingProfile.name)
        setProfile(existingProfile)
        return
      }

      // If profile doesn't exist (trigger might have failed), create it
      if (fetchError?.code === "PGRST116") {
        console.log("AuthProvider: Profile not found, creating new profile...")

        const { data: newProfileData, error: insertError } = await supabase
          .from("profiles")
          // @ts-expect-error - Supabase types not correctly inferring Insert type
          .insert({
            id: authUser.id,
            name: fallbackProfile.name,
            email: fallbackProfile.email,
            avatar_url: fallbackProfile.avatar_url,
          })
          .select()
          .single()

        const newProfile = newProfileData as Profile | null

        if (insertError) {
          console.error("AuthProvider: Failed to create profile:", insertError)
          setProfile(fallbackProfile)
        } else {
          console.log("AuthProvider: Created new profile:", newProfile?.name)
          setProfile(newProfile)
        }
      } else if (fetchError) {
        console.error("AuthProvider: Error fetching profile:", fetchError)
        setProfile(fallbackProfile)
      }
    } catch (err) {
      console.error("AuthProvider: Profile fetch failed:", err)
      // Use fallback profile so UI still works
      setProfile(fallbackProfile)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchOrCreateProfile(user)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setAuthError(null)
    router.push("/")
    router.refresh()
  }

  useEffect(() => {
    let isMounted = true

    const initAuth = async () => {
      console.log("AuthProvider: Initializing auth...")
      setAuthError(null)

      try {
        // Use getSession first (reads from cookies, no network call)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        console.log("AuthProvider: Session check:", {
          hasSession: !!session,
          userId: session?.user?.id,
          error: sessionError?.message
        })

        if (sessionError) {
          console.error("AuthProvider: Session error:", sessionError)
          setAuthError(sessionError.message)
          if (isMounted) {
            setUser(null)
            setProfile(null)
            setIsLoading(false)
          }
          return
        }

        if (session?.user) {
          if (isMounted) {
            setUser(session.user)
            // Don't let profile fetch block loading state
            fetchOrCreateProfile(session.user).catch(err => {
              console.error("AuthProvider: Profile fetch error:", err)
            })
          }
        } else {
          // No session, try getUser as fallback (makes network call)
          console.log("AuthProvider: No session, trying getUser...")

          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error("Auth timeout - Supabase may be paused or unreachable")), 15000)
          })

          try {
            const { data: { user: authUser }, error } = await Promise.race([
              supabase.auth.getUser(),
              timeoutPromise
            ])

            console.log("AuthProvider: getUser result:", { userId: authUser?.id, error: error?.message })

            if (error) {
              // AuthSessionMissingError is normal for logged-out users
              if (error.message !== "Auth session missing!") {
                console.error("AuthProvider: getUser error:", error.message)
              }
            }

            if (isMounted && authUser) {
              setUser(authUser)
              // Don't let profile fetch block loading state
              fetchOrCreateProfile(authUser).catch(err => {
                console.error("AuthProvider: Profile fetch error:", err)
              })
            }
          } catch (timeoutErr) {
            console.error("AuthProvider: Timeout getting user:", timeoutErr)
            if (isMounted) {
              setAuthError("Connection to auth server timed out. Please refresh the page.")
            }
          }
        }
      } catch (err) {
        console.error("AuthProvider: Unexpected error:", err)
        if (isMounted) {
          setAuthError(err instanceof Error ? err.message : "Authentication error")
        }
      } finally {
        console.log("AuthProvider: Setting isLoading to false")
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    // Start auth initialization
    initAuth()

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      console.log("AuthProvider: Auth state changed:", event, session?.user?.id)

      if (!isMounted) return

      setAuthError(null)

      if (session?.user) {
        setUser(session.user)
        await fetchOrCreateProfile(session.user)
      } else {
        setUser(null)
        setProfile(null)
      }
    })

    // Cleanup function
    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  return (
    <AuthContext.Provider
      value={{ user, profile, isLoading, authError, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}
