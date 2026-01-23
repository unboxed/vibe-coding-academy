'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Award } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@clerk/nextjs'
import { getInitials } from '@/lib/utils'
import type { Badge, Profile } from '@/types/database'

interface AwardBadgeDialogProps {
  badges: Badge[]
  profiles: Profile[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AwardBadgeDialog({
  badges,
  profiles,
  open,
  onOpenChange,
  onSuccess,
}: AwardBadgeDialogProps) {
  const { user } = useUser()
  const [selectedBadge, setSelectedBadge] = React.useState<string>('')
  const [selectedUser, setSelectedUser] = React.useState<string>('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      setSelectedBadge('')
      setSelectedUser('')
      setError(null)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBadge || !selectedUser || !user) return

    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error: insertError } = await supabase
        .from('badge_awards')
        .insert({
          badge_id: selectedBadge,
          user_id: selectedUser,
          awarded_by: user.id,
          demo_id: null,
        } as never)

      if (insertError) throw insertError

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to award badge')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedBadgeData = badges.find((b) => b.id === selectedBadge)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Award Badge</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Badge</Label>
            <Select value={selectedBadge} onValueChange={setSelectedBadge}>
              <SelectTrigger>
                <SelectValue placeholder="Select a badge" />
              </SelectTrigger>
              <SelectContent>
                {badges.map((badge) => (
                  <SelectItem key={badge.id} value={badge.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: badge.color }}
                      >
                        <Award className="h-2.5 w-2.5 text-white" />
                      </div>
                      {badge.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedBadgeData?.description && (
              <p className="text-xs text-muted-foreground">
                {selectedBadgeData.description}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Participant</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Select a participant" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={profile.avatar_url || ''} />
                        <AvatarFallback className="text-[10px]">
                          {getInitials(profile.name)}
                        </AvatarFallback>
                      </Avatar>
                      {profile.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Button
              type="submit"
              disabled={isSubmitting || !selectedBadge || !selectedUser}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Award Badge
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
