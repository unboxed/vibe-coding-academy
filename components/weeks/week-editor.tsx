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
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
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
  const [number, setNumber] = React.useState(week?.number || 1)
  const [title, setTitle] = React.useState(week?.title || '')
  const [level, setLevel] = React.useState(week?.level || 1)
  const [published, setPublished] = React.useState(week?.published || false)
  const [feedbackUrl, setFeedbackUrl] = React.useState(week?.feedback_url || '')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const isEditing = !!week

  // Available week numbers (1-10, excluding already used ones)
  const availableNumbers = React.useMemo(() => {
    const all = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    if (isEditing) {
      return all // When editing, show all numbers
    }
    return all.filter(n => !existingWeekNumbers.includes(n))
  }, [existingWeekNumbers, isEditing])

  React.useEffect(() => {
    if (open) {
      setNumber(week?.number || (availableNumbers[0] || 1))
      setTitle(week?.title || '')
      setLevel(week?.level || 1)
      setPublished(week?.published || false)
      setFeedbackUrl(week?.feedback_url || '')
      setError(null)
    }
  }, [open, week, availableNumbers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()

      if (isEditing && week) {
        const { error: updateError } = await supabase
          .from('weeks')
          .update({
            number,
            title: title.trim(),
            level,
            published,
            feedback_url: feedbackUrl.trim() || null,
          } as never)
          .eq('id', week.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('weeks')
          .insert({
            number,
            title: title.trim(),
            level,
            published,
            feedback_url: feedbackUrl.trim() || null,
          } as never)

        if (insertError) throw insertError
      }

      onSuccess()
      onOpenChange(false)
      router.refresh()
    } catch (err: unknown) {
      console.error('Week save error:', err)
      const supabaseError = err as { message?: string; code?: string }
      if (supabaseError.code === '23505') {
        setError('A week with this number already exists.')
      } else if (supabaseError.code === '42501') {
        setError('Permission denied. Only admins can create/edit weeks.')
      } else if (supabaseError.message) {
        setError(supabaseError.message)
      } else {
        setError('Failed to save week.')
      }
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
              <Label htmlFor="number">Week Number *</Label>
              <Select
                value={number.toString()}
                onValueChange={(value) => setNumber(parseInt(value))}
                disabled={isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select week" />
                </SelectTrigger>
                <SelectContent>
                  {(isEditing ? [week?.number] : availableNumbers).map((n) => (
                    <SelectItem key={n} value={n!.toString()}>
                      Week {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isEditing && (
                <p className="text-xs text-muted-foreground">
                  Week number cannot be changed
                </p>
              )}
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
