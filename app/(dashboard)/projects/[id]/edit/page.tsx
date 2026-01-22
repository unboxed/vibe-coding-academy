"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useProfile } from "@/hooks/use-profile"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ImageUpload } from "@/components/ui/image-upload"
import { MultiImageUpload } from "@/components/ui/multi-image-upload"
import { TagInput } from "@/components/ui/tag-input"
import {
  uploadProjectAvatar,
  uploadProjectScreenshot,
  deleteProjectImage,
  getPathFromUrl,
} from "@/lib/storage"
import type { Project, ProjectStatus, ProjectScreenshot } from "@/types/database"
import { PROJECT_STATUS_LABELS } from "@/types/database"

interface FormData {
  title: string
  goal: string
  description: string
  demo_url: string
  github_url: string
  status: ProjectStatus
  tech_stack: string[]
  avatar_url: string | null
  screenshots: ProjectScreenshot[]
}

export default function EditProjectPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const { user } = useProfile()

  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [project, setProject] = React.useState<Project | null>(null)

  const [formData, setFormData] = React.useState<FormData>({
    title: "",
    goal: "",
    description: "",
    demo_url: "",
    github_url: "",
    status: "draft",
    tech_stack: [],
    avatar_url: null,
    screenshots: [],
  })

  // Load project data
  React.useEffect(() => {
    const loadProject = async () => {
      if (!user) return

      const supabase = createClient()
      const { data: projectData, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single()

      const data = projectData as Project | null

      if (error || !data) {
        router.push("/projects")
        return
      }

      // Check ownership
      if (data.user_id !== user.id) {
        router.push(`/projects/${projectId}`)
        return
      }

      setProject(data)
      setFormData({
        title: data.title,
        goal: data.goal || "",
        description: data.description || "",
        demo_url: data.demo_url || "",
        github_url: data.github_url || "",
        status: data.status || "draft",
        tech_stack: data.tech_stack || [],
        avatar_url: data.avatar_url,
        screenshots: data.screenshots || [],
      })
      setIsLoading(false)
    }

    loadProject()
  }, [user, projectId, router])

  // Note: Auth redirect handled by middleware - no need for client-side redirect

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !project) return

    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase
        .from("projects")
        // @ts-expect-error - Supabase types not correctly inferring Update type
        .update({
          title: formData.title,
          goal: formData.goal || null,
          description: formData.description || null,
          demo_url: formData.demo_url || null,
          github_url: formData.github_url || null,
          status: formData.status,
          tech_stack: formData.tech_stack,
          avatar_url: formData.avatar_url,
          screenshots: formData.screenshots,
        })
        .eq("id", projectId)

      if (updateError) {
        throw updateError
      }

      router.push(`/projects/${projectId}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update project")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAvatarUpload = async (file: File): Promise<string> => {
    if (!user) throw new Error("Not authenticated")
    const result = await uploadProjectAvatar(user.id, projectId, file)
    return result.url
  }

  const handleScreenshotUpload = async (
    file: File,
    order: number
  ): Promise<string> => {
    if (!user) throw new Error("Not authenticated")
    const result = await uploadProjectScreenshot(user.id, projectId, file, order)
    return result.url
  }

  const handleScreenshotDelete = async (url: string): Promise<void> => {
    const path = getPathFromUrl(url)
    if (path) {
      await deleteProjectImage(path)
    }
  }

  if (isLoading || !user) {
    return (
      <div className="container mx-auto flex items-center justify-center px-4 py-16">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/projects/${projectId}`}
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Project
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Edit Project</h1>
        <p className="mt-2 text-muted-foreground">
          Update your project details
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Project Avatar */}
            <div className="space-y-2">
              <Label>Project Logo / Avatar</Label>
              <ImageUpload
                value={formData.avatar_url || undefined}
                onChange={(url) =>
                  setFormData((prev) => ({ ...prev, avatar_url: url }))
                }
                onUpload={handleAvatarUpload}
                aspectRatio="square"
                placeholder="Upload project logo"
                className="max-w-[200px]"
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="My Awesome Project"
                required
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: value as ProjectStatus,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Goal */}
            <div className="space-y-2">
              <Label htmlFor="goal">Goal / Tagline</Label>
              <Input
                id="goal"
                value={formData.goal}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, goal: e.target.value }))
                }
                placeholder="What problem are you solving?"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Tell us more about your project..."
                rows={4}
              />
            </div>

            {/* Tech Stack */}
            <div className="space-y-2">
              <Label>Tech Stack</Label>
              <TagInput
                value={formData.tech_stack}
                onChange={(tags) =>
                  setFormData((prev) => ({ ...prev, tech_stack: tags }))
                }
                placeholder="Add technologies..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Links */}
        <Card>
          <CardHeader>
            <CardTitle>Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="demo_url">Live Demo URL</Label>
              <Input
                id="demo_url"
                type="url"
                value={formData.demo_url}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, demo_url: e.target.value }))
                }
                placeholder="https://myproject.vercel.app"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="github_url">GitHub Repository</Label>
              <Input
                id="github_url"
                type="url"
                value={formData.github_url}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    github_url: e.target.value,
                  }))
                }
                placeholder="https://github.com/username/repo"
              />
            </div>
          </CardContent>
        </Card>

        {/* Screenshots */}
        <Card>
          <CardHeader>
            <CardTitle>Screenshots</CardTitle>
          </CardHeader>
          <CardContent>
            <MultiImageUpload
              value={formData.screenshots}
              onChange={(screenshots) =>
                setFormData((prev) => ({ ...prev, screenshots }))
              }
              onUpload={handleScreenshotUpload}
              onDelete={handleScreenshotDelete}
              maxImages={10}
            />
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting || !formData.title}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/projects/${projectId}`)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
