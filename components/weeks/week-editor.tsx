'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, X } from 'lucide-react'
import { createWeek, updateWeek } from '@/app/actions/admin'
import type { Week } from '@/types/database'

interface WeekEditorProps {
  week?: Week | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  existingWeekNumbers?: number[]
}

export function WeekEditor({ week, open, onOpenChange, onSuccess, existingWeekNumbers = [] }: WeekEditorProps) {
  const router = useRouter()
  const [number, setNumber] = React.useState<number | null>(week?.number ?? null)
  const [title, setTitle] = React.useState(week?.title || '')
  const [level, setLevel] = React.useState(week?.level || 1)
  const [published, setPublished] = React.useState(week?.published || false)
  const [feedbackUrl, setFeedbackUrl] = React.useState(week?.feedback_url || '')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const isEditing = !!week

  // All week numbers 1-10
  const allNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  React.useEffect(() => {
    if (open) {
      if (isEditing && week) {
        setNumber(week.number)
        setTitle(week.title)
        setLevel(week.level)
        setPublished(week.published)
        setFeedbackUrl(week.feedback_url || '')
      } else {
        // Start with no number assigned (optional tag)
        setNumber(null)
        setTitle('')
        setLevel(1)
        setPublished(false)
        setFeedbackUrl('')
      }
      setError(null)
    }
  }, [open, week, isEditing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      if (isEditing && week) {
        await updateWeek(week.id, {
          number,
          title: title.trim(),
          level,
          published,
          feedback_url: feedbackUrl.trim() || null,
        })
      } else {
        await createWeek({
          number,
          title: title.trim(),
          level,
          published,
          feedback_url: feedbackUrl.trim() || undefined,
        })
      }

      onSuccess()
      onOpenChange(false)
      router.refresh()
    } catch (err) {
      console.error('Week save error:', err)
      setError(err instanceof Error ? err.message : 'Failed to save week')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Week' : 'Create Week'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="number">Week Number</Label>
              <div className="flex gap-2">
                <Select
                  value={number?.toString() || 'none'}
                  onValueChange={(value) => setNumber(value === 'none' ? null : parseInt(value))}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="No number" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No number</SelectItem>
                    {allNumbers.map((n) => {
                      const exists = existingWeekNumbers.includes(n)
                      const isCurrent = week?.number === n
                      return (
                        <SelectItem
                          key={n}
                          value={n.toString()}
                          disabled={exists && !isCurrent}
                        >
                          Week {n}{exists && !isCurrent ? ' (taken)' : ''}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                {number !== null && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setNumber(null)}
                    title="Clear number"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Optional - assign a week number as a tag
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Level *</Label>
              <Select
                value={level.toString()}
                onValueChange={(value) => setLevel(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Level 1 - Foundation</SelectItem>
                  <SelectItem value="2">Level 2 - Intermediate</SelectItem>
                  <SelectItem value="3">Level 3 - Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Week title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedbackUrl">Feedback URL</Label>
            <Input
              id="feedbackUrl"
              type="url"
              value={feedbackUrl}
              onChange={(e) => setFeedbackUrl(e.target.value)}
              placeholder="https://forms.google.com/..."
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="published"
              checked={published}
              onCheckedChange={setPublished}
            />
            <Label htmlFor="published">Published</Label>
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
            <Button type="submit" disabled={isSubmitting || !title.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
