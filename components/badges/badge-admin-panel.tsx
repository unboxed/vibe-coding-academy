'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Award, Plus, Pencil, Trash2, Gift, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { BadgeEditor } from './badge-editor'
import { AwardBadgeDialog } from './award-badge-dialog'
import type { Badge, BadgeAward, Profile } from '@/types/database'

interface BadgeAdminPanelProps {
  badges: Badge[]
  profiles: Profile[]
}

export function BadgeAdminPanel({ badges, profiles }: BadgeAdminPanelProps) {
  const router = useRouter()
  const [editingBadge, setEditingBadge] = React.useState<Badge | null>(null)
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isAwardOpen, setIsAwardOpen] = React.useState(false)
  const [deletingBadge, setDeletingBadge] = React.useState<Badge | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleDeleteBadge = async () => {
    if (!deletingBadge) return

    setIsDeleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('badges')
        .delete()
        .eq('id', deletingBadge.id)

      if (error) throw error
      router.refresh()
    } catch (err) {
      console.error('Failed to delete badge:', err)
    } finally {
      setIsDeleting(false)
      setDeletingBadge(null)
    }
  }

  const handleSuccess = () => {
    router.refresh()
  }

  return (
    <>
      <Card className="mb-6 border-dashed border-primary/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4" />
            Badge Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Badge
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsAwardOpen(true)}>
              <Gift className="mr-2 h-4 w-4" />
              Award Badge
            </Button>
          </div>

          {badges.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-muted-foreground">Quick edit badges:</p>
              <div className="flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <div
                    key={badge.id}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm text-white"
                    style={{ backgroundColor: badge.color }}
                  >
                    {badge.name}
                    <button
                      onClick={() => setEditingBadge(badge)}
                      className="ml-1 hover:bg-white/20 rounded p-0.5"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => setDeletingBadge(badge)}
                      className="hover:bg-white/20 rounded p-0.5"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Badge Dialog */}
      <BadgeEditor
        badge={null}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={handleSuccess}
      />

      {/* Edit Badge Dialog */}
      <BadgeEditor
        badge={editingBadge}
        open={!!editingBadge}
        onOpenChange={(open) => !open && setEditingBadge(null)}
        onSuccess={handleSuccess}
      />

      {/* Award Badge Dialog */}
      <AwardBadgeDialog
        badges={badges}
        profiles={profiles}
        open={isAwardOpen}
        onOpenChange={setIsAwardOpen}
        onSuccess={handleSuccess}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingBadge} onOpenChange={(open) => !open && setDeletingBadge(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Badge</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingBadge?.name}&quot;? This will also remove all
              awards of this badge. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBadge}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

interface RemoveBadgeButtonProps {
  awardId: string
}

export function RemoveBadgeButton({ awardId }: RemoveBadgeButtonProps) {
  const router = useRouter()
  const [isRemoving, setIsRemoving] = React.useState(false)

  const handleRemove = async () => {
    setIsRemoving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('badge_awards')
        .delete()
        .eq('id', awardId)

      if (error) throw error
      router.refresh()
    } catch (err) {
      console.error('Failed to remove badge:', err)
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 text-muted-foreground hover:text-destructive"
      onClick={handleRemove}
      disabled={isRemoving}
    >
      <X className="h-3 w-3" />
    </Button>
  )
}
