'use client'

import * as React from 'react'
import ReactMarkdown from 'react-markdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { WeekSection } from '@/types/database'

interface WeekSectionEditorProps {
  section: WeekSection | null
  weekId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  nextSortOrder?: number
}

export function WeekSectionEditor({
  section,
  weekId,
  open,
  onOpenChange,
  onSuccess,
  nextSortOrder = 0,
}: WeekSectionEditorProps) {
  const [title, setTitle] = React.useState(section?.title || '')
  const [slug, setSlug] = React.useState(section?.slug || '')
  const [content, setContent] = React.useState(section?.content || '')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const isEditing = !!section

  React.useEffect(() => {
    if (open) {
      setTitle(section?.title || '')
      setSlug(section?.slug || '')
      setContent(section?.content || '')
      setError(null)
    }
  }, [open, section])

  // Auto-generate slug from title for new sections
  React.useEffect(() => {
    if (!isEditing && title) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      setSlug(generatedSlug)
    }
  }, [title, isEditing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !slug.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()

      if (isEditing && section) {
        const { error: updateError } = await supabase
          .from('week_sections')
          .update({
            title: title.trim(),
            slug: slug.trim(),
            content: content.trim() || null,
          } as never)
          .eq('id', section.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('week_sections')
          .insert({
            week_id: weekId,
            title: title.trim(),
            slug: slug.trim(),
            content: content.trim() || null,
            sort_order: nextSortOrder,
            is_system: false,
          } as never)

        if (insertError) throw insertError
      }

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save section')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Section' : 'Add Section'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Section title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="section-slug"
                required
                disabled={section?.is_system}
              />
              {section?.is_system && (
                <p className="text-xs text-muted-foreground">
                  System sections cannot have their slug changed
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Content (Markdown)</Label>
            <Tabs defaultValue="edit" className="w-full">
              <TabsList className="mb-2">
                <TabsTrigger value="edit">Edit</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="edit">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your content in Markdown..."
                  rows={15}
                  className="font-mono text-sm"
                />
              </TabsContent>
              <TabsContent value="preview">
                <div className="border rounded-lg p-4 min-h-[300px] prose prose-slate max-w-none">
                  {content ? (
                    <ReactMarkdown>{content}</ReactMarkdown>
                  ) : (
                    <p className="text-muted-foreground">No content to preview</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !title.trim() || !slug.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
