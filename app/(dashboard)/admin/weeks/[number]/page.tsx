"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft } from "lucide-react"
import type { Week } from "@/types/database"

interface Props {
  params: Promise<{ number: string }>
}

export default function EditWeekPage({ params }: Props) {
  const { number } = use(params)
  const weekNumber = parseInt(number)
  const router = useRouter()
  const supabase = createClient()

  const [week, setWeek] = useState<Week | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    overview: "",
    prework: "",
    session_plan: "",
    prompts: "",
    resources: "",
    feedback_url: "",
    published: false,
  })

  useEffect(() => {
    const fetchWeek = async () => {
      const { data } = await supabase
        .from("weeks")
        .select("*")
        .eq("number", weekNumber)
        .single()

      if (data) {
        const weekData = data as Week
        setWeek(weekData)
        setFormData({
          title: weekData.title || "",
          overview: weekData.overview || "",
          prework: weekData.prework || "",
          session_plan: weekData.session_plan || "",
          prompts: weekData.prompts || "",
          resources: weekData.resources || "",
          feedback_url: weekData.feedback_url || "",
          published: weekData.published,
        })
      }
      setIsLoading(false)
    }

    fetchWeek()
  }, [weekNumber])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!week) return

    setIsSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const { error } = await supabase
        .from("weeks")
        // @ts-expect-error - Supabase types not correctly inferring Update type
        .update({
          title: formData.title,
          overview: formData.overview || null,
          prework: formData.prework || null,
          session_plan: formData.session_plan || null,
          prompts: formData.prompts || null,
          resources: formData.resources || null,
          feedback_url: formData.feedback_url || null,
          published: formData.published,
        })
        .eq("id", week.id)

      if (error) throw error

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  if (!week) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Week not found</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/weeks">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Weeks
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Week {weekNumber}</CardTitle>
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
                Saved successfully!
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label htmlFor="published">Published</Label>
              <Switch
                id="published"
                checked={formData.published}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, published: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="overview">Overview (Markdown)</Label>
              <Textarea
                id="overview"
                value={formData.overview}
                onChange={(e) =>
                  setFormData({ ...formData, overview: e.target.value })
                }
                rows={8}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prework">Pre-work (Markdown)</Label>
              <Textarea
                id="prework"
                value={formData.prework}
                onChange={(e) =>
                  setFormData({ ...formData, prework: e.target.value })
                }
                rows={6}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="session_plan">Session Plan (Markdown)</Label>
              <Textarea
                id="session_plan"
                value={formData.session_plan}
                onChange={(e) =>
                  setFormData({ ...formData, session_plan: e.target.value })
                }
                rows={6}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompts">Prompts (Markdown)</Label>
              <Textarea
                id="prompts"
                value={formData.prompts}
                onChange={(e) =>
                  setFormData({ ...formData, prompts: e.target.value })
                }
                rows={8}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resources">Resources (Markdown)</Label>
              <Textarea
                id="resources"
                value={formData.resources}
                onChange={(e) =>
                  setFormData({ ...formData, resources: e.target.value })
                }
                rows={4}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback_url">Feedback URL</Label>
              <Input
                id="feedback_url"
                type="url"
                value={formData.feedback_url}
                onChange={(e) =>
                  setFormData({ ...formData, feedback_url: e.target.value })
                }
                placeholder="https://forms.google.com/..."
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/weeks")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
