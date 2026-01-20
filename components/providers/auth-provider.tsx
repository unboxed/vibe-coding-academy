"use client"

import { createContext, useContext, useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/types/database"
import type { User } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
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
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()
    setProfile(data)
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    router.push("/")
    router.refresh()
  }

  useEffect(() => {
    let isMounted = true

    const getUser = async () => {
      console.log("AuthProvider: Starting to get user...")

      // Create a timeout promise (5 second timeout)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Auth timeout - took too long")), 5000)
      })

      try {
        // Race between getUser and timeout
        const { data: { user }, error } = await Promise.race([
          supabase.auth.getUser(),
          timeoutPromise
        ])

        console.log("AuthProvider: Got user result:", { user: user?.id, error: error?.message })

        if (!isMounted) return

        if (error) {
          console.error("Auth error:", error.message)
        }
        setUser(user)
        if (user) {
          await fetchProfile(user.id)
        }
      } catch (err) {
        console.error("Failed to get user:", err)
        if (isMounted) {
          setUser(null)
        }
      } finally {
        console.log("AuthProvider: Setting isLoading to false")
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    // Start getting user
    getUser()

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_: unknown, session: { user: User | null } | null) => {
      if (!isMounted) return
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
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
      value={{ user, profile, isLoading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}
