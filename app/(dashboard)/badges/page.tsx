import { createClient } from "@/lib/supabase/server"
import { getProfile } from "@/lib/clerk/sync-user"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BadgeAdminPanel } from "@/components/badges/badge-admin-panel"
import { ProjectsTable } from "@/components/badges/projects-table"
import type { Badge as BadgeType, BadgeAward, Profile, Project, ProjectFeedback } from "@/types/database"

export const revalidate = 60

export default async function LeaderboardPage() {
  const supabase = await createClient()

  // Check if current user is admin
  const currentProfile = await getProfile()
  const isAdmin = currentProfile?.role === 'admin'

  // Get all badges
  const { data: badgesData } = await supabase
    .from("badges")
    .select("*")
    .order("name")

  const badges = badgesData as BadgeType[] | null

  // Get all profiles for admin badge awarding
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("*")
    .order("name")

  const profiles = profilesData as Profile[] | null

  // Get all badge awards with details (for project badges)
  const { data: badgeAwardsData } = await supabase
    .from("badge_awards")
    .select(`
      *,
      badge:badges(*),
      profile:profiles(id, name, avatar_url)
    `)
    .order("created_at", { ascending: false })

  const badgeAwards = badgeAwardsData as BadgeAward[] | null

  // Get all projects with their owners, ordered by sort_order
  const { data: projectsData } = await supabase
    .from("projects")
    .select(`
      *,
      profile:profiles(id, name, avatar_url)
    `)
    .order("sort_order")

  // Get all project feedback with instructor info
  const { data: feedbackData } = await supabase
    .from("project_feedback")
    .select(`
      *,
      instructor:profiles(id, name, avatar_url)
    `)
    .order("created_at", { ascending: false })

  const projectFeedback = feedbackData as (ProjectFeedback & { instructor: Profile })[] | null

  // Add badge info and feedback to projects
  // Project badges are stored with project_id, owner badges are linked via user_id
  const projectsWithBadges = (projectsData || []).map((project: Project & { profile: Profile }) => {
    // Get badges directly assigned to this project
    const projectBadges = badgeAwards?.filter(a => a.project_id === project.id) || []
    // Get feedback for this project
    const feedback = projectFeedback?.filter(f => f.project_id === project.id) || []
    return {
      ...project,
      ownerBadges: projectBadges,
      feedback,
    }
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-muted-foreground mt-2">
          Projects and achievements during the programme
        </p>
      </div>

      {/* Admin Badge Management Panel */}
      {isAdmin && badges && profiles && (
        <BadgeAdminPanel badges={badges} profiles={profiles} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
          <CardDescription>
            {isAdmin
              ? "Drag to reorder projects. Click column headers to sort temporarily."
              : "Projects built by participants during the programme."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectsTable
            projects={projectsWithBadges}
            isAdmin={isAdmin}
            badges={badges || []}
          />
        </CardContent>
      </Card>
    </div>
  )
}
