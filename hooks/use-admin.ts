'use client'

import { useProfile } from './use-profile'

export function useAdmin() {
  const { user, profile, isLoading, isSignedIn, error, refreshProfile } = useProfile()

  return {
    user,
    profile,
    isAdmin: profile?.role === 'admin',
    isLoading,
    isSignedIn,
    error,
    refreshProfile,
  }
}
