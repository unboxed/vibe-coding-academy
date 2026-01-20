"use client"

import * as React from "react"
import Link from "next/link"
import { ExternalLink, Github, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import type { Project, ProjectStatus } from "@/types/database"
import { PROJECT_STATUS_LABELS } from "@/types/database"
import { getInitials } from "@/lib/utils"

interface ProjectCardProps {
  project: Project
  className?: string
}

const statusColors: Record<ProjectStatus, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
}

export function ProjectCard({ project, className }: ProjectCardProps) {
  // Get the first screenshot as featured image, or use avatar
  const featuredImage = project.screenshots?.[0]?.url || project.avatar_url
  const screenshotCount = project.screenshots?.length || 0

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        className
      )}
    >
      {/* Featured Image Area */}
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-muted to-muted/50">
        {featuredImage ? (
          <img
            src={featuredImage}
            alt={project.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}

        {/* Avatar overlay */}
        {project.avatar_url && featuredImage !== project.avatar_url && (
          <div className="absolute bottom-3 left-3">
            <Avatar className="h-12 w-12 border-2 border-background shadow-lg">
              <AvatarImage src={project.avatar_url} alt={project.title} />
              <AvatarFallback>{project.title[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
        )}

        {/* Screenshot count badge */}
        {screenshotCount > 1 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs text-white">
            <ImageIcon className="h-3 w-3" />
            {screenshotCount}
          </div>
        )}

        {/* Status badge */}
        <div className="absolute right-3 top-3">
          <Badge className={cn("font-medium", statusColors[project.status])}>
            {PROJECT_STATUS_LABELS[project.status]}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4">
        {/* Author info */}
        {project.profile && (
          <Link
            href={`/people/${project.profile.id}`}
            className="mb-3 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <Avatar className="h-6 w-6">
              <AvatarImage
                src={project.profile.avatar_url || ""}
                alt={project.profile.name}
              />
              <AvatarFallback className="text-xs">
                {getInitials(project.profile.name)}
              </AvatarFallback>
            </Avatar>
            <span>{project.profile.name}</span>
          </Link>
        )}

        {/* Title */}
        <Link href={`/projects/${project.id}`}>
          <h3 className="mb-2 line-clamp-1 text-lg font-semibold transition-colors hover:text-primary">
            {project.title}
          </h3>
        </Link>

        {/* Goal/Description */}
        {(project.goal || project.description) && (
          <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
            {project.goal || project.description}
          </p>
        )}

        {/* Tech stack tags */}
        {project.tech_stack && project.tech_stack.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.tech_stack.slice(0, 4).map((tech) => (
              <Badge
                key={tech}
                variant="outline"
                className="text-xs font-normal"
              >
                {tech}
              </Badge>
            ))}
            {project.tech_stack.length > 4 && (
              <Badge variant="outline" className="text-xs font-normal">
                +{project.tech_stack.length - 4}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      {/* Footer with links */}
      <CardFooter className="gap-2 border-t p-4">
        {project.demo_url && (
          <Button variant="outline" size="sm" className="flex-1 gap-2" asChild>
            <a href={project.demo_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              Demo
            </a>
          </Button>
        )}
        {project.github_url && (
          <Button variant="outline" size="sm" className="flex-1 gap-2" asChild>
            <a
              href={project.github_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="h-4 w-4" />
              Code
            </a>
          </Button>
        )}
        {!project.demo_url && !project.github_url && project.links && (
          <Button variant="outline" size="sm" className="flex-1 gap-2" asChild>
            <a href={project.links} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              View
            </a>
          </Button>
        )}
        <Button variant="default" size="sm" className="flex-1" asChild>
          <Link href={`/projects/${project.id}`}>Details</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
