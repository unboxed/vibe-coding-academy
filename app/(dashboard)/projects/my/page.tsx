"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Project } from "@/types/database"

export default function MyProjectPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    goal: "",
    links: "",
  })

  useEffect(() => {
    const fetchProject = async () => {
      if (!user) return

      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (data) {
        setProject(data)
        setFormData({
          title: data.title || "",
          description: data.description || "",
          goal: data.goal || "",
          links: data.links || "",
        })
      }
      setIsLoading(false)
    }

    if (user) {
      fetchProject()
    } else if (!authLoading) {
      setIsLoading(false)
    }
  }, [user, authLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSaving(true)
    setError(null)
    setSuccess(false)

    try {
      if (project) {
        // Update existing project
        const { error } = await supabase
          .from("projects")
          .update({
            title: formData.title,
            description: formData.description || null,
            goal: formData.goal || null,
            links: formData.links || null,
          })
          .eq("id", project.id)

        if (error) throw error
      } else {
        // Create new project
        const { data, error } = await supabase
          .from("projects")
          .insert({
            user_id: user.id,
            title: formData.title,
            description: formData.description || null,
            goal: formData.goal || null,
            links: formData.links || null,
          })
          .select()
          .single()

        if (error) throw error
        setProject(data)
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save project")
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  if (!user) {
    router.push("/login?redirectTo=/projects/my")
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>{project ? "Edit Your Project" : "Create Your Project"}</CardTitle>
          <CardDescription>
            Tell us about what you're building during the programme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md">
                Project saved successfully!
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="My Awesome App"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal">Goal</Label>
              <Input
                id="goal"
                value={formData.goal}
                onChange={(e) =>
                  setFormData({ ...formData, goal: e.target.value })
                }
                placeholder="What problem are you solving?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Tell us more about your project..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="links">Project Link</Label>
              <Input
                id="links"
                type="url"
                value={formData.links}
                onChange={(e) =>
                  setFormData({ ...formData, links: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/projects")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : project ? "Update Project" : "Create Project"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
