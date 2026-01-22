import { currentUser } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'

export async function syncUserToSupabase(): Promise<Profile | null> {
  const user = await currentUser()
  if (!user) return null

  const supabase = await createAdminClient()
  const email = user.emailAddresses[0]?.emailAddress

  if (!email) return null

  // Check for existing profile by Clerk ID first
  const { data: profileById } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileById) {
    return profileById as Profile
  }

  // Check for existing profile by email (migration from Supabase Auth)
  const { data: profileByEmail } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single()

  if (profileByEmail) {
    // Migrate: Update the profile ID to Clerk ID
    // Note: This would require updating foreign keys in related tables
    // For now, just return the existing profile
    return profileByEmail as Profile
  }

  // Create new profile
  const newProfile = {
    id: user.id,
    name: [user.firstName, user.lastName].filter(Boolean).join(' ') || email.split('@')[0] || 'User',
    email: email,
    role: 'member' as const,
    avatar_url: user.imageUrl || null,
    bio: null,
    github_url: null,
    slack_handle: null,
    project_idea: null,
    repo_url: null,
  }

  const { data, error } = await supabase
    .from('profiles')
    .insert(newProfile)
    .select()
    .single()

  if (error) {
    console.error('Failed to create profile:', error)
    return null
  }

  return data as Profile
}

export async function getProfile(): Promise<Profile | null> {
  const user = await currentUser()
  if (!user) return null

  const supabase = await createAdminClient()

  // Try by Clerk ID first
  const { data: profileById } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileById) {
    return profileById as Profile
  }

  // Fallback to email lookup (for migrated users)
  const email = user.emailAddresses[0]?.emailAddress
  if (email) {
    const { data: profileByEmail } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()

    if (profileByEmail) {
      return profileByEmail as Profile
    }
  }

  return null
}

export async function getProfileWithSync(): Promise<Profile | null> {
  // Try to get existing profile first
  const profile = await getProfile()
  if (profile) return profile

  // If no profile exists, sync/create one
  return syncUserToSupabase()
}
