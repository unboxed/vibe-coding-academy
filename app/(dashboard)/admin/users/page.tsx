"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import { getInitials } from "@/lib/utils"
import type { Profile, UserRole } from "@/types/database"

export default function AdminUsersPage() {
  const { profile: currentProfile } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    if (!currentProfile || currentProfile.role !== "admin") {
      if (currentProfile?.role === "facilitator") {
        // Facilitators can view but not edit
      } else {
        router.push("/")
        return
      }
    }

    const fetchProfiles = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("name")

      setProfiles(data || [])
      setIsLoading(false)
    }

    fetchProfiles()
  }, [currentProfile])

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (currentProfile?.role !== "admin") return

    setUpdatingId(userId)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId)

      if (error) throw error

      setProfiles(
        profiles.map((p) => (p.id === userId ? { ...p, role: newRole } : p))
      )
    } catch (err) {
      console.error("Failed to update role:", err)
    } finally {
      setUpdatingId(null)
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

  const isAdmin = currentProfile?.role === "admin"

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

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Manage Users</h1>
        <p className="text-muted-foreground mt-2">
          {isAdmin
            ? "View and manage participant roles"
            : "View participant list"}
        </p>
      </div>

      <div className="space-y-3">
        {profiles.map((profile) => (
          <Card key={profile.id}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <Link href={`/people/${profile.id}`}>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={profile.avatar_url || ""}
                        alt={profile.name}
                      />
                      <AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{profile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {profile.email}
                      </p>
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-3">
                  {isAdmin ? (
                    <Select
                      value={profile.role}
                      onValueChange={(value: UserRole) =>
                        handleRoleChange(profile.id, value)
                      }
                      disabled={
                        updatingId === profile.id ||
                        profile.id === currentProfile?.id
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="facilitator">Facilitator</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="secondary">{profile.role}</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {profiles.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No users found.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
