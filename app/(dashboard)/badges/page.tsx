import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getProfile } from "@/lib/clerk/sync-user"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BadgeAdminPanel, RemoveBadgeButton } from "@/components/badges/badge-admin-panel"
import { ProjectsTable } from "@/components/badges/projects-table"
import { getInitials } from "@/lib/utils"
import { Trophy, Award, Star, FolderKanban } from "lucide-react"
import type { Badge as BadgeType, BadgeAward, Profile, Project, ProjectFeedback } from "@/types/database"

export const revalidate = 60

export default async function BadgesPage() {
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

  // Get all badge awards with details
  const { data: badgeAwardsData } = await supabase
    .from("badge_awards")
    .select(`
      *,
      badge:badges(*),
      profile:profiles(id, name, avatar_url)
    `)
    .order("created_at", { ascending: false })

  const badgeAwards = badgeAwardsData as BadgeAward[] | null

  // Get all projects with their owners
  const { data: projectsData } = await supabase
    .from("projects")
    .select(`
      *,
      profile:profiles(id, name, avatar_url)
    `)
    .order("title")

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
  const projectsWithBadges = (projectsData || []).map((project: Project & { profile: Profile }) => {
    const ownerBadges = badgeAwards?.filter(a => a.user_id === project.user_id) || []
    const feedback = projectFeedback?.filter(f => f.project_id === project.id) || []
    return {
      ...project,
      ownerBadges,
      feedback,
    }
  })

  // Calculate leaderboard by badge count
  const leaderboard = new Map<string, { profile: any; badges: number; votes: number }>()

  badgeAwards?.forEach((award) => {
    const userId = award.user_id
    if (!leaderboard.has(userId)) {
      leaderboard.set(userId, {
        profile: award.profile,
        badges: 0,
        votes: 0,
      })
    }
    const entry = leaderboard.get(userId)!
    entry.badges += 1
  })

  // Get vote counts for leaderboard
  const { data: voteDataRaw } = await supabase
    .from("votes")
    .select(`
      value,
      demo:demos(user_id)
    `)

  const voteData = voteDataRaw as { value: number; demo: { user_id: string } | null }[] | null

  voteData?.forEach((vote) => {
    const userId = vote.demo?.user_id
    if (userId && leaderboard.has(userId)) {
      leaderboard.get(userId)!.votes += vote.value
    }
  })

  // Sort leaderboard by badge count, then by votes
  const sortedLeaderboard = Array.from(leaderboard.values())
    .sort((a, b) => {
      if (b.badges !== a.badges) return b.badges - a.badges
      return b.votes - a.votes
    })
    .slice(0, 20)

  // Recent awards
  const recentAwards = badgeAwards?.slice(0, 10)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Badges & Awards</h1>
        <p className="text-muted-foreground mt-2">
          Recognition for achievements during the programme
        </p>
      </div>

      {/* Admin Badge Management Panel */}
      {isAdmin && badges && profiles && (
        <BadgeAdminPanel badges={badges} profiles={profiles} />
      )}

      <Tabs defaultValue="leaderboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="leaderboard" className="gap-2">
            <Trophy className="h-4 w-4" />
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="badges" className="gap-2">
            <Award className="h-4 w-4" />
            All Badges
          </TabsTrigger>
          <TabsTrigger value="projects" className="gap-2">
            <FolderKanban className="h-4 w-4" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="recent" className="gap-2">
            <Star className="h-4 w-4" />
            Recent Awards
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>
                Ranked by badge count and community votes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sortedLeaderboard.length > 0 ? (
                <div className="space-y-4">
                  {sortedLeaderboard.map((entry, index) => (
                    <Link
                      key={entry.profile?.id}
                      href={`/people/${entry.profile?.id}`}
                    >
                      <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-bold">
                          {index + 1}
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={entry.profile?.avatar_url || ""}
                            alt={entry.profile?.name || ""}
                          />
                          <AvatarFallback>
                            {getInitials(entry.profile?.name || "?")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{entry.profile?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {entry.badges} badges • {entry.votes} votes
                          </p>
                        </div>
                        {index < 3 && (
                          <div
                            className={`text-2xl ${
                              index === 0
                                ? "text-yellow-500"
                                : index === 1
                                ? "text-gray-400"
                                : "text-amber-600"
                            }`}
                          >
                            {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No badges awarded yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="badges">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {badges?.map((badge) => {
              const awardCount = badgeAwards?.filter(
                (a) => a.badge_id === badge.id
              ).length

              return (
                <Card key={badge.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl"
                        style={{ backgroundColor: badge.color }}
                      >
                        <Award className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{badge.name}</h3>
                        {badge.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {badge.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Awarded {awardCount} times
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {(!badges || badges.length === 0) && (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No badges defined yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>All Projects</CardTitle>
              <CardDescription>
                Projects built by participants during the programme. Click column headers to sort.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectsTable projects={projectsWithBadges} isAdmin={isAdmin} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Awards</CardTitle>
              <CardDescription>Latest badges awarded to participants</CardDescription>
            </CardHeader>
            <CardContent>
              {recentAwards && recentAwards.length > 0 ? (
                <div className="space-y-4">
                  {recentAwards.map((award) => (
                    <div
                      key={award.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-muted/30"
                    >
                      <Link href={`/people/${award.profile?.id}`}>
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={award.profile?.avatar_url || ""}
                            alt={award.profile?.name || ""}
                          />
                          <AvatarFallback>
                            {getInitials(award.profile?.name || "?")}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1">
                        <p>
                          <Link
                            href={`/people/${award.profile?.id}`}
                            className="font-medium hover:underline"
                          >
                            {award.profile?.name}
                          </Link>
                          <span className="text-muted-foreground">
                            {" "}
                            earned{" "}
                          </span>
                          <Badge
                            style={{ backgroundColor: award.badge?.color }}
                            className="text-white"
                          >
                            {award.badge?.name}
                          </Badge>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(award.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {isAdmin && <RemoveBadgeButton awardId={award.id} />}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No awards yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
