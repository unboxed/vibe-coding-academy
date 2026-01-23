import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getProfile } from "@/lib/clerk/sync-user"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RoleSelector } from "@/components/people/role-selector"
import { DeleteMemberButton } from "@/components/people/delete-member-button"
import { getInitials } from "@/lib/utils"
import { Github, MessageSquare } from "lucide-react"
import type { Profile } from "@/types/database"

export const revalidate = 60

export default async function PeoplePage() {
  const supabase = await createClient()

  // Check if current user is admin
  const currentProfile = await getProfile()
  const isAdmin = currentProfile?.role === 'admin'

  const { data: profilesData } = await supabase
    .from("profiles")
    .select("*")
    .order("name")

  const profiles = profilesData as Profile[] | null

  const { data: badgeCountsData } = await supabase
    .from("badge_awards")
    .select("user_id")

  const badgeCounts = badgeCountsData as { user_id: string }[] | null

  // Count badges per user
  const badgeCountMap = new Map<string, number>()
  badgeCounts?.forEach((award) => {
    const count = badgeCountMap.get(award.user_id) || 0
    badgeCountMap.set(award.user_id, count + 1)
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">People</h1>
        <p className="text-muted-foreground mt-2">
          Meet your fellow Vibe Coding Academy participants
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {profiles?.map((profile) => (
          <Link key={profile.id} href={`/people/${profile.id}`}>
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={profile.avatar_url || ""} alt={profile.name} />
                    <AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{profile.name}</CardTitle>
                    <CardDescription className="truncate">
                      {profile.email}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profile.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {profile.bio}
                    </p>
                  )}

                  {profile.project_idea && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Project</p>
                      <p className="text-sm line-clamp-1">{profile.project_idea}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      {profile.github_url && (
                        <Github className="h-4 w-4 text-muted-foreground" />
                      )}
                      {profile.slack_handle && (
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isAdmin ? (
                        <>
                          <RoleSelector
                            userId={profile.id}
                            currentRole={profile.role}
                            disabled={profile.id === currentProfile?.id}
                          />
                          {profile.id !== currentProfile?.id && (
                            <DeleteMemberButton
                              userId={profile.id}
                              userName={profile.name}
                            />
                          )}
                        </>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {profile.role}
                        </Badge>
                      )}
                      {badgeCountMap.get(profile.id) ? (
                        <Badge variant="outline" className="text-xs">
                          {badgeCountMap.get(profile.id)} badges
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {(!profiles || profiles.length === 0) && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No participants yet.</p>
        </div>
      )}
    </div>
  )
}
