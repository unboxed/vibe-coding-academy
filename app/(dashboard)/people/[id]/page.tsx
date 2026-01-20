import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getInitials } from "@/lib/utils"
import { Github, MessageSquare, ExternalLink, ArrowLeft } from "lucide-react"

export const revalidate = 60

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProfileDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single()

  if (!profile) {
    notFound()
  }

  // Get user's badges
  const { data: badgeAwards } = await supabase
    .from("badge_awards")
    .select(`
      *,
      badge:badges(*)
    `)
    .eq("user_id", id)
    .order("created_at", { ascending: false })

  // Get user's demos
  const { data: demos } = await supabase
    .from("demos")
    .select(`
      *,
      week:weeks(number, title)
    `)
    .eq("user_id", id)
    .order("created_at", { ascending: false })

  // Get user's project
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", id)
    .single()

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/people">
        <Button variant="ghost" size="sm" className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to People
        </Button>
      </Link>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Info */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <Avatar className="h-24 w-24 mx-auto">
              <AvatarImage src={profile.avatar_url || ""} alt={profile.name} />
              <AvatarFallback className="text-2xl">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="mt-4">{profile.name}</CardTitle>
            <CardDescription>{profile.email}</CardDescription>
            <Badge variant="secondary" className="mt-2 w-fit mx-auto">
              {profile.role}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.bio && (
              <p className="text-sm text-muted-foreground">{profile.bio}</p>
            )}

            <Separator />

            <div className="space-y-2">
              {profile.github_url && (
                <a
                  href={profile.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:underline"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {profile.slack_handle && (
                <div className="flex items-center gap-2 text-sm">
                  <MessageSquare className="h-4 w-4" />
                  {profile.slack_handle}
                </div>
              )}
              {profile.repo_url && (
                <a
                  href={profile.repo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Project Repository
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Project */}
          {(project || profile.project_idea) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project</CardTitle>
              </CardHeader>
              <CardContent>
                {project ? (
                  <div className="space-y-2">
                    <h4 className="font-medium">{project.title}</h4>
                    {project.description && (
                      <p className="text-sm text-muted-foreground">
                        {project.description}
                      </p>
                    )}
                    {project.goal && (
                      <p className="text-sm">
                        <span className="font-medium">Goal:</span> {project.goal}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {profile.project_idea}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Badges */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Badges ({badgeAwards?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {badgeAwards && badgeAwards.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {badgeAwards.map((award) => (
                    <Badge
                      key={award.id}
                      style={{ backgroundColor: award.badge?.color }}
                      className="text-white"
                    >
                      {award.badge?.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No badges yet</p>
              )}
            </CardContent>
          </Card>

          {/* Demos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Demos ({demos?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {demos && demos.length > 0 ? (
                <div className="space-y-3">
                  {demos.map((demo) => (
                    <div
                      key={demo.id}
                      className="flex items-start justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{demo.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Week {demo.week?.number}: {demo.week?.title}
                        </p>
                      </div>
                      {demo.url && (
                        <a
                          href={demo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No demos yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
