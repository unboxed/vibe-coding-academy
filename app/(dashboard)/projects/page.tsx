import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getInitials } from "@/lib/utils"
import { Github, ExternalLink } from "lucide-react"

export const revalidate = 60

export default async function ProjectsPage() {
  const supabase = await createClient()

  const { data: projects } = await supabase
    .from("projects")
    .select(`
      *,
      profile:profiles(id, name, avatar_url)
    `)
    .order("created_at", { ascending: false })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        <p className="text-muted-foreground mt-2">
          See what everyone is building during the programme
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects?.map((project) => (
          <Card key={project.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={project.profile?.avatar_url || ""}
                    alt={project.profile?.name || ""}
                  />
                  <AvatarFallback>
                    {getInitials(project.profile?.name || "?")}
                  </AvatarFallback>
                </Avatar>
                <Link
                  href={`/people/${project.profile?.id}`}
                  className="text-sm font-medium hover:underline"
                >
                  {project.profile?.name}
                </Link>
              </div>
              <CardTitle className="text-lg">{project.title}</CardTitle>
              {project.goal && (
                <CardDescription>{project.goal}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex-1">
              {project.description && (
                <p className="text-sm text-muted-foreground mb-4">
                  {project.description}
                </p>
              )}
              {project.links && (
                <div className="flex gap-2">
                  <a
                    href={project.links}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      View
                    </Button>
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {(!projects || projects.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No projects created yet.</p>
            <Link href="/projects/my">
              <Button className="mt-4">Create Your Project</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
