"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Award, Plus } from "lucide-react"
import { getInitials } from "@/lib/utils"
import type { Badge as BadgeType, Profile } from "@/types/database"

export default function AdminBadgesPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [badges, setBadges] = useState<BadgeType[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [awardDialogOpen, setAwardDialogOpen] = useState(false)
  const [selectedBadge, setSelectedBadge] = useState<string>("")
  const [selectedUser, setSelectedUser] = useState<string>("")
  const [isAwarding, setIsAwarding] = useState(false)
  const [awardError, setAwardError] = useState<string | null>(null)

  useEffect(() => {
    if (!profile || !["admin", "facilitator"].includes(profile.role)) {
      router.push("/")
      return
    }

    const fetchData = async () => {
      const [{ data: badgesData }, { data: profilesData }] = await Promise.all([
        supabase.from("badges").select("*").order("name"),
        supabase.from("profiles").select("*").order("name"),
      ])

      setBadges(badgesData || [])
      setProfiles(profilesData || [])
      setIsLoading(false)
    }

    fetchData()
  }, [profile])

  const handleAwardBadge = async () => {
    if (!selectedBadge || !selectedUser || !user) return

    setIsAwarding(true)
    setAwardError(null)

    try {
      const { error } = await supabase.from("badge_awards").insert({
        badge_id: selectedBadge,
        user_id: selectedUser,
        awarded_by: user.id,
      })

      if (error) throw error

      setAwardDialogOpen(false)
      setSelectedBadge("")
      setSelectedUser("")
      router.refresh()
    } catch (err) {
      setAwardError(err instanceof Error ? err.message : "Failed to award badge")
    } finally {
      setIsAwarding(false)
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Award Badges</h1>
          <p className="text-muted-foreground mt-2">
            Recognize participant achievements
          </p>
        </div>

        <Dialog open={awardDialogOpen} onOpenChange={setAwardDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Award Badge
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Award Badge</DialogTitle>
              <DialogDescription>
                Select a badge and participant to award
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {awardError && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {awardError}
                </div>
              )}

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
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: badge.color }}
                          />
                          {badge.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Participant</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a participant" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAwardDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAwardBadge}
                disabled={!selectedBadge || !selectedUser || isAwarding}
              >
                {isAwarding ? "Awarding..." : "Award Badge"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {badges.map((badge) => (
          <Card key={badge.id}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: badge.color }}
                >
                  <Award className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{badge.name}</h3>
                  {badge.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {badge.description}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
