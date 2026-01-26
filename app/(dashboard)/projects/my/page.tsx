"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, ExternalLink, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useProfile } from "@/hooks/use-profile"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Project, ProjectStatus } from "@/types/database"
import { PROJECT_STATUS_LABELS } from "@/types/database"

const statusColors: Record<ProjectStatus, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
}

export default function MyProjectsPage() {
  const { user, isLoading: authLoading } = useProfile()
  const router = useRouter()

  const [projects, setProjects] = React.useState<Project[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [deleteProject, setDeleteProject] = React.useState<Project | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Fetch user's projects
  React.useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return

      const supabase = createClient()
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (data) {
        setProjects(data as Project[])
      }
      setIsLoading(false)
    }

    if (user) {
      fetchProjects()
    } else if (!authLoading) {
      setIsLoading(false)
    }
  }, [user, authLoading])

  // Note: Auth redirect handled by middleware - no need for client-side redirect

  const handleDelete = async () => {
    if (!deleteProject) return

    setIsDeleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", deleteProject.id)

      if (error) throw error

      setProjects((prev) => prev.filter((p) => p.id !== deleteProject.id))
      setDeleteProject(null)
    } catch (error) {
      console.error("Failed to delete project:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto flex items-center justify-center px-4 py-16">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your project portfolio
          </p>
        </div>
        <Link href="/projects/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Projects grid */}
      {projects.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="overflow-hidden">
              {/* Image */}
              <div className="relative aspect-video bg-gradient-to-br from-muted to-muted/50">
                {project.screenshots?.[0]?.url || project.avatar_url ? (
                  <img
                    src={project.screenshots?.[0]?.url || project.avatar_url || ""}
                    alt={project.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="text-2xl">
                        {project.title[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}
                <div className="absolute right-2 top-2">
                  <Badge className={statusColors[project.status]}>
                    {PROJECT_STATUS_LABELS[project.status]}
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <CardContent className="p-4">
                <Link
                  href={`/projects/${project.id}`}
                  className="text-lg font-semibold hover:text-primary"
                >
                  {project.title}
                </Link>
                {project.goal && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {project.goal}
                  </p>
                )}
                {project.tech_stack && project.tech_stack.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {project.tech_stack.slice(0, 3).map((tech) => (
                      <Badge
                        key={tech}
                        variant="outline"
                        className="text-xs font-normal"
                      >
                        {tech}
                      </Badge>
                    ))}
                    {project.tech_stack.length > 3 && (
                      <Badge variant="outline" className="text-xs font-normal">
                        +{project.tech_stack.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>

              {/* Actions */}
              <CardFooter className="gap-2 border-t p-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2"
                  asChild
                >
                  <Link href={`/projects/${project.id}`}>
                    <ExternalLink className="h-4 w-4" />
                    View
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2"
                  asChild
                >
                  <Link href={`/projects/${project.id}/edit`}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => setDeleteProject(project)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">No projects yet</h2>
            <p className="mb-6 text-muted-foreground">
              Create your first project to showcase your work
            </p>
            <Link href="/projects/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Project
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteProject !== null}
        onOpenChange={(open) => !open && setDeleteProject(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteProject?.title}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteProject(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
