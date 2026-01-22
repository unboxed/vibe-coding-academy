'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'

export function useProfile() {
  const { user, isLoaded, isSignedIn } = useUser()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Try to find profile by Clerk user ID
      const { data: profileById, error: idError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileById) {
        setProfile(profileById as Profile)
        setIsLoading(false)
        return
      }

      // Fallback: try by email (for users migrated from Supabase Auth)
      const email = user.emailAddresses[0]?.emailAddress
      if (email) {
        const { data: profileByEmail } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email)
          .single()

        if (profileByEmail) {
          setProfile(profileByEmail as Profile)
          setIsLoading(false)
          return
        }
      }

      // No profile found - will be created on first server-side access
      setProfile(null)
      if (idError && idError.code !== 'PGRST116') {
        setError(idError.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn) {
      setProfile(null)
      setIsLoading(false)
      return
    }

    fetchProfile()
  }, [isLoaded, isSignedIn, fetchProfile])

  const refreshProfile = useCallback(() => {
    if (user) {
      fetchProfile()
    }
  }, [user, fetchProfile])

  return {
    user,
    profile,
    isLoading: !isLoaded || isLoading,
    isSignedIn: !!isSignedIn,
    error,
    refreshProfile,
  }
}
