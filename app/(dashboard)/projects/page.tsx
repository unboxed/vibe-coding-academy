import { Suspense } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { ProjectCard } from "@/components/projects/project-card"
import { ProjectsFilter } from "./projects-filter"
import type { Project } from "@/types/database"

export const revalidate = 60

async function getProjects() {
  const supabase = await createClient()

  const { data: projects } = await supabase
    .from("projects")
    .select(`
      *,
      profile:profiles(id, name, avatar_url)
    `)
    .order("created_at", { ascending: false })

  return (projects || []) as Project[]
}

export default async function ProjectsPage() {
  const projects = await getProjects()

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="mt-2 text-muted-foreground">
            See what everyone is building during the programme
          </p>
        </div>
        <Link href="/projects/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Projects grid with filters */}
      <Suspense fallback={<ProjectsGridSkeleton />}>
        <ProjectsFilter projects={projects} />
      </Suspense>

      {/* Empty state */}
      {projects.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No projects created yet.</p>
            <Link href="/projects/new">
              <Button className="mt-4">Create Your Project</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ProjectsGridSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <div className="aspect-video animate-pulse bg-muted" />
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            </div>
            <div className="mb-2 h-6 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
