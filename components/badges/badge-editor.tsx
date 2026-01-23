'use client'

import * as React from 'react'
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
import { Loader2 } from 'lucide-react'
import { createBadge, updateBadge } from '@/app/actions/admin'
import type { Badge } from '@/types/database'

interface BadgeEditorProps {
  badge?: Badge | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
]

export function BadgeEditor({ badge, open, onOpenChange, onSuccess }: BadgeEditorProps) {
  const [name, setName] = React.useState(badge?.name || '')
  const [description, setDescription] = React.useState(badge?.description || '')
  const [color, setColor] = React.useState(badge?.color || DEFAULT_COLORS[0])
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const isEditing = !!badge

  React.useEffect(() => {
    if (open) {
      setName(badge?.name || '')
      setDescription(badge?.description || '')
      setColor(badge?.color || DEFAULT_COLORS[0])
      setError(null)
    }
  }, [open, badge])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      if (isEditing && badge) {
        await updateBadge(badge.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          color,
        })
      } else {
        await createBadge({
          name: name.trim(),
          description: description.trim() || undefined,
          color,
        })
      }

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      console.error('Badge save error:', err)
      setError(err instanceof Error ? err.message : 'Failed to save badge')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Badge' : 'Create Badge'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Badge name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this badge awarded for?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === c ? 'ring-2 ring-offset-2 ring-primary' : ''
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
            <Input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-20 h-8 p-0 border-0"
            />
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
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
