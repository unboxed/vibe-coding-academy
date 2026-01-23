'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/clerk/sync-user'
import { revalidatePath } from 'next/cache'

// Helper to check if current user is admin
async function requireAdmin() {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required')
  }
  return profile
}

// ===================
// Badge Operations
// ===================

export async function createBadge(data: { name: string; description?: string; color: string }) {
  await requireAdmin()
  const supabase = await createAdminClient()

  const { data: badge, error } = await supabase
    .from('badges')
    .insert({
      name: data.name,
      description: data.description || null,
      color: data.color,
    } as never)
    .select()
    .single()

  if (error) {
    console.error('Create badge error:', error)
    throw new Error(error.message)
  }

  revalidatePath('/badges')
  return badge
}

export async function updateBadge(id: string, data: { name: string; description?: string; color: string }) {
  await requireAdmin()
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('badges')
    .update({
      name: data.name,
      description: data.description || null,
      color: data.color,
    } as never)
    .eq('id', id)

  if (error) {
    console.error('Update badge error:', error)
    throw new Error(error.message)
  }

  revalidatePath('/badges')
}

export async function deleteBadge(id: string) {
  await requireAdmin()
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('badges')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Delete badge error:', error)
    throw new Error(error.message)
  }

  revalidatePath('/badges')
}

export async function awardBadge(data: { badge_id: string; user_id: string }) {
  const profile = await requireAdmin()
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('badge_awards')
    .insert({
      badge_id: data.badge_id,
      user_id: data.user_id,
      awarded_by: profile.id,
    } as never)

  if (error) {
    console.error('Award badge error:', error)
    throw new Error(error.message)
  }

  revalidatePath('/badges')
  revalidatePath('/people')
}

export async function removeBadgeAward(awardId: string) {
  await requireAdmin()
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('badge_awards')
    .delete()
    .eq('id', awardId)

  if (error) {
    console.error('Remove badge award error:', error)
    throw new Error(error.message)
  }

  revalidatePath('/badges')
  revalidatePath('/people')
}

// ===================
// Week Operations
// ===================

export async function createWeek(data: {
  number: number | null
  title: string
  level: number
  published: boolean
  feedback_url?: string
}) {
  await requireAdmin()
  const supabase = await createAdminClient()

  const { data: week, error } = await supabase
    .from('weeks')
    .insert({
      number: data.number,
      title: data.title,
      level: data.level,
      published: data.published,
      feedback_url: data.feedback_url || null,
    } as never)
    .select()
    .single()

  if (error) {
    console.error('Create week error:', error)
    if (error.code === '23505') {
      throw new Error('A week with this number already exists')
    }
    throw new Error(error.message)
  }

  revalidatePath('/weeks')
  return week
}

export async function updateWeek(id: string, data: {
  number?: number | null
  title?: string
  level?: number
  published?: boolean
  feedback_url?: string | null
}) {
  await requireAdmin()
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('weeks')
    .update(data as never)
    .eq('id', id)

  if (error) {
    console.error('Update week error:', error)
    throw new Error(error.message)
  }

  revalidatePath('/weeks')
}

export async function deleteWeek(id: string) {
  await requireAdmin()
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('weeks')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Delete week error:', error)
    throw new Error(error.message)
  }

  revalidatePath('/weeks')
}

// ===================
// Week Section Operations
// ===================

export async function createSection(data: {
  week_id: string
  title: string
  slug: string
  content?: string
  sort_order: number
}) {
  await requireAdmin()
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('week_sections')
    .insert({
      week_id: data.week_id,
      title: data.title,
      slug: data.slug,
      content: data.content || null,
      sort_order: data.sort_order,
      is_system: false,
    } as never)

  if (error) {
    console.error('Create section error:', error)
    throw new Error(error.message)
  }

  revalidatePath('/weeks')
}

export async function updateSection(id: string, data: {
  title?: string
  slug?: string
  content?: string | null
}) {
  await requireAdmin()
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('week_sections')
    .update(data as never)
    .eq('id', id)

  if (error) {
    console.error('Update section error:', error)
    throw new Error(error.message)
  }

  revalidatePath('/weeks')
}

export async function deleteSection(id: string) {
  await requireAdmin()
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('week_sections')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Delete section error:', error)
    throw new Error(error.message)
  }

  revalidatePath('/weeks')
}

// ===================
// Profile Operations
// ===================

export async function updateProfileRole(userId: string, role: 'admin' | 'member') {
  await requireAdmin()
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('profiles')
    .update({ role } as never)
    .eq('id', userId)

  if (error) {
    console.error('Update profile role error:', error)
    throw new Error(error.message)
  }

  revalidatePath('/people')
}

export async function deleteProfile(userId: string) {
  await requireAdmin()
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId)

  if (error) {
    console.error('Delete profile error:', error)
    throw new Error(error.message)
  }

  revalidatePath('/people')
}

// ===================
// Project Feedback Operations
// ===================

export async function addProjectFeedback(projectId: string, content: string) {
  const profile = await requireAdmin()
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('project_feedback')
    .insert({
      project_id: projectId,
      instructor_id: profile.id,
      content,
    } as never)

  if (error) {
    console.error('Add project feedback error:', error)
    throw new Error(error.message)
  }

  revalidatePath('/badges')
  revalidatePath('/projects')
}

export async function updateProjectFeedback(feedbackId: string, content: string) {
  await requireAdmin()
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('project_feedback')
    .update({ content } as never)
    .eq('id', feedbackId)

  if (error) {
    console.error('Update project feedback error:', error)
    throw new Error(error.message)
  }

  revalidatePath('/badges')
  revalidatePath('/projects')
}

export async function deleteProjectFeedback(feedbackId: string) {
  await requireAdmin()
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('project_feedback')
    .delete()
    .eq('id', feedbackId)

  if (error) {
    console.error('Delete project feedback error:', error)
    throw new Error(error.message)
  }

  revalidatePath('/badges')
  revalidatePath('/projects')
}

// ===================
// Project Operations
// ===================

export async function reorderProjects(projectIds: string[]) {
  await requireAdmin()
  const supabase = await createAdminClient()

  // Update sort_order for each project based on array position
  for (let i = 0; i < projectIds.length; i++) {
    const { error } = await supabase
      .from('projects')
      .update({ sort_order: i } as never)
      .eq('id', projectIds[i])

    if (error) {
      console.error('Reorder projects error:', error)
      throw new Error(error.message)
    }
  }

  revalidatePath('/badges')
}

export async function awardBadgeToProject(data: { badge_id: string; project_id: string }) {
  const profile = await requireAdmin()
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('badge_awards')
    .insert({
      badge_id: data.badge_id,
      project_id: data.project_id,
      awarded_by: profile.id,
    } as never)

  if (error) {
    console.error('Award badge to project error:', error)
    throw new Error(error.message)
  }

  revalidatePath('/badges')
}

export async function removeBadgeFromProject(awardId: string) {
  await requireAdmin()
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('badge_awards')
    .delete()
    .eq('id', awardId)

  if (error) {
    console.error('Remove badge from project error:', error)
    throw new Error(error.message)
  }

  revalidatePath('/badges')
}
