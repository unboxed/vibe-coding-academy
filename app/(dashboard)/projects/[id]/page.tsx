import { notFound } from "next/navigation"
import Link from "next/link"
import { currentUser } from "@clerk/nextjs/server"
import { createAdminClient } from "@/lib/supabase/server"
import { getProfile } from "@/lib/clerk/sync-user"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScreenshotGallery } from "@/components/projects/screenshot-gallery"
import { ArrowLeft, ExternalLink, Github, Calendar, Pencil } from "lucide-react"
import { getInitials } from "@/lib/utils"
import { PROJECT_STATUS_LABELS, type ProjectStatus, type Project } from "@/types/database"
import { ProjectActions } from "./project-actions"

export const revalidate = 60

const statusColors: Record<ProjectStatus, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
}

interface ProjectPageProps {
  params: { id: string }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const supabase = await createAdminClient()

  const { data: projectData } = await supabase
    .from("projects")
    .select(`
      *,
      profile:profiles(id, name, avatar_url, bio)
    `)
    .eq("id", params.id)
    .single()

  const project = projectData as Project | null

  if (!project) {
    notFound()
  }

  // Get current user to check ownership and admin status
  const user = await currentUser()
  const profile = await getProfile()
  const isOwner = user?.id === project.user_id
  const isAdmin = profile?.role === 'admin'
  const canEdit = isOwner || isAdmin

  // Get other projects by same user
  const { data: otherProjectsData } = await supabase
    .from("projects")
    .select("id, title, avatar_url, status")
    .eq("user_id", project.user_id)
    .neq("id", project.id)
    .limit(3)

  const otherProjects = otherProjectsData as Pick<Project, "id" | "title" | "avatar_url" | "status">[] | null

  const createdAt = new Date(project.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Back link */}
      <Link
        href="/projects"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-8 lg:col-span-2">
          {/* Screenshots */}
          {project.screenshots && project.screenshots.length > 0 && (
            <ScreenshotGallery screenshots={project.screenshots} />
          )}

          {/* Project header */}
          <div>
            <div className="mb-4 flex items-start gap-4">
              {project.avatar_url && (
                <Avatar className="h-16 w-16 rounded-lg">
                  <AvatarImage src={project.avatar_url} alt={project.title} />
                  <AvatarFallback className="rounded-lg text-lg">
                    {project.title[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">{project.title}</h1>
                  <Badge className={statusColors[project.status as ProjectStatus]}>
                    {PROJECT_STATUS_LABELS[project.status as ProjectStatus]}
                  </Badge>
                </div>
                {project.goal && (
                  <p className="mt-2 text-lg text-muted-foreground">
                    {project.goal}
                  </p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              {project.demo_url && (
                <Button asChild>
                  <a
                    href={project.demo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Live Demo
                  </a>
                </Button>
              )}
              {project.github_url && (
                <Button variant="outline" asChild>
                  <a
                    href={project.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="mr-2 h-4 w-4" />
                    View Code
                  </a>
                </Button>
              )}
              {canEdit && (
                <Button variant="outline" asChild>
                  <Link href={`/projects/${project.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Tech stack */}
          {project.tech_stack && project.tech_stack.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold">Tech Stack</h2>
              <div className="flex flex-wrap gap-2">
                {project.tech_stack.map((tech: string) => (
                  <Badge key={tech} variant="secondary" className="text-sm">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {project.description && (
            <div>
              <h2 className="mb-3 text-lg font-semibold">About</h2>
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{project.description}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Author card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Created by</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/people/${project.profile?.id}`}
                className="flex items-center gap-3 hover:opacity-80"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={project.profile?.avatar_url || ""}
                    alt={project.profile?.name || ""}
                  />
                  <AvatarFallback>
                    {getInitials(project.profile?.name || "?")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{project.profile?.name}</p>
                  <p className="text-sm text-muted-foreground">View profile</p>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Project info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Created {createdAt}</span>
              </div>
              {project.screenshots && project.screenshots.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {project.screenshots.length} screenshot
                  {project.screenshots.length !== 1 ? "s" : ""}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Other projects by same user */}
          {otherProjects && otherProjects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  More from {project.profile?.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {otherProjects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted"
                  >
                    <Avatar className="h-10 w-10 rounded-lg">
                      {p.avatar_url ? (
                        <AvatarImage src={p.avatar_url} alt={p.title} />
                      ) : null}
                      <AvatarFallback className="rounded-lg text-xs">
                        {p.title[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 truncate">
                      <p className="truncate font-medium">{p.title}</p>
                      <Badge
                        variant="outline"
                        className="mt-1 text-xs font-normal"
                      >
                        {PROJECT_STATUS_LABELS[p.status as ProjectStatus]}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Owner/Admin actions */}
          {canEdit && <ProjectActions projectId={project.id} />}
        </div>
      </div>
    </div>
  )
}
